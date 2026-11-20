package repository

import (
	"context"
	"database/sql"
	"errors"
<<<<<<< HEAD

	"github.com/google/uuid"
=======
	"strings"

>>>>>>> 07c00404be99e7853df025b53dea2a67f4023a33
	"github.com/jmoiron/sqlx"
	"github.com/purbalinggakab/e-form-purbalingga/internal/domain"
)

<<<<<<< HEAD
// ErrNotFound dikembalikan ketika data yang dicari tidak ada di database.
var ErrNotFound = errors.New("data tidak ditemukan")

type UserRepository interface {
	FindByEmail(ctx context.Context, email string) (*domain.User, error)
	FindByID(ctx context.Context, id uuid.UUID) (*domain.User, error)
}

type userRepository struct {
	db *sqlx.DB
}

func NewUserRepository(db *sqlx.DB) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) FindByEmail(ctx context.Context, email string) (*domain.User, error) {
	var user domain.User
	query := `
		SELECT id, opd_id, nama, email, password_hash, role, is_active, created_at
		FROM users
		WHERE email = $1
		LIMIT 1`

	if err := r.db.GetContext(ctx, &user, query, email); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
=======
type UserRepository struct {
	db *sqlx.DB
}

func NewUserRepository(db *sqlx.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	var user domain.User
	err := r.db.GetContext(ctx, &user, `
		SELECT id, opd_id, nama, email, password_hash, role, is_active, created_at
		FROM users
		WHERE LOWER(email) = LOWER($1)
	`, strings.TrimSpace(email))
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
>>>>>>> 07c00404be99e7853df025b53dea2a67f4023a33
		return nil, err
	}
	return &user, nil
}

<<<<<<< HEAD
func (r *userRepository) FindByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	var user domain.User
	query := `
		SELECT id, opd_id, nama, email, password_hash, role, is_active, created_at
		FROM users
		WHERE id = $1
		LIMIT 1`

	if err := r.db.GetContext(ctx, &user, query, id); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
=======
func (r *UserRepository) GetByID(ctx context.Context, id any) (*domain.User, error) {
	var user domain.User
	err := r.db.GetContext(ctx, &user, `
		SELECT id, opd_id, nama, email, password_hash, role, is_active, created_at
		FROM users
		WHERE id = $1
	`, id)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
>>>>>>> 07c00404be99e7853df025b53dea2a67f4023a33
		return nil, err
	}
	return &user, nil
}
