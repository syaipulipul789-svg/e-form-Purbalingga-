package repository

import (
	"context"
	"database/sql"
	"errors"

	"github.com/jmoiron/sqlx"
	"github.com/purbalinggakab/e-form-purbalingga/internal/domain"
)

type OPDRepository struct {
	db *sqlx.DB
}

func NewOPDRepository(db *sqlx.DB) *OPDRepository {
	return &OPDRepository{db: db}
}

func (r *OPDRepository) List(ctx context.Context) ([]domain.OPD, error) {
	items := make([]domain.OPD, 0)
	err := r.db.SelectContext(ctx, &items, `
		SELECT id, kode_opd, nama_opd, singkatan, logo_url, created_at
		FROM opd
		ORDER BY nama_opd
	`)
	return items, err
}

func (r *OPDRepository) GetByID(ctx context.Context, id any) (*domain.OPD, error) {
	var opd domain.OPD
	err := r.db.GetContext(ctx, &opd, `
		SELECT id, kode_opd, nama_opd, singkatan, logo_url, created_at
		FROM opd
		WHERE id = $1
	`, id)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &opd, nil
}
