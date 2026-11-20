package service

import (
	"context"
	"encoding/json"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/purbalinggakab/e-form-purbalingga/internal/domain"
	"github.com/purbalinggakab/e-form-purbalingga/internal/repository"
	"github.com/purbalinggakab/e-form-purbalingga/internal/utils"
)

var slugPattern = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)

var allowedFormStatuses = map[string]bool{
	"DRAFT":     true,
	"PUBLISHED": true,
	"CLOSED":    true,
	"ARCHIVED":  true,
}

type FormInput struct {
	Title       string
	Slug        string
	Description *string
	BannerURL   *string
	Status      string
	Schema      json.RawMessage
	Settings    json.RawMessage
	OPDID       *uuid.UUID
}

type FormListParams struct {
	Page   int
	Limit  int
	Status string
	Search string
	OPDID  *uuid.UUID
}

type AdminFormService interface {
	List(ctx context.Context, user *domain.AuthUser, params FormListParams) ([]domain.FormSummary, int, error)
	Get(ctx context.Context, user *domain.AuthUser, formID uuid.UUID) (*domain.AdminForm, error)
	Create(ctx context.Context, user *domain.AuthUser, input FormInput) (*domain.AdminForm, error)
	Update(ctx context.Context, user *domain.AuthUser, formID uuid.UUID, input FormInput) (*domain.AdminForm, error)
	UpdateStatus(ctx context.Context, user *domain.AuthUser, formID uuid.UUID, status string) (*domain.AdminForm, error)
	Delete(ctx context.Context, user *domain.AuthUser, formID uuid.UUID) error
}

type adminFormService struct {
	db    *sqlx.DB
	forms *repository.FormRepository
	opds  *repository.OPDRepository
}

func NewAdminFormService(db *sqlx.DB, forms *repository.FormRepository, opds *repository.OPDRepository) AdminFormService {
	return &adminFormService{db: db, forms: forms, opds: opds}
}

func (s *adminFormService) List(ctx context.Context, user *domain.AuthUser, params FormListParams) ([]domain.FormSummary, int, error) {
	if user == nil {
		return nil, 0, domain.NewAppError(401, "UNAUTHORIZED", "Sesi tidak valid", nil)
	}

	opdID := params.OPDID
	if user.Role != "SUPER_ADMIN" {
		if user.OPDID == nil {
			return nil, 0, domain.NewAppError(403, "FORBIDDEN", "Akun Anda tidak terhubung dengan OPD", nil)
		}
		opdID = user.OPDID
	}

	status := strings.ToUpper(strings.TrimSpace(params.Status))
	if status != "" && !allowedFormStatuses[status] {
		return nil, 0, domain.BadRequest("INVALID_STATUS", "Status formulir tidak valid", nil)
	}

	return s.forms.List(ctx, repository.FormListFilter{
		Search: params.Search,
		Status: status,
		OPDID:  opdID,
		Page:   params.Page,
		Limit:  params.Limit,
	})
}

func (s *adminFormService) Get(ctx context.Context, user *domain.AuthUser, formID uuid.UUID) (*domain.AdminForm, error) {
	form, err := s.forms.GetByID(ctx, formID)
	if err != nil {
		return nil, domain.Internal("Gagal mengambil formulir")
	}
	if form == nil {
		return nil, domain.NotFound("Formulir tidak ditemukan")
	}
	if !canAccessForm(user, form) {
		return nil, domain.NotFound("Formulir tidak ditemukan")
	}
	return s.toAdminForm(ctx, form)
}

func (s *adminFormService) Create(ctx context.Context, user *domain.AuthUser, input FormInput) (*domain.AdminForm, error) {
	if user == nil {
		return nil, domain.NewAppError(401, "UNAUTHORIZED", "Sesi tidak valid", nil)
	}

	opdID, err := resolveOPDForForm(user, input.OPDID)
	if err != nil {
		return nil, err
	}
	if _, err := s.opds.GetByID(ctx, opdID); err != nil {
		return nil, domain.Internal("Gagal memeriksa OPD")
	}

	normalized, err := normalizeFormInput(input, "DRAFT")
	if err != nil {
		return nil, err
	}
	if normalized.Status == "PUBLISHED" {
		if details := utils.ValidateSchema(normalized.Schema, true); len(details) > 0 {
			return nil, domain.Unprocessable("VALIDATION_ERROR", "Schema formulir belum valid untuk dipublikasikan", details)
		}
	} else if details := utils.ValidateSchema(normalized.Schema, false); len(details) > 0 {
		return nil, domain.Unprocessable("VALIDATION_ERROR", "Struktur schema formulir tidak valid", details)
	}

	existing, err := s.forms.GetBySlug(ctx, normalized.Slug)
	if err != nil {
		return nil, domain.Internal("Gagal memeriksa slug formulir")
	}
	if existing != nil {
		return nil, domain.Conflict("SLUG_EXISTS", "Slug formulir sudah digunakan")
	}

	form := &domain.Form{
		ID:          uuid.New(),
		OPDID:       opdID,
		CreatorID:   user.ID,
		Slug:        normalized.Slug,
		Title:       normalized.Title,
		Description: normalized.Description,
		BannerURL:   normalized.BannerURL,
		Status:      normalized.Status,
		Schema:      normalized.Schema,
		Settings:    normalized.Settings,
		StartDate:   normalized.StartDate,
		EndDate:     normalized.EndDate,
	}

	tx, err := s.db.BeginTxx(ctx, nil)
	if err != nil {
		return nil, domain.Internal("Gagal memulai transaksi formulir")
	}
	committed := false
	defer func() {
		if !committed {
			_ = tx.Rollback()
		}
	}()

	if err := s.forms.CreateTx(ctx, tx, form); err != nil {
		return nil, domain.Internal("Gagal menyimpan formulir")
	}
	if err := tx.Commit(); err != nil {
		return nil, domain.Internal("Gagal menyelesaikan transaksi formulir")
	}
	committed = true

	return s.toAdminForm(ctx, form)
}

func (s *adminFormService) Update(ctx context.Context, user *domain.AuthUser, formID uuid.UUID, input FormInput) (*domain.AdminForm, error) {
	form, err := s.forms.GetByID(ctx, formID)
	if err != nil {
		return nil, domain.Internal("Gagal mengambil formulir")
	}
	if form == nil || !canAccessForm(user, form) {
		return nil, domain.NotFound("Formulir tidak ditemukan")
	}
	if form.Status == "ARCHIVED" {
		return nil, domain.Conflict("FORM_ARCHIVED", "Formulir yang diarsipkan tidak dapat diubah. Pulihkan statusnya terlebih dahulu.")
	}

	opdID := form.OPDID
	if input.OPDID != nil {
		requested, resolveErr := resolveOPDForForm(user, input.OPDID)
		if resolveErr != nil {
			return nil, resolveErr
		}
		opdID = requested
	}

	status := normalizedStatus(input.Status, form.Status)
	normalized, err := normalizeFormInput(input, status)
	if err != nil {
		return nil, err
	}

	existing, err := s.forms.GetBySlug(ctx, normalized.Slug)
	if err != nil {
		return nil, domain.Internal("Gagal memeriksa slug formulir")
	}
	if existing != nil && existing.ID != form.ID {
		return nil, domain.Conflict("SLUG_EXISTS", "Slug formulir sudah digunakan")
	}

	if normalized.Status == "PUBLISHED" {
		if details := utils.ValidateSchema(normalized.Schema, true); len(details) > 0 {
			return nil, domain.Unprocessable("VALIDATION_ERROR", "Schema formulir belum valid untuk dipublikasikan", details)
		}
	} else {
		if details := utils.ValidateSchema(normalized.Schema, false); len(details) > 0 {
			return nil, domain.Unprocessable("VALIDATION_ERROR", "Struktur schema formulir tidak valid", details)
		}
	}

	form.OPDID = opdID
	form.Slug = normalized.Slug
	form.Title = normalized.Title
	form.Description = normalized.Description
	form.BannerURL = normalized.BannerURL
	form.Status = normalized.Status
	form.Schema = normalized.Schema
	form.Settings = normalized.Settings
	form.StartDate = normalized.StartDate
	form.EndDate = normalized.EndDate

	tx, err := s.db.BeginTxx(ctx, nil)
	if err != nil {
		return nil, domain.Internal("Gagal memulai transaksi formulir")
	}
	committed := false
	defer func() {
		if !committed {
			_ = tx.Rollback()
		}
	}()

	if err := s.forms.UpdateTx(ctx, tx, form); err != nil {
		return nil, domain.Internal("Gagal memperbarui formulir")
	}
	if err := tx.Commit(); err != nil {
		return nil, domain.Internal("Gagal menyelesaikan transaksi formulir")
	}
	committed = true

	return s.toAdminForm(ctx, form)
}

func (s *adminFormService) UpdateStatus(ctx context.Context, user *domain.AuthUser, formID uuid.UUID, status string) (*domain.AdminForm, error) {
	status = strings.ToUpper(strings.TrimSpace(status))
	if !allowedFormStatuses[status] {
		return nil, domain.BadRequest("INVALID_STATUS", "Status formulir tidak valid", nil)
	}

	form, err := s.forms.GetByID(ctx, formID)
	if err != nil {
		return nil, domain.Internal("Gagal mengambil formulir")
	}
	if form == nil || !canAccessForm(user, form) {
		return nil, domain.NotFound("Formulir tidak ditemukan")
	}
	if status == "PUBLISHED" {
		if details := utils.ValidateSchema(form.Schema, true); len(details) > 0 {
			return nil, domain.Unprocessable("VALIDATION_ERROR", "Formulir belum memenuhi syarat untuk dipublikasikan", details)
		}
	}
	if status == form.Status {
		return s.toAdminForm(ctx, form)
	}

	tx, err := s.db.BeginTxx(ctx, nil)
	if err != nil {
		return nil, domain.Internal("Gagal memulai transaksi formulir")
	}
	committed := false
	defer func() {
		if !committed {
			_ = tx.Rollback()
		}
	}()

	if err := s.forms.UpdateStatusTx(ctx, tx, form.ID, status); err != nil {
		return nil, domain.Internal("Gagal memperbarui status formulir")
	}
	if err := tx.Commit(); err != nil {
		return nil, domain.Internal("Gagal menyelesaikan transaksi formulir")
	}
	committed = true
	form.Status = status

	return s.toAdminForm(ctx, form)
}

func (s *adminFormService) Delete(ctx context.Context, user *domain.AuthUser, formID uuid.UUID) error {
	form, err := s.forms.GetByID(ctx, formID)
	if err != nil {
		return domain.Internal("Gagal mengambil formulir")
	}
	if form == nil || !canAccessForm(user, form) {
		return domain.NotFound("Formulir tidak ditemukan")
	}
	if form.TotalResponses > 0 {
		return domain.Conflict("FORM_HAS_RESPONSES", "Formulir yang sudah memiliki respons tidak dapat dihapus. Arsipkan saja.")
	}
	if form.Status != "DRAFT" {
		return domain.Conflict("FORM_NOT_DRAFT", "Hanya formulir berstatus draft yang dapat dihapus")
	}

	tx, err := s.db.BeginTxx(ctx, nil)
	if err != nil {
		return domain.Internal("Gagal memulai transaksi formulir")
	}
	committed := false
	defer func() {
		if !committed {
			_ = tx.Rollback()
		}
	}()

	if err := s.forms.DeleteTx(ctx, tx, form.ID); err != nil {
		return domain.Internal("Gagal menghapus formulir")
	}
	if err := tx.Commit(); err != nil {
		return domain.Internal("Gagal menyelesaikan transaksi formulir")
	}
	committed = true
	return nil
}

type normalizedFormInput struct {
	Slug        string
	Title       string
	Description *string
	BannerURL   *string
	Status      string
	Schema      json.RawMessage
	Settings    json.RawMessage
	StartDate   *time.Time
	EndDate     *time.Time
}

func normalizeFormInput(input FormInput, fallbackStatus string) (*normalizedFormInput, error) {
	title := strings.TrimSpace(input.Title)
	if title == "" {
		return nil, domain.Unprocessable("VALIDATION_ERROR", "Judul formulir wajib diisi", []utils.ValidationDetail{{Field: "title", Issue: "Judul formulir wajib diisi"}})
	}
	if len(title) > 255 {
		return nil, domain.Unprocessable("VALIDATION_ERROR", "Judul formulir terlalu panjang", []utils.ValidationDetail{{Field: "title", Issue: "Maksimal 255 karakter"}})
	}

	slug := strings.ToLower(strings.TrimSpace(input.Slug))
	if slug == "" {
		return nil, domain.Unprocessable("VALIDATION_ERROR", "Slug formulir wajib diisi", []utils.ValidationDetail{{Field: "slug", Issue: "Slug formulir wajib diisi"}})
	}
	if len(slug) < 3 || len(slug) > 150 || !slugPattern.MatchString(slug) {
		return nil, domain.Unprocessable("VALIDATION_ERROR", "Format slug tidak valid", []utils.ValidationDetail{{Field: "slug", Issue: "Gunakan huruf kecil, angka, dan tanda hubung (3-150 karakter)"}})
	}

	status := normalizedStatus(input.Status, fallbackStatus)
	if !allowedFormStatuses[status] {
		return nil, domain.BadRequest("INVALID_STATUS", "Status formulir tidak valid", nil)
	}

	schema := normalizeJSON(input.Schema, json.RawMessage(`{"version":"1.0","sections":[]}`))
	settings := normalizeJSON(input.Settings, json.RawMessage(`{"is_public":true,"require_nik":false,"one_response_per_nik":false,"max_submissions":0}`))

	var parsedSettings domain.FormSettings
	if err := json.Unmarshal(settings, &parsedSettings); err != nil {
		return nil, domain.Unprocessable("VALIDATION_ERROR", "Pengaturan formulir tidak valid", []utils.ValidationDetail{{Field: "settings", Issue: "Format pengaturan tidak valid"}})
	}
	if parsedSettings.MaxSubmissions < 0 {
		return nil, domain.Unprocessable("VALIDATION_ERROR", "Kuota respons tidak valid", []utils.ValidationDetail{{Field: "settings.max_submissions", Issue: "Kuota tidak boleh negatif"}})
	}
	if parsedSettings.StartDate != nil && parsedSettings.EndDate != nil && parsedSettings.EndDate.Before(*parsedSettings.StartDate) {
		return nil, domain.Unprocessable("VALIDATION_ERROR", "Tanggal formulir tidak valid", []utils.ValidationDetail{{Field: "settings.end_date", Issue: "Tanggal berakhir harus setelah tanggal mulai"}})
	}

	return &normalizedFormInput{
		Slug:        slug,
		Title:       title,
		Description: cleanOptionalString(input.Description),
		BannerURL:   cleanOptionalString(input.BannerURL),
		Status:      status,
		Schema:      schema,
		Settings:    settings,
		StartDate:   parsedSettings.StartDate,
		EndDate:     parsedSettings.EndDate,
	}, nil
}

func (s *adminFormService) toAdminForm(ctx context.Context, form *domain.Form) (*domain.AdminForm, error) {
	opd, err := s.opds.GetByID(ctx, form.OPDID)
	if err != nil {
		return nil, domain.Internal("Gagal mengambil data OPD")
	}
	summary := domain.FormSummary{
		ID:             form.ID,
		OPDID:          form.OPDID,
		CreatorID:      form.CreatorID,
		Slug:           form.Slug,
		Title:          form.Title,
		Description:    form.Description,
		BannerURL:      form.BannerURL,
		Status:         form.Status,
		TotalResponses: form.TotalResponses,
		StartDate:      form.StartDate,
		EndDate:        form.EndDate,
		CreatedAt:      form.CreatedAt,
		UpdatedAt:      form.UpdatedAt,
	}
	if opd != nil {
		summary.OPD = domain.OPDSummary{
			ID:        opd.ID,
			KodeOPD:   opd.KodeOPD,
			NamaOPD:   opd.NamaOPD,
			Singkatan: opd.Singkatan,
		}
	}
	return &domain.AdminForm{
		FormSummary: summary,
		Schema:      form.Schema,
		Settings:    form.Settings,
	}, nil
}

func resolveOPDForForm(user *domain.AuthUser, requested *uuid.UUID) (uuid.UUID, error) {
	if user == nil {
		return uuid.Nil, domain.NewAppError(401, "UNAUTHORIZED", "Sesi tidak valid", nil)
	}
	if user.Role == "SUPER_ADMIN" {
		if requested != nil {
			return *requested, nil
		}
		if user.OPDID == nil {
			return uuid.Nil, domain.Unprocessable("VALIDATION_ERROR", "OPD wajib dipilih", []utils.ValidationDetail{{Field: "opd_id", Issue: "OPD wajib dipilih"}})
		}
		return *user.OPDID, nil
	}
	if user.OPDID == nil {
		return uuid.Nil, domain.NewAppError(403, "FORBIDDEN", "Akun Anda tidak terhubung dengan OPD", nil)
	}
	return *user.OPDID, nil
}

func canAccessForm(user *domain.AuthUser, form *domain.Form) bool {
	if user == nil || form == nil {
		return false
	}
	if user.Role == "SUPER_ADMIN" {
		return true
	}
	return user.OPDID != nil && *user.OPDID == form.OPDID
}

func normalizedStatus(value, fallback string) string {
	status := strings.ToUpper(strings.TrimSpace(value))
	if status == "" {
		status = strings.ToUpper(strings.TrimSpace(fallback))
	}
	if status == "" {
		return "DRAFT"
	}
	return status
}

func normalizeJSON(value, fallback json.RawMessage) json.RawMessage {
	trimmed := strings.TrimSpace(string(value))
	if trimmed == "" || trimmed == "null" {
		return fallback
	}
	return json.RawMessage(trimmed)
}

func cleanOptionalString(value *string) *string {
	if value == nil {
		return nil
	}
	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}
