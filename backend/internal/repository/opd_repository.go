package repository

import (
	"context"
	"database/sql"
	"errors"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/purbalinggakab/e-form-purbalingga/internal/domain"
)

type OPDRepository interface {
	FindByID(ctx context.Context, id uuid.UUID) (*domain.OPD, error)
	List(ctx context.Context) ([]domain.OPD, error)
}

type opdRepository struct {
	db *sqlx.DB
}

func NewOPDRepository(db *sqlx.DB) OPDRepository {
	return &opdRepository{db: db}
}

func (r *opdRepository) FindByID(ctx context.Context, id uuid.UUID) (*domain.OPD, error) {
	var opd domain.OPD
	query := `
		SELECT id, kode_opd, nama_opd, singkatan, logo_url, created_at
		FROM opd
		WHERE id = $1
		LIMIT 1`

	if err := r.db.GetContext(ctx, &opd, query, id); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &opd, nil
}

func (r *opdRepository) List(ctx context.Context) ([]domain.OPD, error) {
	var items []domain.OPD
	query := `
		SELECT id, kode_opd, nama_opd, singkatan, logo_url, created_at
		FROM opd
		ORDER BY nama_opd ASC`

	if err := r.db.SelectContext(ctx, &items, query); err != nil {
		return nil, err
	}
	return items, nil
}
