package service

import (
	"context"
	"encoding/json"
	"errors"
	"net/mail"
	"strings"

	"github.com/google/uuid"
	"github.com/purbalinggakab/e-form-purbalingga/internal/domain"
	"github.com/purbalinggakab/e-form-purbalingga/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrAdminInvalidInput = errors.New("data administrasi tidak valid")
	ErrAdminForbidden    = errors.New("aksi ini tidak diizinkan")
	ErrAdminConflict     = repository.ErrAdminConflict
	ErrAdminNotFound     = repository.ErrAdminNotFound
)

type AdminActor struct {
	UserID   uuid.UUID
	Role     string
	IPAddress string
}

type AdminService interface {
	ListOPDs(ctx context.Context) ([]domain.AdminOPD, error)
	CreateOPD(ctx context.Context, actor AdminActor, req domain.AdminOPDRequest) (*domain.AdminOPD, error)
	UpdateOPD(ctx context.Context, actor AdminActor, id uuid.UUID, req domain.AdminOPDRequest) (*domain.AdminOPD, error)
	ListUsers(ctx context.Context) ([]domain.AdminUser, error)
	CreateUser(ctx context.Context, actor AdminActor, req domain.AdminUserRequest) (*domain.AdminUser, error)
	UpdateUser(ctx context.Context, actor AdminActor, id uuid.UUID, req domain.AdminUserRequest) error
	SetUserStatus(ctx context.Context, actor AdminActor, id uuid.UUID, isActive bool) error
	Metrics(ctx context.Context) (*domain.AdminMetrics, error)
	ListAudit(ctx context.Context, q domain.AuditListQuery) (*domain.AuditListResponse, error)
}

type adminService struct {
	repo repository.AdminRepository
}

func NewAdminService(repo repository.AdminRepository) AdminService {
	return &adminService{repo: repo}
}

func (s *adminService) ListOPDs(ctx context.Context) ([]domain.AdminOPD, error) {
	return s.repo.ListOPDs(ctx)
}

func (s *adminService) CreateOPD(ctx context.Context, actor AdminActor, req domain.AdminOPDRequest) (*domain.AdminOPD, error) {
	req, err := normalizeOPDRequest(req)
	if err != nil {
		return nil, err
	}
	opd := domain.AdminOPD{
		ID:        uuid.New(),
		KodeOPD:   req.KodeOPD,
		NamaOPD:   req.NamaOPD,
		Singkatan: req.Singkatan,
		LogoURL:   req.LogoURL,
	}
	if err := s.repo.CreateOPD(ctx, opd, auditRecord(actor, "OPD_CREATED", "OPD", opd.ID, opd.NamaOPD, nil)); err != nil {
		return nil, err
	}
	return &opd, nil
}

func (s *adminService) UpdateOPD(ctx context.Context, actor AdminActor, id uuid.UUID, req domain.AdminOPDRequest) (*domain.AdminOPD, error) {
	req, err := normalizeOPDRequest(req)
	if err != nil {
		return nil, err
	}
	opd := domain.AdminOPD{
		ID:        id,
		KodeOPD:   req.KodeOPD,
		NamaOPD:   req.NamaOPD,
		Singkatan: req.Singkatan,
		LogoURL:   req.LogoURL,
	}
	if err := s.repo.UpdateOPD(ctx, opd, auditRecord(actor, "OPD_UPDATED", "OPD", id, opd.NamaOPD, map[string]string{"kode_opd": opd.KodeOPD})); err != nil {
		return nil, err
	}
	return &opd, nil
}

func (s *adminService) ListUsers(ctx context.Context) ([]domain.AdminUser, error) {
	return s.repo.ListUsers(ctx)
}

func (s *adminService) CreateUser(ctx context.Context, actor AdminActor, req domain.AdminUserRequest) (*domain.AdminUser, error) {
	user, err := normalizeUserRequest(req, true)
	if err != nil {
		return nil, err
	}
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	dbUser := domain.User{
		ID:           uuid.New(),
		OPDID:        &user.OPDID,
		Nama:         user.Nama,
		Email:        user.Email,
		PasswordHash: string(passwordHash),
		Role:         user.Role,
		IsActive:     true,
	}
	if err := s.repo.CreateUser(ctx, dbUser, auditRecord(actor, "USER_CREATED", "USER", dbUser.ID, dbUser.Nama, map[string]string{
		"email": dbUser.Email,
		"role":  dbUser.Role,
	})); err != nil {
		return nil, err
	}
	return &domain.AdminUser{
		ID:       dbUser.ID,
		OPDID:    dbUser.OPDID,
		Nama:     dbUser.Nama,
		Email:    dbUser.Email,
		Role:     dbUser.Role,
		IsActive: true,
	}, nil
}

func (s *adminService) UpdateUser(ctx context.Context, actor AdminActor, id uuid.UUID, req domain.AdminUserRequest) error {
	if id == actor.UserID {
		return ErrAdminForbidden
	}
	user, err := normalizeUserRequest(req, false)
	if err != nil {
		return err
	}
	var passwordHash string
	if user.Password != "" {
		hash, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		passwordHash = string(hash)
	}
	dbUser := domain.User{
		ID:           id,
		OPDID:        &user.OPDID,
		Nama:         user.Nama,
		Email:        user.Email,
		PasswordHash: passwordHash,
		Role:         user.Role,
	}
	details := map[string]string{"email": user.Email, "role": user.Role}
	if user.Password != "" {
		details["password_reset"] = "true"
	}
	return s.repo.UpdateUser(ctx, dbUser, auditRecord(actor, "USER_UPDATED", "USER", id, user.Nama, details))
}

func (s *adminService) SetUserStatus(ctx context.Context, actor AdminActor, id uuid.UUID, isActive bool) error {
	if id == actor.UserID && !isActive {
		return ErrAdminForbidden
	}
	status := "inactive"
	action := "USER_DEACTIVATED"
	if isActive {
		status = "active"
		action = "USER_ACTIVATED"
	}
	return s.repo.SetUserStatus(ctx, id, isActive,
		auditRecord(actor, action, "USER", id, id.String(), map[string]string{"status": status}))
}

func (s *adminService) Metrics(ctx context.Context) (*domain.AdminMetrics, error) {
	return s.repo.Metrics(ctx)
}

func (s *adminService) ListAudit(ctx context.Context, q domain.AuditListQuery) (*domain.AuditListResponse, error) {
	if q.Page < 1 {
		q.Page = 1
	}
	if q.Limit < 1 {
		q.Limit = 20
	}
	if q.Limit > 100 {
		q.Limit = 100
	}
	switch q.EntityType {
	case "", "OPD", "USER":
	default:
		return nil, ErrAdminInvalidInput
	}
	items, total, err := s.repo.ListAudit(ctx, q)
	if err != nil {
		return nil, err
	}
	return &domain.AuditListResponse{Items: items, Page: q.Page, Limit: q.Limit, Total: total}, nil
}

func normalizeOPDRequest(req domain.AdminOPDRequest) (domain.AdminOPDRequest, error) {
	req.KodeOPD = strings.ToUpper(strings.TrimSpace(req.KodeOPD))
	req.NamaOPD = strings.TrimSpace(req.NamaOPD)
	if req.KodeOPD == "" || req.NamaOPD == "" || len(req.KodeOPD) > 50 || len(req.NamaOPD) > 255 {
		return req, ErrAdminInvalidInput
	}
	if req.Singkatan != nil {
		value := strings.TrimSpace(*req.Singkatan)
		if len(value) > 50 {
			return req, ErrAdminInvalidInput
		}
		req.Singkatan = optionalText(value)
	}
	if req.LogoURL != nil {
		value := strings.TrimSpace(*req.LogoURL)
		if len(value) > 500 {
			return req, ErrAdminInvalidInput
		}
		req.LogoURL = optionalText(value)
	}
	return req, nil
}

func normalizeUserRequest(req domain.AdminUserRequest, requirePassword bool) (domain.AdminUserRequest, error) {
	req.Nama = strings.TrimSpace(req.Nama)
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	req.Role = strings.TrimSpace(req.Role)
	if req.OPDID == uuid.Nil || req.Nama == "" || len(req.Nama) > 150 || len(req.Email) > 150 {
		return req, ErrAdminInvalidInput
	}
	if _, err := mail.ParseAddress(req.Email); err != nil {
		return req, ErrAdminInvalidInput
	}
	if req.Role != "ADMIN_OPD" && req.Role != "OPERATOR" {
		return req, ErrAdminInvalidInput
	}
	if (requirePassword || req.Password != "") && len([]rune(req.Password)) < 12 {
		return req, ErrAdminInvalidInput
	}
	return req, nil
}

func optionalText(value string) *string {
	if value == "" {
		return nil
	}
	return &value
}

func auditRecord(actor AdminActor, action, entity string, id uuid.UUID, name string, details interface{}) repository.AuditRecord {
	raw, err := json.Marshal(details)
	if err != nil {
		raw = json.RawMessage(`{}`)
	}
	return repository.AuditRecord{
		ActorID:   actor.UserID,
		Action:    action,
		Entity:    entity,
		EntityID:  &id,
		Name:      name,
		Details:   raw,
		IPAddress: actor.IPAddress,
	}
}
