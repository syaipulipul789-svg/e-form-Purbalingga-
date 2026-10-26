package service

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/purbalinggakab/e-form-purbalingga/internal/domain"
	"github.com/purbalinggakab/e-form-purbalingga/internal/repository"
)

// ResponseService adalah kontrak logika daftar respons formulir.
type ResponseService interface {
	List(ctx context.Context, actor Actor, formID uuid.UUID, q domain.FormResponseListQuery) (*domain.FormResponseListResponse, error)
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
