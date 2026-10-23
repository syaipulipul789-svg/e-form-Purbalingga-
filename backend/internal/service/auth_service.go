package service

import (
	"context"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/purbalinggakab/e-form-purbalingga/internal/domain"
	"github.com/purbalinggakab/e-form-purbalingga/internal/repository"
	"github.com/purbalinggakab/e-form-purbalingga/internal/utils"
	"golang.org/x/crypto/bcrypt"
)

type AuthService interface {
	Login(ctx context.Context, email, password string) (*domain.LoginResult, error)
	GetUser(ctx context.Context, userID uuid.UUID) (*domain.AuthUser, error)
}

type authService struct {
	users      *repository.UserRepository
	opds       *repository.OPDRepository
	jwtSecret  string
	expiresFor time.Duration
}

func NewAuthService(users *repository.UserRepository, opds *repository.OPDRepository, jwtSecret string, expiresFor time.Duration) AuthService {
	return &authService{
		users:      users,
		opds:       opds,
		jwtSecret:  jwtSecret,
		expiresFor: expiresFor,
	}
}

func (s *authService) Login(ctx context.Context, email, password string) (*domain.LoginResult, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	if email == "" || password == "" {
		return nil, domain.BadRequest("INVALID_CREDENTIALS", "Email dan password wajib diisi", nil)
	}

	user, err := s.users.GetByEmail(ctx, email)
	if err != nil {
		return nil, domain.Internal("Gagal memproses login")
	}
	if user == nil {
		return nil, domain.NewAppError(401, "INVALID_CREDENTIALS", "Email atau password salah", nil)
	}
	if !user.IsActive {
		return nil, domain.NewAppError(403, "USER_INACTIVE", "Akun Anda tidak aktif. Hubungi administrator.", nil)
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, domain.NewAppError(401, "INVALID_CREDENTIALS", "Email atau password salah", nil)
	}

	expiresAt := time.Now().Add(s.expiresFor)
	token, err := utils.GenerateToken(user.ID, user.Role, user.OPDID, s.jwtSecret, expiresAt)
	if err != nil {
		return nil, domain.Internal("Gagal membuat sesi login")
	}

	authUser, err := s.toAuthUser(ctx, user)
	if err != nil {
		return nil, err
	}

	return &domain.LoginResult{
		Token:     token,
		ExpiresIn: int64(s.expiresFor.Seconds()),
		User:      *authUser,
	}, nil
}

func (s *authService) GetUser(ctx context.Context, userID uuid.UUID) (*domain.AuthUser, error) {
	user, err := s.users.GetByID(ctx, userID)
	if err != nil {
		return nil, domain.Internal("Gagal mengambil data pengguna")
	}
	if user == nil || !user.IsActive {
		return nil, domain.NewAppError(401, "UNAUTHORIZED", "Sesi tidak valid atau pengguna tidak aktif", nil)
	}
	return s.toAuthUser(ctx, user)
}

func (s *authService) toAuthUser(ctx context.Context, user *domain.User) (*domain.AuthUser, error) {
	result := &domain.AuthUser{
		ID:     user.ID,
		Nama:   user.Nama,
		Email:  user.Email,
		Role:   user.Role,
		OPDID:  user.OPDID,
		Active: user.IsActive,
	}
	if user.OPDID != nil {
		opd, err := s.opds.GetByID(ctx, *user.OPDID)
		if err != nil {
			return nil, domain.Internal("Gagal mengambil data OPD")
		}
		if opd != nil {
			result.OPD = &domain.OPDSummary{
				ID:        opd.ID,
				KodeOPD:   opd.KodeOPD,
				NamaOPD:   opd.NamaOPD,
				Singkatan: opd.Singkatan,
			}
		}
	}
	return result, nil
}
