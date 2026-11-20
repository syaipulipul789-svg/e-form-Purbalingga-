package service

import (
	"context"
<<<<<<< HEAD
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
=======
>>>>>>> 07c00404be99e7853df025b53dea2a67f4023a33
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
<<<<<<< HEAD
	"github.com/purbalinggakab/e-form-purbalingga/internal/domain"
	"github.com/purbalinggakab/e-form-purbalingga/internal/repository"
)

var (
	ErrNIKFieldMissing = errors.New("formulir tidak memiliki kolom NIK")
	ErrFormClosed      = errors.New("formulir tidak menerima respons")
)

type FormClosedError struct {
	Reason string
}

func (e *FormClosedError) Error() string {
	return e.Reason
}

type ValidationError struct {
	Fields map[string]string
}

func (e *ValidationError) Error() string {
	return "data yang dikirim tidak valid"
}

type formSettings struct {
	RequireNIK        bool `json:"require_nik"`
	OneResponsePerNIK bool `json:"one_response_per_nik"`
	MaxSubmissions    int  `json:"max_submissions"`
}

// PublicFormService adalah kontrak logika formulir yang diakses publik.
type PublicFormService interface {
	GetBySlug(ctx context.Context, slug string) (*domain.PublicFormDetail, error)
	Submit(ctx context.Context, slug string, req domain.PublicSubmitRequest, ipAddress, userAgent string) (*domain.PublicSubmitResponse, error)
	Track(ctx context.Context, registrationNumber, nik string) (*domain.PublicTrackResponse, error)
}

type publicFormService struct {
	formRepo     repository.FormRepository
	responseRepo repository.ResponseRepository
	opdRepo      repository.OPDRepository
	now          func() time.Time
}

// NewPublicFormService membuat instance service formulir publik.
func NewPublicFormService(formRepo repository.FormRepository, responseRepo repository.ResponseRepository, opdRepo repository.OPDRepository) PublicFormService {
	return &publicFormService{
		formRepo:     formRepo,
		responseRepo: responseRepo,
		opdRepo:      opdRepo,
		now:          time.Now,
	}
}

func (s *publicFormService) GetBySlug(ctx context.Context, slug string) (*domain.PublicFormDetail, error) {
	form, err := s.formRepo.FindBySlug(ctx, slug)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrFormNotFound
		}
		return nil, err
	}
	if form.Status != "PUBLISHED" && form.Status != "CLOSED" {
		return nil, ErrFormNotFound
	}

	settings, err := parseSettings(form.Settings)
	if err != nil {
		return nil, err
	}
	opd, err := s.opdRepo.FindByID(ctx, form.OPDID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrFormNotFound
		}
		return nil, err
	}

	isOpen, reason := s.openState(form, settings)
	detail := &domain.PublicFormDetail{
		FormSummary: toSummary(form),
		BannerURL:   form.BannerURL,
		Schema:      form.Schema,
		Settings:    form.Settings,
		OPD: domain.OPDSummary{
=======
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
>>>>>>> 07c00404be99e7853df025b53dea2a67f4023a33
			ID:        opd.ID,
			KodeOPD:   opd.KodeOPD,
			NamaOPD:   opd.NamaOPD,
			Singkatan: opd.Singkatan,
<<<<<<< HEAD
			LogoURL:   opd.LogoURL,
		},
		IsOpen: isOpen,
	}
	if !isOpen {
		detail.ClosedReason = &reason
	}
	return detail, nil
}

func (s *publicFormService) Submit(ctx context.Context, slug string, req domain.PublicSubmitRequest, ipAddress, userAgent string) (*domain.PublicSubmitResponse, error) {
	form, err := s.formRepo.FindBySlug(ctx, slug)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrFormNotFound
		}
		return nil, err
	}
	if form.Status != "PUBLISHED" {
		reason := "Formulir belum dipublikasikan"
		if form.Status == "CLOSED" || form.Status == "ARCHIVED" {
			reason = "Formulir sudah ditutup"
		}
		return nil, &FormClosedError{Reason: reason}
	}

	settings, err := parseSettings(form.Settings)
	if err != nil {
		return nil, err
	}
	if open, reason := s.openState(form, settings); !open {
		return nil, &FormClosedError{Reason: reason}
	}

	schema, err := parseSchema(form.Schema)
	if err != nil {
		return nil, err
	}
	answers, err := parseAnswers(req.Answers)
	if err != nil {
		return nil, &ValidationError{Fields: map[string]string{"answers": err.Error()}}
	}

	if fields := validateAnswers(schema, answers); len(fields) > 0 {
		return nil, &ValidationError{Fields: fields}
	}

	nikFieldID, nik := nikFromSchema(schema, answers)
	if nik == "" && strings.TrimSpace(req.RespondentNIK) != "" {
		nik = strings.TrimSpace(req.RespondentNIK)
		if msg := validateNIK(nik); msg != "" {
			return nil, &ValidationError{Fields: map[string]string{nikFieldID: msg}}
		}
	}
	if settings.RequireNIK && nik == "" {
		if nikFieldID == "" {
			return nil, ErrNIKFieldMissing
		}
		return nil, &ValidationError{Fields: map[string]string{nikFieldID: "NIK wajib diisi"}}
	}

	var identifier *string
	if nik != "" {
		hash := sha256.Sum256([]byte(nik))
		value := hex.EncodeToString(hash[:])
		identifier = &value
	}

	metadata, err := json.Marshal(map[string]interface{}{
		"ip_address": ipAddress,
		"user_agent": userAgent,
	})
	if err != nil {
		return nil, err
	}

	now := s.now()
	response := &domain.FormResponse{
		ID:                   uuid.New(),
		FormID:               form.ID,
		RespondentIdentifier: identifier,
		Answers:              req.Answers,
		Metadata:             metadata,
		SubmittedAt:          now,
	}

	var registrationNumber string
	for attempt := 0; attempt < 5; attempt++ {
		registrationNumber = generateRegistrationNumber(now)
		response.RegistrationNumber = &registrationNumber
		err = s.responseRepo.Create(ctx, form.ID, response, settings.OneResponsePerNIK, settings.MaxSubmissions)
		if err == nil {
			break
		}
		if errors.Is(err, repository.ErrRegistrationConflict) {
			continue
		}
		return nil, err
	}
	if err != nil {
		return nil, err
	}

	return &domain.PublicSubmitResponse{
		SubmissionID:       response.ID,
		RegistrationNumber: registrationNumber,
		SubmittedAt:        response.SubmittedAt,
	}, nil
}

func (s *publicFormService) Track(ctx context.Context, registrationNumber, nik string) (*domain.PublicTrackResponse, error) {
	registrationNumber = strings.ToUpper(strings.TrimSpace(registrationNumber))
	nik = strings.TrimSpace(nik)

	fields := map[string]string{}
	if registrationNumber == "" {
		fields["registration_number"] = "Nomor registrasi wajib diisi"
	}
	if message := validateNIK(nik); message != "" {
		fields["nik"] = message
	}
	if len(fields) > 0 {
		return nil, &ValidationError{Fields: fields}
	}

	hash := sha256.Sum256([]byte(nik))
	item, err := s.responseRepo.FindForTracking(ctx, registrationNumber, hex.EncodeToString(hash[:]))
	if err != nil {
		if errors.Is(err, repository.ErrSubmissionNotFound) {
			return nil, repository.ErrSubmissionNotFound
		}
		return nil, err
	}
	return item, nil
}

func (s *publicFormService) openState(form *domain.Form, settings formSettings) (bool, string) {
	now := s.now()
	if form.StartDate != nil && now.Before(*form.StartDate) {
		return false, "Formulir belum dibuka"
	}
	if form.EndDate != nil && now.After(*form.EndDate) {
		return false, "Formulir sudah ditutup"
	}
	if settings.MaxSubmissions > 0 && form.TotalResponses >= settings.MaxSubmissions {
		return false, "Kuota respons formulir sudah penuh"
	}
	return true, ""
}

func parseSettings(raw json.RawMessage) (formSettings, error) {
	var settings formSettings
	if len(raw) == 0 {
		return settings, nil
	}
	if err := json.Unmarshal(raw, &settings); err != nil {
		return settings, err
	}
	return settings, nil
}

func nikFromSchema(schema *formSchema, answers map[string]interface{}) (string, string) {
	for _, section := range schema.Sections {
		for _, field := range section.Fields {
			if field.Type != "nik" {
				continue
			}
			value, _ := answers[field.ID].(string)
			return field.ID, strings.TrimSpace(value)
		}
	}
	return "", ""
}

func generateRegistrationNumber(now time.Time) string {
	const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	buffer := make([]byte, 6)
	if _, err := rand.Read(buffer); err != nil {
		return fmt.Sprintf("PBG-%s-%s", now.Format("20060102"), strings.ToUpper(uuid.NewString()[:6]))
	}
	for i := range buffer {
		buffer[i] = alphabet[int(buffer[i])%len(alphabet)]
	}
	return fmt.Sprintf("PBG-%s-%s", now.Format("20060102"), string(buffer))
=======
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
>>>>>>> 07c00404be99e7853df025b53dea2a67f4023a33
}
