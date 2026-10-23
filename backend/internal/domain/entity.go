package domain

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type Kecamatan struct {
	KodeKec       int    `json:"kode_kec"`
	NamaKecamatan string `json:"nama_kecamatan"`
	KodeKab       string `json:"kode_kab"`
	KodeSKPD      int    `json:"kode_skpd,omitempty"`
}

type Desa struct {
	KodeDesa int64  `json:"kode_desa"`
	KodeKec  int    `json:"kode_kec"`
	NamaDesa string `json:"nama_desa"`
	KodeKab  string `json:"kode_kab,omitempty"`
}

type OPD struct {
	ID        uuid.UUID `db:"id" json:"id"`
	KodeOPD   string    `db:"kode_opd" json:"kode_opd"`
	NamaOPD   string    `db:"nama_opd" json:"nama_opd"`
	Singkatan *string   `db:"singkatan" json:"singkatan"`
	LogoURL   *string   `db:"logo_url" json:"logo_url"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
}

type User struct {
	ID           uuid.UUID  `db:"id" json:"id"`
	OPDID        *uuid.UUID `db:"opd_id" json:"opd_id"`
	Nama         string     `db:"nama" json:"nama"`
	Email        string     `db:"email" json:"email"`
	PasswordHash string     `db:"password_hash" json:"-"`
	Role         string     `db:"role" json:"role"`
	IsActive     bool       `db:"is_active" json:"is_active"`
	CreatedAt    time.Time  `db:"created_at" json:"created_at"`
}

type Form struct {
	ID             uuid.UUID       `db:"id" json:"id"`
	OPDID          uuid.UUID       `db:"opd_id" json:"opd_id"`
	CreatorID      uuid.UUID       `db:"creator_id" json:"creator_id"`
	Slug           string          `db:"slug" json:"slug"`
	Title          string          `db:"title" json:"title"`
	Description    *string         `db:"description" json:"description"`
	BannerURL      *string         `db:"banner_url" json:"banner_url"`
	Status         string          `db:"status" json:"status"`
	Schema         json.RawMessage `db:"schema" json:"schema"`
	Settings       json.RawMessage `db:"settings" json:"settings"`
	TotalResponses int             `db:"total_responses" json:"total_responses"`
	StartDate      *time.Time      `db:"start_date" json:"start_date"`
	EndDate        *time.Time      `db:"end_date" json:"end_date"`
	CreatedAt      time.Time       `db:"created_at" json:"created_at"`
	UpdatedAt      time.Time       `db:"updated_at" json:"updated_at"`
}

type FormResponse struct {
	ID                   uuid.UUID       `db:"id" json:"id"`
	FormID               uuid.UUID       `db:"form_id" json:"form_id"`
	RespondentIdentifier *string         `db:"respondent_identifier" json:"respondent_identifier"`
	Answers              json.RawMessage `db:"answers" json:"answers"`
	Metadata             json.RawMessage `db:"metadata" json:"metadata"`
	RegistrationNumber   *string         `db:"registration_number" json:"registration_number"`
	IdempotencyKey       *string         `db:"idempotency_key" json:"-"`
	SubmittedAt          time.Time       `db:"submitted_at" json:"submitted_at"`
}
