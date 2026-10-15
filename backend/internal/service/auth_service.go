package service

import (
	"context"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/purbalinggakab/e-form-purbalingga/internal/domain"
	"github.com/purbalinggakab/e-form-purbalingga/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

// ErrInvalidCredentials dikembalikan bila email atau password salah.
var ErrInvalidCredentials = errors.New("email atau password salah")

// ErrInactiveUser dikembalikan bila akun dinonaktifkan.
var ErrInactiveUser = errors.New("akun Anda tidak aktif, hubungi administrator")

type AuthService interface {
	Login(ctx context.Context, req domain.LoginRequest) (*domain.LoginResponse, error)
	GetProfile(ctx context.Context, userID uuid.UUID) (*domain.AuthUser, error)
}

// JWTClaims adalah klaim yang disematkan pada token akses.
type JWTClaims struct {
	UserID uuid.UUID  `json:"uid"`
	Role   string     `json:"role"`
	OPDID  *uuid.UUID `json:"opd_id,omitempty"`
	jwt.RegisteredClaims
}

type authService struct {
	userRepo       repository.UserRepository
	opdRepo        repository.OPDRepository
	secret         string
	expiryDuration time.Duration
}

func NewAuthService(userRepo repository.UserRepository, opdRepo repository.OPDRepository, secret string, expiryHours int) AuthService {
	return &authService{
		userRepo:       userRepo,
		opdRepo:        opdRepo,
		secret:         secret,
		expiryDuration: time.Duration(expiryHours) * time.Hour,
	}
}

func (s *authService) Login(ctx context.Context, req domain.LoginRequest) (*domain.LoginResponse, error) {
	user, err := s.userRepo.FindByEmail(ctx, req.Email)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrInvalidCredentials
		}
		return nil, err
	}

	if !user.IsActive {
		return nil, ErrInactiveUser
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	token, err := s.generateToken(user)
	if err != nil {
		return nil, err
	}

	profile, err := s.buildAuthUser(ctx, user)
	if err != nil {
		return nil, err
	}

	return &domain.LoginResponse{
		Token:     token,
		ExpiresIn: int(s.expiryDuration.Seconds()),
		User:      *profile,
	}, nil
}

func (s *authService) GetProfile(ctx context.Context, userID uuid.UUID) (*domain.AuthUser, error) {
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	return s.buildAuthUser(ctx, user)
}

func (s *authService) generateToken(user *domain.User) (string, error) {
	now := time.Now()
	claims := JWTClaims{
		UserID: user.ID,
		Role:   user.Role,
		OPDID:  user.OPDID,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   user.ID.String(),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(s.expiryDuration)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.secret))
}

func (s *authService) buildAuthUser(ctx context.Context, user *domain.User) (*domain.AuthUser, error) {
	authUser := &domain.AuthUser{
		ID:    user.ID,
		Nama:  user.Nama,
		Email: user.Email,
		Role:  user.Role,
	}

	if user.OPDID != nil {
		opd, err := s.opdRepo.FindByID(ctx, *user.OPDID)
		if err != nil && !errors.Is(err, repository.ErrNotFound) {
			return nil, err
		}
		if opd != nil {
			authUser.OPD = &domain.OPDSummary{
				ID:        opd.ID,
				KodeOPD:   opd.KodeOPD,
				NamaOPD:   opd.NamaOPD,
				Singkatan: opd.Singkatan,
				LogoURL:   opd.LogoURL,
			}
		}
	}

	return authUser, nil
}
