package repository

import (
	"context"
	"database/sql"
	"errors"
	"strings"

	"github.com/jmoiron/sqlx"
	"github.com/purbalinggakab/e-form-purbalingga/internal/domain"
)

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
		return nil, err
	}
	return &user, nil
}

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
		return nil, err
	}
	return &user, nil
}
