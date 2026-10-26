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

var (
	ErrDuplicateResponse  = errors.New("respons sudah pernah dikirim untuk NIK ini")
	ErrQuotaExceeded      = errors.New("kuota respons formulir sudah penuh")
	ErrRegistrationConflict = errors.New("nomor registrasi bentrok")
)

const responseColumns = `id, form_id, registration_number, respondent_identifier, answers, metadata, submitted_at`

// ResponseRepository adalah kontrak akses data respons formulir.
type ResponseRepository interface {
	Create(ctx context.Context, formID uuid.UUID, response *domain.FormResponse, enforceUnique bool, maxSubmissions int) error
	ListByForm(ctx context.Context, formID uuid.UUID, q domain.FormResponseListQuery) ([]domain.FormResponse, int, error)
}

type responseRepository struct {
	db *sqlx.DB
}

// NewResponseRepository membuat instance repository respons berbasis PostgreSQL.
func NewResponseRepository(db *sqlx.DB) ResponseRepository {
	return &responseRepository{db: db}
}

func (r *responseRepository) Create(ctx context.Context, formID uuid.UUID, response *domain.FormResponse, enforceUnique bool, maxSubmissions int) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}
	defer func() {
		_ = tx.Rollback()
	}()

	var totalResponses int
	if maxSubmissions > 0 {
		err = tx.GetContext(ctx, &totalResponses,
			`SELECT total_responses FROM forms WHERE id = $1 FOR UPDATE`, formID)
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				return ErrNotFound
			}
			return err
		}
		if totalResponses >= maxSubmissions {
			return ErrQuotaExceeded
		}
	}

	if enforceUnique && response.RespondentIdentifier != nil {
		var exists bool
		err = tx.GetContext(ctx, &exists,
			`SELECT EXISTS(SELECT 1 FROM form_responses WHERE form_id = $1 AND respondent_identifier = $2)`,
			formID, *response.RespondentIdentifier)
		if err != nil {
			return err
		}
		if exists {
			return ErrDuplicateResponse
		}
	}

	_, err = tx.ExecContext(ctx, `
		INSERT INTO form_responses
			(id, form_id, registration_number, respondent_identifier, answers, metadata)
		VALUES ($1, $2, $3, $4, $5, $6)`,
		response.ID, formID, response.RegistrationNumber, response.RespondentIdentifier,
		jsonParam(response.Answers), jsonParam(response.Metadata))
	if err != nil {
		return mapResponseInsertError(err)
	}

	if _, err = tx.ExecContext(ctx,
		`UPDATE forms SET total_responses = total_responses + 1, updated_at = NOW() WHERE id = $1`,
		formID); err != nil {
		return err
	}

	return tx.Commit()
}

func (r *responseRepository) ListByForm(ctx context.Context, formID uuid.UUID, q domain.FormResponseListQuery) ([]domain.FormResponse, int, error) {
	where := " WHERE form_id = $1"
	args := []interface{}{formID}

	if search := strings.TrimSpace(q.Search); search != "" {
		args = append(args, "%"+strings.ToLower(search)+"%")
		idx := len(args)
		where += fmt.Sprintf(
			" AND (LOWER(COALESCE(registration_number, '')) LIKE $%d OR LOWER(answers::text) LIKE $%d)",
			idx, idx)
	}
	if kodeKec := strings.TrimSpace(q.KodeKec); kodeKec != "" {
		args = append(args, kodeKec)
		where += fmt.Sprintf(" AND answers->'f_wilayah'->>'kode_kec' = $%d", len(args))
	}

	var total int
	if err := r.db.GetContext(ctx, &total, "SELECT COUNT(*) FROM form_responses"+where, args...); err != nil {
		return nil, 0, err
	}

	dataArgs := append([]interface{}{}, args...)
	dataArgs = append(dataArgs, q.Limit, (q.Page-1)*q.Limit)
	query := "SELECT " + responseColumns + " FROM form_responses" + where +
		fmt.Sprintf(" ORDER BY submitted_at DESC LIMIT $%d OFFSET $%d", len(dataArgs)-1, len(dataArgs))

	var items []domain.FormResponse
	if err := r.db.SelectContext(ctx, &items, query, dataArgs...); err != nil {
		return nil, 0, err
	}
	return items, total, nil
}

func mapResponseInsertError(err error) error {
	var pqErr *pq.Error
	if errors.As(err, &pqErr) && pqErr.Code == "23505" {
		switch pqErr.Constraint {
		case "idx_responses_form_identifier":
			return ErrDuplicateResponse
		case "idx_responses_registration_number":
			return ErrRegistrationConflict
		default:
			return ErrDuplicateResponse
		}
	}
	return err
}
