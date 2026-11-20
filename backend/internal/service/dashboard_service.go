package service

import (
	"context"

	"github.com/google/uuid"
	"github.com/purbalinggakab/e-form-purbalingga/internal/domain"
	"github.com/purbalinggakab/e-form-purbalingga/internal/repository"
)

type DashboardService interface {
	Summary(ctx context.Context, user *domain.AuthUser, opdID *uuid.UUID) (*domain.DashboardSummary, error)
}

type dashboardService struct {
	dashboard *repository.DashboardRepository
}

func NewDashboardService(dashboard *repository.DashboardRepository) DashboardService {
	return &dashboardService{dashboard: dashboard}
}

func (s *dashboardService) Summary(ctx context.Context, user *domain.AuthUser, opdID *uuid.UUID) (*domain.DashboardSummary, error) {
	if user == nil {
		return nil, domain.NewAppError(401, "UNAUTHORIZED", "Sesi tidak valid", nil)
	}

	scope := opdID
	if user.Role != "SUPER_ADMIN" {
		if user.OPDID == nil {
			return nil, domain.NewAppError(403, "FORBIDDEN", "Akun Anda tidak terhubung dengan OPD", nil)
		}
		scope = user.OPDID
	}

	summary, err := s.dashboard.Summary(ctx, scope)
	if err != nil {
		return nil, domain.Internal("Gagal mengambil ringkasan dashboard")
	}
	return summary, nil
}
