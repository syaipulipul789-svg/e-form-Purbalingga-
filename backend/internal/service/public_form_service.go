package service

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
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
			ID:        opd.ID,
			KodeOPD:   opd.KodeOPD,
			NamaOPD:   opd.NamaOPD,
			Singkatan: opd.Singkatan,
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
}
