package domain

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type AdminOPD struct {
	ID         uuid.UUID `db:"id" json:"id"`
	KodeOPD    string    `db:"kode_opd" json:"kode_opd"`
	NamaOPD    string    `db:"nama_opd" json:"nama_opd"`
	Singkatan  *string   `db:"singkatan" json:"singkatan"`
	LogoURL    *string   `db:"logo_url" json:"logo_url"`
	TotalUsers int       `db:"total_users" json:"total_users"`
	TotalForms int       `db:"total_forms" json:"total_forms"`
	CreatedAt  time.Time `db:"created_at" json:"created_at"`
}

type AdminUser struct {
	ID        uuid.UUID  `db:"id" json:"id"`
	OPDID     *uuid.UUID `db:"opd_id" json:"opd_id"`
	OPDName   *string    `db:"opd_name" json:"opd_name"`
	Nama      string     `db:"nama" json:"nama"`
	Email     string     `db:"email" json:"email"`
	Role      string     `db:"role" json:"role"`
	IsActive  bool       `db:"is_active" json:"is_active"`
	CreatedAt time.Time  `db:"created_at" json:"created_at"`
}

type AdminOPDRequest struct {
	KodeOPD   string  `json:"kode_opd" binding:"required"`
	NamaOPD   string  `json:"nama_opd" binding:"required"`
	Singkatan *string `json:"singkatan"`
	LogoURL   *string `json:"logo_url"`
}

type AdminUserRequest struct {
	OPDID    uuid.UUID `json:"opd_id" binding:"required"`
	Nama     string    `json:"nama" binding:"required"`
	Email    string    `json:"email" binding:"required,email"`
	Role     string    `json:"role" binding:"required"`
	Password string    `json:"password"`
}

type AdminUserStatusRequest struct {
	IsActive bool `json:"is_active"`
}

type AdminMetrics struct {
	Status         string    `db:"status" json:"status"`
	Database       string    `db:"database" json:"database"`
	TotalOPD       int       `db:"total_opd" json:"total_opd"`
	TotalUsers     int       `db:"total_users" json:"total_users"`
	ActiveUsers    int       `db:"active_users" json:"active_users"`
	TotalForms     int       `db:"total_forms" json:"total_forms"`
	Published      int       `db:"published_forms" json:"published_forms"`
	TotalResponses int       `db:"total_responses" json:"total_responses"`
	CheckedAt      time.Time `db:"checked_at" json:"checked_at"`
}

type AuditEntry struct {
	ID         uuid.UUID       `db:"id" json:"id"`
	ActorID    uuid.UUID       `db:"actor_id" json:"actor_id"`
	ActorName  string          `db:"actor_name" json:"actor_name"`
	ActorEmail string          `db:"actor_email" json:"actor_email"`
	Action     string          `db:"action" json:"action"`
	EntityType string          `db:"entity_type" json:"entity_type"`
	EntityID   *string         `db:"entity_id" json:"entity_id"`
	EntityName string          `db:"entity_name" json:"entity_name"`
	Details    json.RawMessage `db:"details" json:"details"`
	IPAddress  string          `db:"ip_address" json:"ip_address"`
	CreatedAt  time.Time       `db:"created_at" json:"created_at"`
}

type AuditListQuery struct {
	Page       int
	Limit      int
	EntityType string
	Search     string
}

type AuditListResponse struct {
	Items []AuditEntry `json:"items"`
	Page  int           `json:"page"`
	Limit int           `json:"limit"`
	Total int           `json:"total"`
}
