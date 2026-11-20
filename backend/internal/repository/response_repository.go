package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
<<<<<<< HEAD

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
=======
	"time"

	"github.com/jmoiron/sqlx"
	"github.com/purbalinggakab/e-form-purbalingga/internal/domain"
)

type ResponseListFilter struct {
	Search             string
	VerificationStatus string
	KodeKec            string
	RegionalFieldID    string
	DateFrom           *time.Time
	DateTo             *time.Time
	Page               int
	Limit              int
}

type ResponseRepository struct {
	db *sqlx.DB
}

func NewResponseRepository(db *sqlx.DB) *ResponseRepository {
	return &ResponseRepository{db: db}
}

func (r *ResponseRepository) FindByIdempotencyKeyTx(ctx context.Context, tx *sqlx.Tx, formID any, key string) (*domain.FormResponse, error) {
	var response domain.FormResponse
	err := tx.GetContext(ctx, &response, `
		SELECT id, form_id, respondent_identifier, answers, metadata,
		       registration_number, idempotency_key, submitted_at
		FROM form_responses
		WHERE form_id = $1 AND idempotency_key = $2
	`, formID, key)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &response, nil
}

func (r *ResponseRepository) ExistsByRespondentTx(ctx context.Context, tx *sqlx.Tx, formID any, identifier string) (bool, error) {
	var exists bool
	err := tx.GetContext(ctx, &exists, `
		SELECT EXISTS (
			SELECT 1 FROM form_responses
			WHERE form_id = $1 AND respondent_identifier = $2
		)
	`, formID, identifier)
	return exists, err
}

func (r *ResponseRepository) CountByFormTx(ctx context.Context, tx *sqlx.Tx, formID any) (int, error) {
	var total int
	err := tx.GetContext(ctx, &total, `
		SELECT COUNT(*) FROM form_responses WHERE form_id = $1
	`, formID)
	return total, err
}

func (r *ResponseRepository) CreateTx(ctx context.Context, tx *sqlx.Tx, response *domain.FormResponse) error {
	return tx.GetContext(ctx, &response.SubmittedAt, `
		INSERT INTO form_responses (
			id, form_id, respondent_identifier, answers, metadata,
			registration_number, idempotency_key, submitted_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
		RETURNING submitted_at
	`,
		response.ID,
		response.FormID,
		response.RespondentIdentifier,
		response.Answers,
		response.Metadata,
		response.RegistrationNumber,
		response.IdempotencyKey,
	)
}

func (r *ResponseRepository) ListByForm(ctx context.Context, formID any, filter ResponseListFilter) ([]domain.AdminResponse, int, domain.ResponseSummary, error) {
	where, args := buildResponseFilter(formID, filter)

	var total int
	if err := r.db.GetContext(ctx, &total, `SELECT COUNT(*) FROM form_responses r WHERE `+where, args...); err != nil {
		return nil, 0, domain.ResponseSummary{}, err
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
		SELECT r.id, r.form_id, r.registration_number, r.answers, r.metadata,
		       r.verification_status, r.verification_note, r.verified_by,
		       u.nama AS verified_by_name, r.verified_at, r.submitted_at
		FROM form_responses r
		LEFT JOIN users u ON u.id = r.verified_by
		WHERE %s
		ORDER BY r.submitted_at DESC
		LIMIT $%d OFFSET $%d
	`, where, len(args)-1, len(args))

	items := make([]domain.AdminResponse, 0)
	if err := r.db.SelectContext(ctx, &items, query, args...); err != nil {
		return nil, 0, domain.ResponseSummary{}, err
	}

	summary, err := r.SummaryByForm(ctx, formID)
	if err != nil {
		return nil, 0, domain.ResponseSummary{}, err
	}

	return items, total, summary, nil
}

func (r *ResponseRepository) SummaryByForm(ctx context.Context, formID any) (domain.ResponseSummary, error) {
	var summary domain.ResponseSummary
	err := r.db.GetContext(ctx, &summary, `
		SELECT COUNT(*) AS total,
		       COUNT(*) FILTER (WHERE verification_status = 'PENDING') AS pending,
		       COUNT(*) FILTER (WHERE verification_status = 'ACCEPTED') AS accepted,
		       COUNT(*) FILTER (WHERE verification_status = 'REJECTED') AS rejected,
		       COUNT(*) FILTER (WHERE verification_status = 'REVISION') AS revision
		FROM form_responses
		WHERE form_id = $1
	`, formID)
	return summary, err
}

func (r *ResponseRepository) GetByID(ctx context.Context, formID, responseID any) (*domain.AdminResponse, error) {
	var response domain.AdminResponse
	err := r.db.GetContext(ctx, &response, `
		SELECT r.id, r.form_id, r.registration_number, r.answers, r.metadata,
		       r.verification_status, r.verification_note, r.verified_by,
		       u.nama AS verified_by_name, r.verified_at, r.submitted_at
		FROM form_responses r
		LEFT JOIN users u ON u.id = r.verified_by
		WHERE r.form_id = $1 AND r.id = $2
	`, formID, responseID)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &response, nil
}

func (r *ResponseRepository) UpdateVerification(ctx context.Context, formID, responseID any, status string, note *string, verifierID any) error {
	result, err := r.db.ExecContext(ctx, `
		UPDATE form_responses
		SET verification_status = $3::text,
		    verification_note = $4,
		    verified_by = $5,
		    verified_at = CASE WHEN $3::text = 'PENDING' THEN NULL ELSE NOW() END
		WHERE form_id = $1 AND id = $2
	`, formID, responseID, status, note, verifierID)
	if err != nil {
		return err
	}
	affected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if affected == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (r *ResponseRepository) ExportRows(ctx context.Context, formID any, filter ResponseListFilter) (*sqlx.Rows, error) {
	where, args := buildResponseFilter(formID, filter)
	query := fmt.Sprintf(`
		SELECT r.id, r.form_id, r.registration_number, r.answers, r.metadata,
		       r.verification_status, r.verification_note, r.verified_by,
		       u.nama AS verified_by_name, r.verified_at, r.submitted_at
		FROM form_responses r
		LEFT JOIN users u ON u.id = r.verified_by
		WHERE %s
		ORDER BY r.submitted_at ASC
	`, where)
	return r.db.QueryxContext(ctx, query, args...)
}

func buildResponseFilter(formID any, filter ResponseListFilter) (string, []any) {
	conditions := []string{"r.form_id = $1"}
	args := []any{formID}

	if status := strings.TrimSpace(filter.VerificationStatus); status != "" {
		args = append(args, status)
		conditions = append(conditions, fmt.Sprintf("r.verification_status = $%d", len(args)))
	}
	if search := strings.TrimSpace(filter.Search); search != "" {
		args = append(args, "%"+search+"%")
		conditions = append(conditions, fmt.Sprintf("(r.answers::text ILIKE $%d OR COALESCE(r.registration_number, '') ILIKE $%d)", len(args), len(args)))
	}
	if kodeKec := strings.TrimSpace(filter.KodeKec); kodeKec != "" && strings.TrimSpace(filter.RegionalFieldID) != "" {
		args = append(args, filter.RegionalFieldID)
		fieldArg := len(args)
		args = append(args, kodeKec)
		conditions = append(conditions, fmt.Sprintf("r.answers -> $%d ->> 'kode_kec' = $%d", fieldArg, len(args)))
	}
	if filter.DateFrom != nil {
		args = append(args, *filter.DateFrom)
		conditions = append(conditions, fmt.Sprintf("r.submitted_at >= $%d", len(args)))
	}
	if filter.DateTo != nil {
		args = append(args, *filter.DateTo)
		conditions = append(conditions, fmt.Sprintf("r.submitted_at <= $%d", len(args)))
	}

	return strings.Join(conditions, " AND "), args
>>>>>>> 07c00404be99e7853df025b53dea2a67f4023a33
}
