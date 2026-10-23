package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
	"github.com/purbalinggakab/e-form-purbalingga/internal/domain"
	"github.com/purbalinggakab/e-form-purbalingga/internal/repository"
	"github.com/purbalinggakab/e-form-purbalingga/internal/utils"
)

type SubmitInput struct {
	RespondentNIK string
	Answers       json.RawMessage
	IPAddress     string
	UserAgent     string
}

type PublicFormService interface {
	ListPublicForms(ctx context.Context) ([]domain.PublicForm, error)
	GetPublicForm(ctx context.Context, slug string) (*domain.PublicForm, error)
	SubmitResponse(ctx context.Context, slug, idempotencyKey string, input SubmitInput) (*domain.SubmitResult, error)
}

type publicFormService struct {
	db        *sqlx.DB
	forms     *repository.FormRepository
	responses *repository.ResponseRepository
	secret    string
}

func NewPublicFormService(db *sqlx.DB, forms *repository.FormRepository, responses *repository.ResponseRepository, secret string) PublicFormService {
	return &publicFormService{
		db:        db,
		forms:     forms,
		responses: responses,
		secret:    secret,
	}
}

func (s *publicFormService) ListPublicForms(ctx context.Context) ([]domain.PublicForm, error) {
	summaries, _, err := s.forms.List(ctx, repository.FormListFilter{Status: "PUBLISHED", Page: 1, Limit: 100})
	if err != nil {
		return nil, domain.Internal("Gagal mengambil daftar formulir publik")
	}

	items := make([]domain.PublicForm, 0, len(summaries))
	for _, summary := range summaries {
		form, err := s.GetPublicForm(ctx, summary.Slug)
		if err != nil {
			var appErr *domain.AppError
			if errors.As(err, &appErr) && appErr.Status == 404 {
				continue
			}
			return nil, err
		}
		items = append(items, *form)
	}
	return items, nil
}

func (s *publicFormService) GetPublicForm(ctx context.Context, slug string) (*domain.PublicForm, error) {
	form, err := s.forms.GetBySlug(ctx, strings.TrimSpace(slug))
	if err != nil {
		return nil, domain.Internal("Gagal mengambil formulir")
	}
	if form == nil || form.Status != "PUBLISHED" {
		return nil, domain.NotFound("Formulir tidak ditemukan atau belum dipublikasikan")
	}

	settings := parseFormSettings(form.Settings)
	if !settings.IsPublic {
		return nil, domain.NotFound("Formulir tidak tersedia untuk publik")
	}

	opd, err := s.forms.GetOPDByID(ctx, form.OPDID)
	if err != nil {
		return nil, domain.Internal("Gagal mengambil data OPD")
	}

	isOpen, reason := evaluateAvailability(form.Status, settings, form.TotalResponses, form.StartDate, form.EndDate)
	publicForm := &domain.PublicForm{
		ID:             form.ID,
		Slug:           form.Slug,
		Title:          form.Title,
		Description:    form.Description,
		BannerURL:      form.BannerURL,
		Status:         form.Status,
		Schema:         form.Schema,
		Settings:       form.Settings,
		TotalResponses: form.TotalResponses,
		StartDate:      effectiveStartDate(form.StartDate, settings),
		EndDate:        effectiveEndDate(form.EndDate, settings),
		IsOpen:         isOpen,
		ClosedReason:   reason,
	}
	if opd != nil {
		publicForm.OPD = domain.OPDSummary{
			ID:        opd.ID,
			KodeOPD:   opd.KodeOPD,
			NamaOPD:   opd.NamaOPD,
			Singkatan: opd.Singkatan,
		}
	}

	return publicForm, nil
}

func (s *publicFormService) SubmitResponse(ctx context.Context, slug, idempotencyKey string, input SubmitInput) (*domain.SubmitResult, error) {
	if strings.TrimSpace(slug) == "" {
		return nil, domain.BadRequest("INVALID_SLUG", "Slug formulir wajib diisi", nil)
	}
	if len(strings.TrimSpace(string(input.Answers))) == 0 {
		return nil, domain.BadRequest("INVALID_ANSWERS", "Isian formulir wajib dikirim", nil)
	}

	tx, err := s.db.BeginTxx(ctx, nil)
	if err != nil {
		return nil, domain.Internal("Gagal memulai transaksi penyimpanan")
	}
	committed := false
	defer func() {
		if !committed {
			_ = tx.Rollback()
		}
	}()

	form, err := s.forms.GetBySlugForUpdateTx(ctx, tx, slug)
	if err != nil {
		return nil, domain.Internal("Gagal mengambil formulir")
	}
	if form == nil {
		return nil, domain.NotFound("Formulir tidak ditemukan")
	}

	settings := parseFormSettings(form.Settings)
	if idempotencyKey != "" {
		existing, findErr := s.responses.FindByIdempotencyKeyTx(ctx, tx, form.ID, idempotencyKey)
		if findErr != nil {
			return nil, domain.Internal("Gagal memeriksa idempotensi pengiriman")
		}
		if existing != nil {
			if err := tx.Commit(); err != nil {
				return nil, domain.Internal("Gagal menyelesaikan transaksi")
			}
			committed = true
			return submitResultFromResponse(existing), nil
		}
	}

	if form.Status != "PUBLISHED" {
		return nil, domain.Conflict("FORM_CLOSED", "Formulir belum dipublikasikan atau sudah tidak aktif")
	}
	if !settings.IsPublic {
		return nil, domain.Conflict("FORM_CLOSED", "Formulir tidak tersedia untuk publik")
	}

	total, err := s.responses.CountByFormTx(ctx, tx, form.ID)
	if err != nil {
		return nil, domain.Internal("Gagal menghitung jumlah respons")
	}

	startDate := effectiveStartDate(form.StartDate, settings)
	endDate := effectiveEndDate(form.EndDate, settings)
	isOpen, reason := evaluateAvailability(form.Status, settings, total, startDate, endDate)
	if !isOpen {
		return nil, domain.Conflict("FORM_CLOSED", reason)
	}

	var answers map[string]any
	if err := json.Unmarshal(input.Answers, &answers); err != nil {
		return nil, domain.BadRequest("INVALID_ANSWERS", "Format isian formulir tidak valid", nil)
	}
	if details := utils.ValidateAnswers(form.Schema, answers); len(details) > 0 {
		return nil, domain.Unprocessable("VALIDATION_ERROR", "Validasi isian formulir gagal", details)
	}

	rawNIK := utils.NormalizeNIK(input.RespondentNIK)
	if rawNIK == "" {
		if value, ok := answers["f_nik"].(string); ok {
			rawNIK = utils.NormalizeNIK(value)
		}
	}
	if settings.RequireNIK && rawNIK == "" {
		return nil, domain.Unprocessable("NIK_REQUIRED", "NIK wajib diisi", []utils.ValidationDetail{{
			Field: "respondent_nik",
			Label: "NIK",
			Issue: "NIK wajib diisi",
		}})
	}
	if rawNIK != "" && !utils.IsValidNIK(rawNIK) {
		return nil, domain.Unprocessable("INVALID_NIK", "NIK tidak valid", []utils.ValidationDetail{{
			Field: "respondent_nik",
			Label: "NIK",
			Issue: "NIK harus 16 digit angka dan diawali kode Purbalingga 3303",
		}})
	}

	var respondentIdentifier *string
	if rawNIK != "" {
		hashed := utils.HashNIK(rawNIK, s.secret)
		respondentIdentifier = &hashed
	}

	if settings.OneResponsePerNIK && respondentIdentifier != nil {
		exists, existsErr := s.responses.ExistsByRespondentTx(ctx, tx, form.ID, *respondentIdentifier)
		if existsErr != nil {
			return nil, domain.Internal("Gagal memeriksa duplikasi NIK")
		}
		if exists {
			return nil, domain.Conflict("DUPLICATE_NIK", "NIK ini sudah pernah mengirim formulir tersebut")
		}
	}

	responseID := uuid.New()
	registrationNumber := utils.GenerateRegistrationNumber(responseID)
	metadata := map[string]string{
		"ip_address": input.IPAddress,
		"user_agent": input.UserAgent,
	}
	metadataJSON, _ := json.Marshal(metadata)

	var key *string
	if idempotencyKey != "" {
		key = &idempotencyKey
	}

	response := &domain.FormResponse{
		ID:                   responseID,
		FormID:               form.ID,
		RespondentIdentifier: respondentIdentifier,
		Answers:              json.RawMessage(input.Answers),
		Metadata:             metadataJSON,
		RegistrationNumber:   &registrationNumber,
		IdempotencyKey:       key,
	}

	if err := s.responses.CreateTx(ctx, tx, response); err != nil {
		var pqErr *pq.Error
		if errors.As(err, &pqErr) && pqErr.Code == "23505" && idempotencyKey != "" {
			existing, findErr := s.responses.FindByIdempotencyKeyTx(ctx, tx, form.ID, idempotencyKey)
			if findErr == nil && existing != nil {
				if commitErr := tx.Commit(); commitErr != nil {
					return nil, domain.Internal("Gagal menyelesaikan transaksi")
				}
				committed = true
				return submitResultFromResponse(existing), nil
			}
		}
		return nil, domain.Internal("Gagal menyimpan respons formulir")
	}

	if err := s.forms.IncrementTotalResponsesTx(ctx, tx, form.ID); err != nil {
		return nil, domain.Internal("Gagal memperbarui jumlah respons")
	}

	if err := tx.Commit(); err != nil {
		return nil, domain.Internal("Gagal menyelesaikan transaksi")
	}
	committed = true

	return submitResultFromResponse(response), nil
}

func parseFormSettings(raw json.RawMessage) domain.FormSettings {
	settings := domain.FormSettings{IsPublic: true}
	if len(raw) > 0 {
		_ = json.Unmarshal(raw, &settings)
	}
	return settings
}

func effectiveStartDate(columnDate *time.Time, settings domain.FormSettings) *time.Time {
	if columnDate != nil {
		return columnDate
	}
	return settings.StartDate
}

func effectiveEndDate(columnDate *time.Time, settings domain.FormSettings) *time.Time {
	if columnDate != nil {
		return columnDate
	}
	return settings.EndDate
}

func evaluateAvailability(status string, settings domain.FormSettings, total int, startDate, endDate *time.Time) (bool, string) {
	if status != "PUBLISHED" {
		return false, "Formulir belum dipublikasikan"
	}
	if !settings.IsPublic {
		return false, "Formulir tidak tersedia untuk publik"
	}

	now := time.Now()
	if startDate != nil && now.Before(*startDate) {
		return false, fmt.Sprintf("Formulir baru dibuka pada %s", startDate.Format("02 January 2006"))
	}
	if endDate != nil && now.After(*endDate) {
		return false, "Formulir sudah ditutup"
	}
	if settings.MaxSubmissions > 0 && total >= settings.MaxSubmissions {
		return false, "Kuota respons formulir sudah penuh"
	}

	return true, ""
}

func submitResultFromResponse(response *domain.FormResponse) *domain.SubmitResult {
	registrationNumber := ""
	if response.RegistrationNumber != nil {
		registrationNumber = *response.RegistrationNumber
	}
	return &domain.SubmitResult{
		SubmissionID:       response.ID,
		RegistrationNumber: registrationNumber,
		SubmittedAt:        response.SubmittedAt,
	}
}
