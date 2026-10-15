package service

import (
	"context"
	"encoding/json"
	"errors"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/purbalinggakab/e-form-purbalingga/internal/domain"
	"github.com/purbalinggakab/e-form-purbalingga/internal/repository"
)

// Error sentinel modul formulir.
var (
	ErrFormNotFound  = errors.New("formulir tidak ditemukan")
	ErrFormForbidden = errors.New("anda tidak memiliki akses ke formulir ini")
	ErrSlugConflict  = errors.New("slug formulir sudah digunakan")
	ErrInvalidInput  = errors.New("data formulir tidak valid")
)

var validFormStatuses = map[string]struct{}{
	"DRAFT":     {},
	"PUBLISHED": {},
	"CLOSED":    {},
	"ARCHIVED":  {},
}

// Actor merepresentasikan pengguna terautentikasi yang menjalankan aksi.
type Actor struct {
	UserID uuid.UUID
	Role   string
	OPDID  *uuid.UUID
}

// FormService adalah kontrak logika bisnis modul formulir.
type FormService interface {
	List(ctx context.Context, actor Actor, q domain.FormListQuery) (*domain.FormListResponse, error)
	Create(ctx context.Context, actor Actor, req domain.CreateFormRequest) (*domain.FormDetail, error)
	Get(ctx context.Context, actor Actor, id uuid.UUID) (*domain.FormDetail, error)
	Update(ctx context.Context, actor Actor, id uuid.UUID, req domain.UpdateFormRequest) (*domain.FormDetail, error)
	UpdateStatus(ctx context.Context, actor Actor, id uuid.UUID, status string) (*domain.FormDetail, error)
	Delete(ctx context.Context, actor Actor, id uuid.UUID) error
}

type formService struct {
	formRepo repository.FormRepository
}

// NewFormService membuat instance service formulir.
func NewFormService(formRepo repository.FormRepository) FormService {
	return &formService{formRepo: formRepo}
}

func (s *formService) List(ctx context.Context, actor Actor, q domain.FormListQuery) (*domain.FormListResponse, error) {
	if q.Page < 1 {
		q.Page = 1
	}
	if q.Limit < 1 {
		q.Limit = 10
	}
	if q.Limit > 100 {
		q.Limit = 100
	}
	if q.Status != "" {
		if _, ok := validFormStatuses[q.Status]; !ok {
			return nil, ErrInvalidInput
		}
	}

	var opdID *uuid.UUID
	if !isSuperAdmin(actor) {
		if actor.OPDID == nil {
			return nil, ErrFormForbidden
		}
		opdID = actor.OPDID
	}

	forms, total, err := s.formRepo.ListByOPD(ctx, opdID, q)
	if err != nil {
		return nil, err
	}

	items := make([]domain.FormSummary, 0, len(forms))
	for i := range forms {
		items = append(items, toSummary(&forms[i]))
	}

	return &domain.FormListResponse{
		Items: items,
		Page:  q.Page,
		Limit: q.Limit,
		Total: total,
	}, nil
}

func (s *formService) Create(ctx context.Context, actor Actor, req domain.CreateFormRequest) (*domain.FormDetail, error) {
	title := strings.TrimSpace(req.Title)
	if title == "" || actor.OPDID == nil {
		return nil, ErrInvalidInput
	}

	status := req.Status
	if status == "" {
		status = "DRAFT"
	}
	if _, ok := validFormStatuses[status]; !ok {
		return nil, ErrInvalidInput
	}

	schema, err := normalizeJSON(req.Schema, []byte(`{"sections":[]}`))
	if err != nil {
		return nil, ErrInvalidInput
	}
	settings, err := normalizeJSON(req.Settings, []byte(`{}`))
	if err != nil {
		return nil, ErrInvalidInput
	}

	start, end, err := extractDates(settings)
	if err != nil {
		return nil, ErrInvalidInput
	}

	slug := strings.TrimSpace(req.Slug)
	if slug == "" {
		slug = generateSlug(title)
	}

	form := &domain.Form{
		ID:          uuid.New(),
		OPDID:       *actor.OPDID,
		CreatorID:   actor.UserID,
		Slug:        slug,
		Title:       title,
		Description: req.Description,
		BannerURL:   req.BannerURL,
		Status:      status,
		Schema:      schema,
		Settings:    settings,
		StartDate:   start,
		EndDate:     end,
	}

	if err := s.formRepo.Create(ctx, form); err != nil {
		if errors.Is(err, repository.ErrSlugConflict) {
			return nil, ErrSlugConflict
		}
		return nil, err
	}

	return toDetail(form), nil
}

func (s *formService) Get(ctx context.Context, actor Actor, id uuid.UUID) (*domain.FormDetail, error) {
	form, err := s.loadAccessible(ctx, actor, id)
	if err != nil {
		return nil, err
	}
	return toDetail(form), nil
}

func (s *formService) Update(ctx context.Context, actor Actor, id uuid.UUID, req domain.UpdateFormRequest) (*domain.FormDetail, error) {
	form, err := s.loadAccessible(ctx, actor, id)
	if err != nil {
		return nil, err
	}

	if req.Title != nil {
		title := strings.TrimSpace(*req.Title)
		if title == "" {
			return nil, ErrInvalidInput
		}
		form.Title = title
	}
	if req.Slug != nil {
		slug := strings.TrimSpace(*req.Slug)
		if slug == "" {
			return nil, ErrInvalidInput
		}
		form.Slug = slug
	}
	if req.Description != nil {
		form.Description = req.Description
	}
	if req.BannerURL != nil {
		form.BannerURL = req.BannerURL
	}
	if req.Status != nil {
		if _, ok := validFormStatuses[*req.Status]; !ok {
			return nil, ErrInvalidInput
		}
		form.Status = *req.Status
	}
	if len(req.Schema) > 0 {
		schema, err := normalizeJSON(req.Schema, nil)
		if err != nil {
			return nil, ErrInvalidInput
		}
		form.Schema = schema
	}
	if len(req.Settings) > 0 {
		settings, err := normalizeJSON(req.Settings, []byte(`{}`))
		if err != nil {
			return nil, ErrInvalidInput
		}
		start, end, err := extractDates(settings)
		if err != nil {
			return nil, ErrInvalidInput
		}
		form.Settings = settings
		form.StartDate = start
		form.EndDate = end
	}

	if err := s.formRepo.Update(ctx, form); err != nil {
		if errors.Is(err, repository.ErrSlugConflict) {
			return nil, ErrSlugConflict
		}
		return nil, err
	}

	return toDetail(form), nil
}

func (s *formService) UpdateStatus(ctx context.Context, actor Actor, id uuid.UUID, status string) (*domain.FormDetail, error) {
	if _, ok := validFormStatuses[status]; !ok {
		return nil, ErrInvalidInput
	}

	form, err := s.loadAccessible(ctx, actor, id)
	if err != nil {
		return nil, err
	}

	if err := s.formRepo.UpdateStatus(ctx, id, status); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrFormNotFound
		}
		return nil, err
	}
	form.Status = status

	return toDetail(form), nil
}

func (s *formService) Delete(ctx context.Context, actor Actor, id uuid.UUID) error {
	if _, err := s.loadAccessible(ctx, actor, id); err != nil {
		return err
	}
	if err := s.formRepo.Delete(ctx, id); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return ErrFormNotFound
		}
		return err
	}
	return nil
}

func (s *formService) loadAccessible(ctx context.Context, actor Actor, id uuid.UUID) (*domain.Form, error) {
	form, err := s.formRepo.FindByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrFormNotFound
		}
		return nil, err
	}
	if !canAccess(actor, form) {
		return nil, ErrFormForbidden
	}
	return form, nil
}

func isSuperAdmin(actor Actor) bool {
	return actor.Role == "SUPER_ADMIN"
}

func canAccess(actor Actor, form *domain.Form) bool {
	if isSuperAdmin(actor) {
		return true
	}
	return actor.OPDID != nil && form.OPDID == *actor.OPDID
}

func toSummary(form *domain.Form) domain.FormSummary {
	return domain.FormSummary{
		ID:             form.ID,
		Slug:           form.Slug,
		Title:          form.Title,
		Description:    form.Description,
		Status:         form.Status,
		TotalResponses: form.TotalResponses,
		StartDate:      form.StartDate,
		EndDate:        form.EndDate,
		CreatedAt:      form.CreatedAt,
		UpdatedAt:      form.UpdatedAt,
	}
}

func toDetail(form *domain.Form) *domain.FormDetail {
	return &domain.FormDetail{
		FormSummary: toSummary(form),
		BannerURL:   form.BannerURL,
		Schema:      form.Schema,
		Settings:    form.Settings,
	}
}

func normalizeJSON(raw json.RawMessage, fallback []byte) (json.RawMessage, error) {
	if len(raw) == 0 || strings.TrimSpace(string(raw)) == "null" {
		if fallback == nil {
			return json.RawMessage(`{}`), nil
		}
		return json.RawMessage(fallback), nil
	}
	if !json.Valid(raw) {
		return nil, ErrInvalidInput
	}
	return raw, nil
}

func extractDates(settings json.RawMessage) (*time.Time, *time.Time, error) {
	var parsed struct {
		StartDate *string `json:"start_date"`
		EndDate   *string `json:"end_date"`
	}
	if err := json.Unmarshal(settings, &parsed); err != nil {
		return nil, nil, err
	}

	parse := func(v *string) (*time.Time, error) {
		if v == nil || strings.TrimSpace(*v) == "" {
			return nil, nil
		}
		t, err := time.Parse(time.RFC3339, *v)
		if err != nil {
			return nil, err
		}
		return &t, nil
	}

	start, err := parse(parsed.StartDate)
	if err != nil {
		return nil, nil, err
	}
	end, err := parse(parsed.EndDate)
	if err != nil {
		return nil, nil, err
	}
	return start, end, nil
}

var slugSeparator = regexp.MustCompile(`[^a-z0-9]+`)

func generateSlug(title string) string {
	base := strings.ToLower(strings.TrimSpace(title))
	base = slugSeparator.ReplaceAllString(base, "-")
	base = strings.Trim(base, "-")
	if base == "" {
		base = "form"
	}
	suffix := strings.ReplaceAll(uuid.NewString(), "-", "")[:8]
	return base + "-" + suffix
}
