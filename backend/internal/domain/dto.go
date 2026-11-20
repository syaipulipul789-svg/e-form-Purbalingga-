package domain

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// LoginRequest adalah payload login admin OPD / super admin.
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

// OPDSummary adalah ringkasan OPD yang disematkan pada profil pengguna.
type OPDSummary struct {
	ID        uuid.UUID `json:"id"`
	KodeOPD   string    `json:"kode_opd"`
	NamaOPD   string    `json:"nama_opd"`
	Singkatan *string   `json:"singkatan"`
	LogoURL   *string   `json:"logo_url"`
}

// AuthUser adalah data pengguna yang dikembalikan pada respon autentikasi.
type AuthUser struct {
	ID    uuid.UUID   `json:"id"`
	Nama  string      `json:"nama"`
	Email string      `json:"email"`
	Role  string      `json:"role"`
	OPD   *OPDSummary `json:"opd"`
}

// LoginResponse adalah respon sukses endpoint login.
type LoginResponse struct {
	Token     string   `json:"token"`
	ExpiresIn int      `json:"expires_in"`
	User      AuthUser `json:"user"`
}

// FormListQuery adalah parameter filter & paginasi daftar formulir.
type FormListQuery struct {
	Page   int
	Limit  int
	Status string
	Search string
}

// FormSummary adalah ringkasan formulir untuk endpoint daftar.
type FormSummary struct {
	ID             uuid.UUID  `json:"id"`
	Slug           string     `json:"slug"`
	Title          string     `json:"title"`
	Description    *string    `json:"description"`
	Status         string     `json:"status"`
	TotalResponses int        `json:"total_responses"`
	StartDate      *time.Time `json:"start_date"`
	EndDate        *time.Time `json:"end_date"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

// FormDetail adalah representasi lengkap formulir untuk pengelolaan admin.
type FormDetail struct {
	FormSummary
	BannerURL *string         `json:"banner_url"`
	Schema    json.RawMessage `json:"schema"`
	Settings  json.RawMessage `json:"settings"`
}

// FormListResponse adalah respon terpaginasi daftar formulir.
type FormListResponse struct {
	Items []FormSummary `json:"items"`
	Page  int           `json:"page"`
	Limit int           `json:"limit"`
	Total int           `json:"total"`
}

// CreateFormRequest adalah payload pembuatan formulir baru.
type CreateFormRequest struct {
	Title       string          `json:"title" binding:"required"`
	Slug        string          `json:"slug"`
	Description *string         `json:"description"`
	BannerURL   *string         `json:"banner_url"`
	Status      string          `json:"status"`
	Schema      json.RawMessage `json:"schema"`
	Settings    json.RawMessage `json:"settings"`
}

// UpdateFormRequest adalah payload pembaruan formulir (parsial).
type UpdateFormRequest struct {
	Title       *string         `json:"title"`
	Slug        *string         `json:"slug"`
	Description *string         `json:"description"`
	BannerURL   *string         `json:"banner_url"`
	Status      *string         `json:"status"`
	Schema      json.RawMessage `json:"schema"`
	Settings    json.RawMessage `json:"settings"`
}

// UpdateStatusRequest adalah payload perubahan status formulir.
type UpdateStatusRequest struct {
	Status string `json:"status" binding:"required"`
}

// PublicFormDetail adalah detail formulir yang aman ditampilkan ke publik.
type PublicFormDetail struct {
	FormSummary
	BannerURL    *string         `json:"banner_url"`
	Schema       json.RawMessage `json:"schema"`
	Settings     json.RawMessage `json:"settings"`
	OPD          OPDSummary      `json:"opd"`
	IsOpen       bool            `json:"is_open"`
	ClosedReason *string         `json:"closed_reason"`
}

// PublicSubmitRequest adalah payload pengiriman jawaban formulir publik.
type PublicSubmitRequest struct {
	RespondentNIK string          `json:"respondent_nik"`
	Answers       json.RawMessage `json:"answers"`
}

// PublicSubmitResponse adalah respon sukses pengiriman formulir.
type PublicSubmitResponse struct {
	SubmissionID       uuid.UUID `json:"submission_id"`
	RegistrationNumber string    `json:"registration_number"`
	SubmittedAt        time.Time `json:"submitted_at"`
}

// FormResponseListQuery adalah parameter filter & paginasi daftar respons.
type FormResponseListQuery struct {
	Page    int
	Limit   int
	Search  string
	KodeKec string
	Status  string
}

// UpdateResponseStatusRequest adalah payload perubahan status pengajuan.
type UpdateResponseStatusRequest struct {
	Status       string `json:"status" binding:"required"`
	PublicNote   string `json:"public_note"`
	InternalNote string `json:"internal_note"`
}

// PublicTrackRequest adalah payload pelacakan status pengajuan oleh warga.
type PublicTrackRequest struct {
	RegistrationNumber string `json:"registration_number" binding:"required"`
	NIK                string `json:"nik" binding:"required"`
}

// PublicTrackResponse adalah status pengajuan yang aman ditampilkan ke warga.
type PublicTrackResponse struct {
	RegistrationNumber string    `db:"registration_number" json:"registration_number"`
	FormTitle          string    `db:"form_title" json:"form_title"`
	Status             string    `db:"status" json:"status"`
	PublicNote         string    `db:"public_note" json:"public_note"`
	SubmittedAt        time.Time `db:"submitted_at" json:"submitted_at"`
	UpdatedAt          time.Time `db:"updated_at" json:"updated_at"`
}

// FormResponseListResponse adalah respon terpaginasi daftar respons formulir.
type FormResponseListResponse struct {
	Items []FormResponse `json:"items"`
	Page  int            `json:"page"`
	Limit int            `json:"limit"`
	Total int            `json:"total"`
}

// UploadResult adalah metadata berkas yang berhasil diunggah.
type UploadResult struct {
	FileID       string `json:"file_id"`
	OriginalName string `json:"original_name"`
	FileURL      string `json:"file_url"`
	FileSize     int64  `json:"file_size"`
	MimeType     string `json:"mime_type"`
}
