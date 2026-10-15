package service_test

import (
	"context"
	"errors"
	"testing"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/purbalinggakab/e-form-purbalingga/internal/domain"
	"github.com/purbalinggakab/e-form-purbalingga/internal/repository"
	"github.com/purbalinggakab/e-form-purbalingga/internal/service"
	"golang.org/x/crypto/bcrypt"
)

type fakeUserRepo struct {
	usersByEmail map[string]*domain.User
}

func (f fakeUserRepo) FindByEmail(_ context.Context, email string) (*domain.User, error) {
	u, ok := f.usersByEmail[email]
	if !ok {
		return nil, repository.ErrNotFound
	}
	return u, nil
}

func (f fakeUserRepo) FindByID(_ context.Context, id uuid.UUID) (*domain.User, error) {
	for _, u := range f.usersByEmail {
		if u.ID == id {
			return u, nil
		}
	}
	return nil, repository.ErrNotFound
}

type fakeOPDRepo struct {
	opds map[uuid.UUID]*domain.OPD
}

func (f fakeOPDRepo) FindByID(_ context.Context, id uuid.UUID) (*domain.OPD, error) {
	if o, ok := f.opds[id]; ok {
		return o, nil
	}
	return nil, repository.ErrNotFound
}

func (f fakeOPDRepo) List(_ context.Context) ([]domain.OPD, error) {
	return nil, nil
}

func newTestService() (service.AuthService, *domain.User) {
	hash, _ := bcrypt.GenerateFromPassword([]byte("Purbalingga2026!"), bcrypt.MinCost)
	opdID := uuid.New()
	user := &domain.User{
		ID:           uuid.New(),
		OPDID:        &opdID,
		Nama:         "Super Admin Diskominfo",
		Email:        "superadmin@purbalinggakab.go.id",
		PasswordHash: string(hash),
		Role:         "SUPER_ADMIN",
		IsActive:     true,
	}
	opd := &domain.OPD{
		ID:      opdID,
		KodeOPD: "DISKOMINFO",
		NamaOPD: "Dinas Komunikasi dan Informatika Kabupaten Purbalingga",
	}
	ur := fakeUserRepo{usersByEmail: map[string]*domain.User{user.Email: user}}
	or := fakeOPDRepo{opds: map[uuid.UUID]*domain.OPD{opdID: opd}}

	return service.NewAuthService(ur, or, "test-secret", 24), user
}

func TestLoginSuccess(t *testing.T) {
	svc, user := newTestService()

	resp, err := svc.Login(context.Background(), domain.LoginRequest{
		Email:    user.Email,
		Password: "Purbalingga2026!",
	})
	if err != nil {
		t.Fatalf("Login harusnya berhasil, got error: %v", err)
	}
	if resp.Token == "" {
		t.Fatal("Token tidak boleh kosong")
	}
	if resp.ExpiresIn != 86400 {
		t.Fatalf("expires_in harus 86400 detik, got %d", resp.ExpiresIn)
	}
	if resp.User.Role != "SUPER_ADMIN" {
		t.Fatalf("role tidak cocok: %s", resp.User.Role)
	}
	if resp.User.OPD == nil || resp.User.OPD.KodeOPD != "DISKOMINFO" {
		t.Fatal("profil pengguna harus menyertakan OPD")
	}

	claims := &service.JWTClaims{}
	tok, err := jwt.ParseWithClaims(resp.Token, claims, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return []byte("test-secret"), nil
	})
	if err != nil || !tok.Valid {
		t.Fatalf("Token tidak valid: %v", err)
	}
	if claims.UserID != user.ID || claims.Role != "SUPER_ADMIN" || claims.OPDID == nil {
		t.Fatalf("Klaim JWT tidak cocok: %+v", claims)
	}
}

func TestLoginWrongPassword(t *testing.T) {
	svc, user := newTestService()

	_, err := svc.Login(context.Background(), domain.LoginRequest{
		Email:    user.Email,
		Password: "password-salah",
	})
	if !errors.Is(err, service.ErrInvalidCredentials) {
		t.Fatalf("Harusnya ErrInvalidCredentials, got %v", err)
	}
}

func TestLoginUnknownEmail(t *testing.T) {
	svc, _ := newTestService()

	_, err := svc.Login(context.Background(), domain.LoginRequest{
		Email:    "tidak.ada@purbalinggakab.go.id",
		Password: "Purbalingga2026!",
	})
	if !errors.Is(err, service.ErrInvalidCredentials) {
		t.Fatalf("Harusnya ErrInvalidCredentials, got %v", err)
	}
}

func TestLoginInactiveUser(t *testing.T) {
	svc, user := newTestService()

	inactive := *user
	inactive.IsActive = false
	// ganti user aktif pada repo dengan versi nonaktif lewat service baru
	ur := fakeUserRepo{usersByEmail: map[string]*domain.User{inactive.Email: &inactive}}
	or := fakeOPDRepo{opds: map[uuid.UUID]*domain.OPD{}}
	svc = service.NewAuthService(ur, or, "test-secret", 24)

	_, err := svc.Login(context.Background(), domain.LoginRequest{
		Email:    inactive.Email,
		Password: "Purbalingga2026!",
	})
	if !errors.Is(err, service.ErrInactiveUser) {
		t.Fatalf("Harusnya ErrInactiveUser, got %v", err)
	}
}

func TestGetProfile(t *testing.T) {
	svc, user := newTestService()

	profile, err := svc.GetProfile(context.Background(), user.ID)
	if err != nil {
		t.Fatalf("GetProfile error: %v", err)
	}
	if profile.Email != user.Email {
		t.Fatalf("Email profil tidak cocok: %s", profile.Email)
	}
	if profile.OPD == nil || profile.OPD.NamaOPD == "" {
		t.Fatal("Profil harus menyertakan detail OPD")
	}
}
