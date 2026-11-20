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
	ErrDuplicateResponse    = errors.New("respons sudah pernah dikirim untuk NIK ini")
	ErrQuotaExceeded        = errors.New("kuota respons formulir sudah penuh")
	ErrRegistrationConflict = errors.New("nomor registrasi bentrok")
	ErrResponseNotFound     = errors.New("respons tidak ditemukan")
	ErrSubmissionNotFound   = errors.New("pengajuan tidak ditemukan")
)

const responseColumns = `id, form_id, registration_number, respondent_identifier, answers, metadata, status, internal_note, public_note, verified_by, verified_at, submitted_at, updated_at`

// ResponseRepository adalah kontrak akses data respons formulir.
type ResponseRepository interface {
	Create(ctx context.Context, formID uuid.UUID, response *domain.FormResponse, enforceUnique bool, maxSubmissions int) error
	ListByForm(ctx context.Context, formID uuid.UUID, q domain.FormResponseListQuery) ([]domain.FormResponse, int, error)
	GetByID(ctx context.Context, formID, responseID uuid.UUID) (*domain.FormResponse, error)
	UpdateStatus(ctx context.Context, formID, responseID uuid.UUID, status, publicNote, internalNote string, verifiedBy uuid.UUID, audit AuditRecord) (*domain.FormResponse, error)
	FindForTracking(ctx context.Context, registrationNumber, respondentHash string) (*domain.PublicTrackResponse, error)
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
	if status := strings.TrimSpace(q.Status); status != "" {
		args = append(args, status)
		where += fmt.Sprintf(" AND status = $%d", len(args))
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

func (r *responseRepository) GetByID(ctx context.Context, formID, responseID uuid.UUID) (*domain.FormResponse, error) {
	var response domain.FormResponse
	query := "SELECT " + responseColumns + " FROM form_responses WHERE id = $1 AND form_id = $2"
	if err := r.db.GetContext(ctx, &response, query, responseID, formID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrResponseNotFound
		}
		return nil, err
	}
	return &response, nil
}

func (r *responseRepository) UpdateStatus(ctx context.Context, formID, responseID uuid.UUID, status, publicNote, internalNote string, verifiedBy uuid.UUID, audit AuditRecord) (*domain.FormResponse, error) {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = tx.Rollback()
	}()

	var response domain.FormResponse
	query := `
		UPDATE form_responses
		SET status = $3,
		    public_note = $4,
		    internal_note = $5,
		    verified_by = CASE WHEN $3 = 'SUBMITTED' THEN NULL ELSE $6 END,
		    verified_at = CASE WHEN $3 = 'SUBMITTED' THEN NULL ELSE NOW() END,
		    updated_at = NOW()
		WHERE id = $1 AND form_id = $2
		RETURNING ` + responseColumns
	if err := tx.GetContext(ctx, &response, query, responseID, formID, status, publicNote, internalNote, verifiedBy); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrResponseNotFound
		}
		return nil, err
	}

	audit.EntityID = &response.ID
	if err := insertAudit(ctx, tx, audit); err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}
	return &response, nil
}

func (r *responseRepository) FindForTracking(ctx context.Context, registrationNumber, respondentHash string) (*domain.PublicTrackResponse, error) {
	var item domain.PublicTrackResponse
	query := `
		SELECT r.registration_number, f.title AS form_title, r.status, r.public_note,
		       r.submitted_at, r.updated_at
		FROM form_responses r
		JOIN forms f ON f.id = r.form_id
		WHERE UPPER(r.registration_number) = UPPER($1) AND r.respondent_identifier = $2`
	if err := r.db.GetContext(ctx, &item, query, registrationNumber, respondentHash); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrSubmissionNotFound
		}
		return nil, err
	}
	return &item, nil
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
