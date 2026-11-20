package service

import (
	"context"
<<<<<<< HEAD
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
=======
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
>>>>>>> 07c00404be99e7853df025b53dea2a67f4023a33
	if err != nil {
		return nil, err
	}

<<<<<<< HEAD
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
=======
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
>>>>>>> 07c00404be99e7853df025b53dea2a67f4023a33
				ID:        opd.ID,
				KodeOPD:   opd.KodeOPD,
				NamaOPD:   opd.NamaOPD,
				Singkatan: opd.Singkatan,
<<<<<<< HEAD
				LogoURL:   opd.LogoURL,
			}
		}
	}

	return authUser, nil
=======
			}
		}
	}
	return result, nil
>>>>>>> 07c00404be99e7853df025b53dea2a67f4023a33
}
