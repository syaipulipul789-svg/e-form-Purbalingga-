package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
	"github.com/purbalinggakab/e-form-purbalingga/internal/domain"
)

// ErrSlugConflict dikembalikan ketika slug formulir sudah digunakan.
var ErrSlugConflict = errors.New("slug formulir sudah digunakan")

const formColumns = `id, opd_id, creator_id, slug, title, description, banner_url, status, schema, settings, total_responses, start_date, end_date, created_at, updated_at`

// FormRepository adalah kontrak akses data formulir.
type FormRepository interface {
	ListByOPD(ctx context.Context, opdID *uuid.UUID, q domain.FormListQuery) ([]domain.Form, int, error)
	FindByID(ctx context.Context, id uuid.UUID) (*domain.Form, error)
	FindBySlug(ctx context.Context, slug string) (*domain.Form, error)
	Create(ctx context.Context, form *domain.Form) error
	Update(ctx context.Context, form *domain.Form) error
	UpdateStatus(ctx context.Context, id uuid.UUID, status string) error
	Delete(ctx context.Context, id uuid.UUID) error
}

type formRepository struct {
	db *sqlx.DB
}

// NewFormRepository membuat instance repository formulir berbasis PostgreSQL.
func NewFormRepository(db *sqlx.DB) FormRepository {
	return &formRepository{db: db}
}

func (r *formRepository) ListByOPD(ctx context.Context, opdID *uuid.UUID, q domain.FormListQuery) ([]domain.Form, int, error) {
	where := " WHERE 1=1"
	args := make([]interface{}, 0, 4)

	if opdID != nil {
		args = append(args, *opdID)
		where += fmt.Sprintf(" AND opd_id = $%d", len(args))
	}
	if q.Status != "" {
		args = append(args, q.Status)
		where += fmt.Sprintf(" AND status = $%d", len(args))
	}
	if q.Search != "" {
		args = append(args, "%"+strings.ToLower(strings.TrimSpace(q.Search))+"%")
		idx := len(args)
		where += fmt.Sprintf(" AND (LOWER(title) LIKE $%d OR LOWER(slug) LIKE $%d)", idx, idx)
	}

	var total int
	if err := r.db.GetContext(ctx, &total, "SELECT COUNT(*) FROM forms"+where, args...); err != nil {
		return nil, 0, err
	}

	dataArgs := append([]interface{}{}, args...)
	dataArgs = append(dataArgs, q.Limit, (q.Page-1)*q.Limit)
	query := "SELECT " + formColumns + " FROM forms" + where +
		fmt.Sprintf(" ORDER BY created_at DESC LIMIT $%d OFFSET $%d", len(dataArgs)-1, len(dataArgs))

	var items []domain.Form
	if err := r.db.SelectContext(ctx, &items, query, dataArgs...); err != nil {
		return nil, 0, err
	}
	return items, total, nil
}

func (r *formRepository) FindByID(ctx context.Context, id uuid.UUID) (*domain.Form, error) {
	var form domain.Form
	query := "SELECT " + formColumns + " FROM forms WHERE id = $1 LIMIT 1"
	if err := r.db.GetContext(ctx, &form, query, id); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &form, nil
}

func (r *formRepository) FindBySlug(ctx context.Context, slug string) (*domain.Form, error) {
	var form domain.Form
	query := "SELECT " + formColumns + " FROM forms WHERE slug = $1 LIMIT 1"
	if err := r.db.GetContext(ctx, &form, query, slug); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &form, nil
}

func (r *formRepository) Create(ctx context.Context, form *domain.Form) error {
	query := `
		INSERT INTO forms (id, opd_id, creator_id, slug, title, description, banner_url, status, schema, settings, start_date, end_date)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`

	_, err := r.db.ExecContext(ctx, query,
		form.ID, form.OPDID, form.CreatorID, form.Slug, form.Title, form.Description, form.BannerURL,
		form.Status, jsonParam(form.Schema), jsonParam(form.Settings), form.StartDate, form.EndDate)
	if err != nil {
		if isUniqueViolation(err) {
			return ErrSlugConflict
		}
		return err
	}
	return nil
}

func (r *formRepository) Update(ctx context.Context, form *domain.Form) error {
	query := `
		UPDATE forms
		SET slug = $2, title = $3, description = $4, banner_url = $5, status = $6,
		    schema = $7, settings = $8, start_date = $9, end_date = $10, updated_at = NOW()
		WHERE id = $1`

	res, err := r.db.ExecContext(ctx, query,
		form.ID, form.Slug, form.Title, form.Description, form.BannerURL, form.Status,
		jsonParam(form.Schema), jsonParam(form.Settings), form.StartDate, form.EndDate)
	if err != nil {
		if isUniqueViolation(err) {
			return ErrSlugConflict
		}
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *formRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status string) error {
	res, err := r.db.ExecContext(ctx,
		`UPDATE forms SET status = $2, updated_at = NOW() WHERE id = $1`, id, status)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *formRepository) Delete(ctx context.Context, id uuid.UUID) error {
	res, err := r.db.ExecContext(ctx, `DELETE FROM forms WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return ErrNotFound
	}
	return nil
}

func jsonParam(raw []byte) interface{} {
	if len(raw) == 0 {
		return nil
	}
	return string(raw)
}

func isUniqueViolation(err error) bool {
	var pqErr *pq.Error
	if errors.As(err, &pqErr) {
		return pqErr.Code == "23505"
	}
	return false
}
