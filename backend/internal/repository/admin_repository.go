package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
	"github.com/purbalinggakab/e-form-purbalingga/internal/domain"
)

var (
	ErrAdminConflict = errors.New("data sudah digunakan")
	ErrAdminNotFound = errors.New("data tidak ditemukan")
)

type AdminRepository interface {
	ListOPDs(ctx context.Context) ([]domain.AdminOPD, error)
	CreateOPD(ctx context.Context, opd domain.AdminOPD, audit AuditRecord) error
	UpdateOPD(ctx context.Context, opd domain.AdminOPD, audit AuditRecord) error
	ListUsers(ctx context.Context) ([]domain.AdminUser, error)
	CreateUser(ctx context.Context, user domain.User, audit AuditRecord) error
	UpdateUser(ctx context.Context, user domain.User, audit AuditRecord) error
	SetUserStatus(ctx context.Context, id uuid.UUID, isActive bool, audit AuditRecord) error
	Metrics(ctx context.Context) (*domain.AdminMetrics, error)
	ListAudit(ctx context.Context, q domain.AuditListQuery) ([]domain.AuditEntry, int, error)
}

type AuditRecord struct {
	ActorID   uuid.UUID
	Action    string
	Entity    string
	EntityID  *uuid.UUID
	Name      string
	Details   json.RawMessage
	IPAddress string
}

type adminRepository struct {
	db *sqlx.DB
}

func NewAdminRepository(db *sqlx.DB) AdminRepository {
	return &adminRepository{db: db}
}

func (r *adminRepository) ListOPDs(ctx context.Context) ([]domain.AdminOPD, error) {
	items := make([]domain.AdminOPD, 0)
	err := r.db.SelectContext(ctx, &items, `
		SELECT o.id, o.kode_opd, o.nama_opd, o.singkatan, o.logo_url, o.created_at,
			COUNT(DISTINCT u.id)::int AS total_users,
			COUNT(DISTINCT f.id)::int AS total_forms
		FROM opd o
		LEFT JOIN users u ON u.opd_id = o.id
		LEFT JOIN forms f ON f.opd_id = o.id
		GROUP BY o.id
		ORDER BY o.nama_opd`)
	return items, err
}

func (r *adminRepository) CreateOPD(ctx context.Context, opd domain.AdminOPD, audit AuditRecord) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback() }()

	_, err = tx.ExecContext(ctx, `
		INSERT INTO opd (id, kode_opd, nama_opd, singkatan, logo_url)
		VALUES ($1, $2, $3, $4, $5)`,
		opd.ID, opd.KodeOPD, opd.NamaOPD, opd.Singkatan, opd.LogoURL)
	if err != nil {
		return mapAdminWriteError(err)
	}
	audit.EntityID = &opd.ID
	if err := insertAudit(ctx, tx, audit); err != nil {
		return err
	}
	return tx.Commit()
}

func (r *adminRepository) UpdateOPD(ctx context.Context, opd domain.AdminOPD, audit AuditRecord) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback() }()

	result, err := tx.ExecContext(ctx, `
		UPDATE opd
		SET kode_opd = $2, nama_opd = $3, singkatan = $4, logo_url = $5, updated_at = NOW()
		WHERE id = $1`,
		opd.ID, opd.KodeOPD, opd.NamaOPD, opd.Singkatan, opd.LogoURL)
	if err != nil {
		return mapAdminWriteError(err)
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return ErrAdminNotFound
	}
	audit.EntityID = &opd.ID
	if err := insertAudit(ctx, tx, audit); err != nil {
		return err
	}
	return tx.Commit()
}

func (r *adminRepository) ListUsers(ctx context.Context) ([]domain.AdminUser, error) {
	items := make([]domain.AdminUser, 0)
	err := r.db.SelectContext(ctx, &items, `
		SELECT u.id, u.opd_id, o.nama_opd AS opd_name, u.nama, u.email,
			u.role, u.is_active, u.created_at
		FROM users u
		LEFT JOIN opd o ON o.id = u.opd_id
		WHERE u.role IN ('ADMIN_OPD', 'OPERATOR')
		ORDER BY u.nama, u.email`)
	return items, err
}

func (r *adminRepository) CreateUser(ctx context.Context, user domain.User, audit AuditRecord) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback() }()

	_, err = tx.ExecContext(ctx, `
		INSERT INTO users (id, opd_id, nama, email, password_hash, role)
		VALUES ($1, $2, $3, $4, $5, $6)`,
		user.ID, user.OPDID, user.Nama, user.Email, user.PasswordHash, user.Role)
	if err != nil {
		return mapAdminWriteError(err)
	}
	audit.EntityID = &user.ID
	if err := insertAudit(ctx, tx, audit); err != nil {
		return err
	}
	return tx.Commit()
}

func (r *adminRepository) UpdateUser(ctx context.Context, user domain.User, audit AuditRecord) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback() }()

	var result sql.Result
	if user.PasswordHash == "" {
		result, err = tx.ExecContext(ctx, `
			UPDATE users SET opd_id = $2, nama = $3, email = $4, role = $5, updated_at = NOW()
			WHERE id = $1 AND role <> 'SUPER_ADMIN'`,
			user.ID, user.OPDID, user.Nama, user.Email, user.Role)
	} else {
		result, err = tx.ExecContext(ctx, `
			UPDATE users SET opd_id = $2, nama = $3, email = $4, role = $5,
				password_hash = $6, updated_at = NOW()
			WHERE id = $1 AND role <> 'SUPER_ADMIN'`,
			user.ID, user.OPDID, user.Nama, user.Email, user.Role, user.PasswordHash)
	}
	if err != nil {
		return mapAdminWriteError(err)
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return ErrAdminNotFound
	}
	audit.EntityID = &user.ID
	if err := insertAudit(ctx, tx, audit); err != nil {
		return err
	}
	return tx.Commit()
}

func (r *adminRepository) SetUserStatus(ctx context.Context, id uuid.UUID, isActive bool, audit AuditRecord) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback() }()

	result, err := tx.ExecContext(ctx,
		`UPDATE users SET is_active = $2, updated_at = NOW() WHERE id = $1 AND role <> 'SUPER_ADMIN'`, id, isActive)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return ErrAdminNotFound
	}
	audit.EntityID = &id
	if err := insertAudit(ctx, tx, audit); err != nil {
		return err
	}
	return tx.Commit()
}

func (r *adminRepository) Metrics(ctx context.Context) (*domain.AdminMetrics, error) {
	metrics := &domain.AdminMetrics{
		Status:    "healthy",
		Database:  "healthy",
		CheckedAt: time.Now(),
	}
	if err := r.db.PingContext(ctx); err != nil {
		metrics.Status = "degraded"
		metrics.Database = "unavailable"
		return metrics, err
	}
	err := r.db.GetContext(ctx, metrics, `
		SELECT
			(SELECT COUNT(*)::int FROM opd) AS total_opd,
			(SELECT COUNT(*)::int FROM users) AS total_users,
			(SELECT COUNT(*)::int FROM users WHERE is_active) AS active_users,
			(SELECT COUNT(*)::int FROM forms) AS total_forms,
			(SELECT COUNT(*)::int FROM forms WHERE status = 'PUBLISHED') AS published_forms,
			(SELECT COALESCE(SUM(total_responses), 0)::int FROM forms) AS total_responses`)
	if err != nil {
		metrics.Status = "degraded"
		metrics.Database = "unavailable"
		return nil, err
	}
	return metrics, nil
}

func (r *adminRepository) ListAudit(ctx context.Context, q domain.AuditListQuery) ([]domain.AuditEntry, int, error) {
	where := " WHERE 1=1"
	args := make([]interface{}, 0, 3)
	if q.EntityType != "" {
		args = append(args, q.EntityType)
		where += fmt.Sprintf(" AND l.entity_type = $%d", len(args))
	}
	if search := strings.TrimSpace(q.Search); search != "" {
		args = append(args, "%"+strings.ToLower(search)+"%")
		index := len(args)
		where += fmt.Sprintf(` AND (
			LOWER(COALESCE(u.nama, '')) LIKE $%d OR LOWER(COALESCE(u.email, '')) LIKE $%d OR
			LOWER(l.action) LIKE $%d OR LOWER(l.entity_name) LIKE $%d
		)`, index, index, index, index)
	}

	var total int
	if err := r.db.GetContext(ctx, &total,
		"SELECT COUNT(*) FROM admin_audit_logs l LEFT JOIN users u ON u.id = l.actor_id"+where, args...); err != nil {
		return nil, 0, err
	}
	dataArgs := append([]interface{}{}, args...)
	dataArgs = append(dataArgs, q.Limit, (q.Page-1)*q.Limit)
	query := `SELECT l.id, l.actor_id, COALESCE(u.nama, 'Akun tidak tersedia') AS actor_name,
		COALESCE(u.email, '') AS actor_email, l.action, l.entity_type, l.entity_id::text AS entity_id,
		l.entity_name, l.details, l.ip_address, l.created_at
		FROM admin_audit_logs l
		LEFT JOIN users u ON u.id = l.actor_id` + where +
		fmt.Sprintf(" ORDER BY created_at DESC LIMIT $%d OFFSET $%d", len(dataArgs)-1, len(dataArgs))
	items := make([]domain.AuditEntry, 0)
	if err := r.db.SelectContext(ctx, &items, query, dataArgs...); err != nil {
		return nil, 0, err
	}
	return items, total, nil
}

type auditExecer interface {
	ExecContext(context.Context, string, ...interface{}) (sql.Result, error)
}

func insertAudit(ctx context.Context, execer auditExecer, audit AuditRecord) error {
	details := audit.Details
	if len(details) == 0 {
		details = json.RawMessage(`{}`)
	}
	_, err := execer.ExecContext(ctx, `
		INSERT INTO admin_audit_logs
			(id, actor_id, action, entity_type, entity_id, entity_name, details, ip_address)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
		uuid.New(), audit.ActorID, audit.Action, audit.Entity, audit.EntityID,
		audit.Name, string(details), audit.IPAddress)
	return err
}

func mapAdminWriteError(err error) error {
	var pqErr *pq.Error
	if errors.As(err, &pqErr) {
		switch pqErr.Code {
		case "23505":
			return ErrAdminConflict
		case "23503":
			return ErrAdminNotFound
		}
	}
	return err
}
