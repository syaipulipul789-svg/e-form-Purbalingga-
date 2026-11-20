package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
<<<<<<< HEAD
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
=======
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/purbalinggakab/e-form-purbalingga/internal/domain"
	"strings"
)

type FormListFilter struct {
	Search string
	Status string
	OPDID  *uuid.UUID
	Page   int
	Limit  int
}

type formListRow struct {
	domain.Form
	OPDKode      string  `db:"opd_kode"`
	OPDNama      string  `db:"opd_nama"`
	OPDSingkatan *string `db:"opd_singkatan"`
}

type FormRepository struct {
	db *sqlx.DB
}

func NewFormRepository(db *sqlx.DB) *FormRepository {
	return &FormRepository{db: db}
}

func (r *FormRepository) GetBySlug(ctx context.Context, slug string) (*domain.Form, error) {
	var form domain.Form
	err := r.db.GetContext(ctx, &form, `
		SELECT id, opd_id, creator_id, slug, title, description, banner_url, status,
		       schema, settings, total_responses, start_date, end_date, created_at, updated_at
		FROM forms
		WHERE slug = $1
	`, slug)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &form, nil
}

func (r *FormRepository) GetBySlugForUpdateTx(ctx context.Context, tx *sqlx.Tx, slug string) (*domain.Form, error) {
	var form domain.Form
	err := tx.GetContext(ctx, &form, `
		SELECT id, opd_id, creator_id, slug, title, description, banner_url, status,
		       schema, settings, total_responses, start_date, end_date, created_at, updated_at
		FROM forms
		WHERE slug = $1
		FOR UPDATE
	`, slug)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &form, nil
}

func (r *FormRepository) GetByID(ctx context.Context, id any) (*domain.Form, error) {
	var form domain.Form
	err := r.db.GetContext(ctx, &form, `
		SELECT id, opd_id, creator_id, slug, title, description, banner_url, status,
		       schema, settings, total_responses, start_date, end_date, created_at, updated_at
		FROM forms
		WHERE id = $1
	`, id)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &form, nil
}

func (r *FormRepository) GetByIDForUpdateTx(ctx context.Context, tx *sqlx.Tx, id any) (*domain.Form, error) {
	var form domain.Form
	err := tx.GetContext(ctx, &form, `
		SELECT id, opd_id, creator_id, slug, title, description, banner_url, status,
		       schema, settings, total_responses, start_date, end_date, created_at, updated_at
		FROM forms
		WHERE id = $1
		FOR UPDATE
	`, id)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &form, nil
}

func (r *FormRepository) List(ctx context.Context, filter FormListFilter) ([]domain.FormSummary, int, error) {
	conditions := []string{"1=1"}
	args := make([]any, 0)

	if filter.OPDID != nil {
		args = append(args, *filter.OPDID)
		conditions = append(conditions, fmt.Sprintf("f.opd_id = $%d", len(args)))
	}
	if filter.Status != "" {
		args = append(args, filter.Status)
		conditions = append(conditions, fmt.Sprintf("f.status = $%d", len(args)))
	}
	if search := strings.TrimSpace(filter.Search); search != "" {
		args = append(args, "%"+search+"%")
		conditions = append(conditions, fmt.Sprintf("(f.title ILIKE $%d OR f.slug ILIKE $%d)", len(args), len(args)))
	}

	where := strings.Join(conditions, " AND ")
	var total int
	if err := r.db.GetContext(ctx, &total, `SELECT COUNT(*) FROM forms f WHERE `+where, args...); err != nil {
		return nil, 0, err
	}

	page := filter.Page
	if page < 1 {
		page = 1
	}
	limit := filter.Limit
	if limit < 1 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	args = append(args, limit, (page-1)*limit)
	query := fmt.Sprintf(`
		SELECT f.id, f.opd_id, f.creator_id, f.slug, f.title, f.description, f.banner_url,
		       f.status, f.schema, f.settings, f.total_responses, f.start_date, f.end_date,
		       f.created_at, f.updated_at,
		       o.kode_opd AS opd_kode, o.nama_opd AS opd_nama, o.singkatan AS opd_singkatan
		FROM forms f
		JOIN opd o ON o.id = f.opd_id
		WHERE %s
		ORDER BY f.updated_at DESC
		LIMIT $%d OFFSET $%d
	`, where, len(args)-1, len(args))

	rows := make([]formListRow, 0)
	if err := r.db.SelectContext(ctx, &rows, query, args...); err != nil {
		return nil, 0, err
	}

	items := make([]domain.FormSummary, len(rows))
	for i, row := range rows {
		items[i] = domain.FormSummary{
			ID:             row.ID,
			OPDID:          row.OPDID,
			CreatorID:      row.CreatorID,
			Slug:           row.Slug,
			Title:          row.Title,
			Description:    row.Description,
			BannerURL:      row.BannerURL,
			Status:         row.Status,
			TotalResponses: row.TotalResponses,
			StartDate:      row.StartDate,
			EndDate:        row.EndDate,
			CreatedAt:      row.CreatedAt,
			UpdatedAt:      row.UpdatedAt,
			OPD: domain.OPDSummary{
				ID:        row.OPDID,
				KodeOPD:   row.OPDKode,
				NamaOPD:   row.OPDNama,
				Singkatan: row.OPDSingkatan,
			},
		}
	}
	return items, total, nil
}

func (r *FormRepository) CreateTx(ctx context.Context, tx *sqlx.Tx, form *domain.Form) error {
	return tx.QueryRowxContext(ctx, `
		INSERT INTO forms (
			id, opd_id, creator_id, slug, title, description, banner_url, status,
			schema, settings, total_responses, start_date, end_date, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0, $11, $12, NOW(), NOW())
		RETURNING created_at, updated_at
	`,
		form.ID, form.OPDID, form.CreatorID, form.Slug, form.Title, form.Description,
		form.BannerURL, form.Status, form.Schema, form.Settings, form.StartDate, form.EndDate,
	).Scan(&form.CreatedAt, &form.UpdatedAt)
}

func (r *FormRepository) UpdateTx(ctx context.Context, tx *sqlx.Tx, form *domain.Form) error {
	return tx.GetContext(ctx, &form.UpdatedAt, `
		UPDATE forms
		SET opd_id = $2, slug = $3, title = $4, description = $5, banner_url = $6,
		    status = $7, schema = $8, settings = $9, start_date = $10, end_date = $11,
		    updated_at = NOW()
		WHERE id = $1
		RETURNING updated_at
	`,
		form.ID, form.OPDID, form.Slug, form.Title, form.Description, form.BannerURL,
		form.Status, form.Schema, form.Settings, form.StartDate, form.EndDate,
	)
}

func (r *FormRepository) UpdateStatusTx(ctx context.Context, tx *sqlx.Tx, id any, status string) error {
	_, err := tx.ExecContext(ctx, `
		UPDATE forms SET status = $2, updated_at = NOW() WHERE id = $1
	`, id, status)
	return err
}

func (r *FormRepository) DeleteTx(ctx context.Context, tx *sqlx.Tx, id any) error {
	_, err := tx.ExecContext(ctx, `DELETE FROM forms WHERE id = $1`, id)
	return err
}

func (r *FormRepository) GetOPDByID(ctx context.Context, id any) (*domain.OPD, error) {
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

func (r *FormRepository) IncrementTotalResponsesTx(ctx context.Context, tx *sqlx.Tx, formID any) error {
	_, err := tx.ExecContext(ctx, `
		UPDATE forms
		SET total_responses = total_responses + 1,
		    updated_at = NOW()
		WHERE id = $1
	`, formID)
	return err
}

func (r *FormRepository) CountResponsesTx(ctx context.Context, tx *sqlx.Tx, formID any) (int, error) {
	var total int
	err := tx.GetContext(ctx, &total, `SELECT COUNT(*) FROM form_responses WHERE form_id = $1`, formID)
	return total, err
>>>>>>> 07c00404be99e7853df025b53dea2a67f4023a33
}
