package repository

import (
	"context"
	"database/sql"
	"errors"

<<<<<<< HEAD
	"github.com/google/uuid"
=======
>>>>>>> 07c00404be99e7853df025b53dea2a67f4023a33
	"github.com/jmoiron/sqlx"
	"github.com/purbalinggakab/e-form-purbalingga/internal/domain"
)

<<<<<<< HEAD
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
=======
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
>>>>>>> 07c00404be99e7853df025b53dea2a67f4023a33
		return nil, err
	}
	return &opd, nil
}
<<<<<<< HEAD

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
=======
>>>>>>> 07c00404be99e7853df025b53dea2a67f4023a33
