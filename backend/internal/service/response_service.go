package service

import (
	"context"
	"encoding/json"
	"errors"
	"strings"

	"github.com/google/uuid"
	"github.com/purbalinggakab/e-form-purbalingga/internal/domain"
	"github.com/purbalinggakab/e-form-purbalingga/internal/repository"
)

var (
	ErrInvalidResponseStatus   = errors.New("status pengajuan tidak valid")
	ErrInvalidStatusTransition = errors.New("perubahan status pengajuan tidak diizinkan")
	ErrPublicNoteRequired      = errors.New("catatan untuk warga wajib diisi saat menolak pengajuan")
)

var validResponseStatuses = map[string]struct{}{
	"SUBMITTED": {},
	"VERIFIED":  {},
	"APPROVED":  {},
	"REJECTED":  {},
}

// ResponseService adalah kontrak logika daftar dan verifikasi respons formulir.
type ResponseService interface {
	List(ctx context.Context, actor Actor, formID uuid.UUID, q domain.FormResponseListQuery) (*domain.FormResponseListResponse, error)
	Get(ctx context.Context, actor Actor, formID, responseID uuid.UUID) (*domain.FormResponse, error)
	UpdateStatus(ctx context.Context, actor Actor, formID, responseID uuid.UUID, req domain.UpdateResponseStatusRequest, ipAddress string) (*domain.FormResponse, error)
}

type responseService struct {
	formRepo     repository.FormRepository
	responseRepo repository.ResponseRepository
}

// NewResponseService membuat instance service respons formulir.
func NewResponseService(formRepo repository.FormRepository, responseRepo repository.ResponseRepository) ResponseService {
	return &responseService{formRepo: formRepo, responseRepo: responseRepo}
}

func (s *responseService) List(ctx context.Context, actor Actor, formID uuid.UUID, q domain.FormResponseListQuery) (*domain.FormResponseListResponse, error) {
	if q.Status != "" {
		if _, ok := validResponseStatuses[q.Status]; !ok {
			return nil, ErrInvalidResponseStatus
		}
	}

	form, err := s.formRepo.FindByID(ctx, formID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrFormNotFound
		}
		return nil, err
	}
	if !CanAccess(actor, form) {
		return nil, ErrFormForbidden
	}

	if q.Page < 1 {
		q.Page = 1
	}
	if q.Limit < 1 {
		q.Limit = 20
	}
	if q.Limit > 100 {
		q.Limit = 100
	}

	items, total, err := s.responseRepo.ListByForm(ctx, formID, q)
	if err != nil {
		return nil, err
	}
	if items == nil {
		items = []domain.FormResponse{}
	}

	return &domain.FormResponseListResponse{
		Items: items,
		Page:  q.Page,
		Limit: q.Limit,
		Total: total,
	}, nil
}

func (s *responseService) Get(ctx context.Context, actor Actor, formID, responseID uuid.UUID) (*domain.FormResponse, error) {
	if err := s.authorizeForm(ctx, actor, formID); err != nil {
		return nil, err
	}
	return s.responseRepo.GetByID(ctx, formID, responseID)
}

func (s *responseService) UpdateStatus(ctx context.Context, actor Actor, formID, responseID uuid.UUID, req domain.UpdateResponseStatusRequest, ipAddress string) (*domain.FormResponse, error) {
	status := strings.ToUpper(strings.TrimSpace(req.Status))
	if _, ok := validResponseStatuses[status]; !ok {
		return nil, ErrInvalidResponseStatus
	}

	form, err := s.formRepo.FindByID(ctx, formID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrFormNotFound
		}
		return nil, err
	}
	if !CanAccess(actor, form) {
		return nil, ErrFormForbidden
	}

	current, err := s.responseRepo.GetByID(ctx, formID, responseID)
	if err != nil {
		return nil, err
	}
	if !canTransitionResponse(current.Status, status) {
		return nil, ErrInvalidStatusTransition
	}

	publicNote := strings.TrimSpace(req.PublicNote)
	internalNote := strings.TrimSpace(req.InternalNote)
	if status == "REJECTED" && publicNote == "" {
		return nil, ErrPublicNoteRequired
	}

	details, err := json.Marshal(map[string]string{
		"from":          current.Status,
		"to":            status,
		"public_note":   publicNote,
		"internal_note": internalNote,
	})
	if err != nil {
		details = json.RawMessage(`{}`)
	}

	name := ""
	if current.RegistrationNumber != nil {
		name = *current.RegistrationNumber
	}
	audit := repository.AuditRecord{
		ActorID:   actor.UserID,
		Action:    "RESPONSE_STATUS_UPDATED",
		Entity:    "FORM_RESPONSE",
		EntityID:  &responseID,
		Name:      name,
		Details:   details,
		IPAddress: ipAddress,
	}

	return s.responseRepo.UpdateStatus(ctx, formID, responseID, status, publicNote, internalNote, actor.UserID, audit)
}

func (s *responseService) authorizeForm(ctx context.Context, actor Actor, formID uuid.UUID) error {
	form, err := s.formRepo.FindByID(ctx, formID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return ErrFormNotFound
		}
		return err
	}
	if !CanAccess(actor, form) {
		return ErrFormForbidden
	}
	return nil
}

func canTransitionResponse(from, to string) bool {
	if from == to {
		return false
	}
	switch from {
	case "SUBMITTED":
		return to == "VERIFIED"
	case "VERIFIED":
		return to == "APPROVED" || to == "REJECTED"
	default:
		return false
	}
}
