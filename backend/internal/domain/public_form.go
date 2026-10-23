package domain

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type OPDSummary struct {
	ID        uuid.UUID `json:"id"`
	KodeOPD   string    `json:"kode_opd"`
	NamaOPD   string    `json:"nama_opd"`
	Singkatan *string   `json:"singkatan"`
}

type PublicForm struct {
	ID             uuid.UUID       `json:"id"`
	Slug           string          `json:"slug"`
	Title          string          `json:"title"`
	Description    *string         `json:"description"`
	BannerURL      *string         `json:"banner_url"`
	Status         string          `json:"status"`
	Schema         json.RawMessage `json:"schema"`
	Settings       json.RawMessage `json:"settings"`
	TotalResponses int             `json:"total_responses"`
	StartDate      *time.Time      `json:"start_date"`
	EndDate        *time.Time      `json:"end_date"`
	IsOpen         bool            `json:"is_open"`
	ClosedReason   string          `json:"closed_reason,omitempty"`
	OPD            OPDSummary      `json:"opd"`
}

type FormSettings struct {
	IsPublic          bool       `json:"is_public"`
	RequireNIK        bool       `json:"require_nik"`
	OneResponsePerNIK bool       `json:"one_response_per_nik"`
	MaxSubmissions    int        `json:"max_submissions"`
	StartDate         *time.Time `json:"start_date"`
	EndDate           *time.Time `json:"end_date"`
}

type SubmitResult struct {
	SubmissionID       uuid.UUID `json:"submission_id"`
	RegistrationNumber string    `json:"registration_number"`
	SubmittedAt        time.Time `json:"submitted_at"`
}

type UploadResult struct {
	FileID       uuid.UUID `json:"file_id"`
	OriginalName string    `json:"original_name"`
	FileURL      string    `json:"file_url"`
	FileSize     int64     `json:"file_size"`
	MimeType     string    `json:"mime_type"`
}
