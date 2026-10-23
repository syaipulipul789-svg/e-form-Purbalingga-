package domain

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type AuthUser struct {
	ID     uuid.UUID   `json:"id"`
	Nama   string      `json:"nama"`
	Email  string      `json:"email"`
	Role   string      `json:"role"`
	OPDID  *uuid.UUID  `json:"opd_id,omitempty"`
	OPD    *OPDSummary `json:"opd,omitempty"`
	Active bool        `json:"is_active"`
}

type LoginResult struct {
	Token     string   `json:"token"`
	ExpiresIn int64    `json:"expires_in"`
	User      AuthUser `json:"user"`
}

type FormSummary struct {
	ID             uuid.UUID  `json:"id"`
	OPDID          uuid.UUID  `json:"opd_id"`
	CreatorID      uuid.UUID  `json:"creator_id"`
	Slug           string     `json:"slug"`
	Title          string     `json:"title"`
	Description    *string    `json:"description"`
	BannerURL      *string    `json:"banner_url"`
	Status         string     `json:"status"`
	TotalResponses int        `json:"total_responses"`
	StartDate      *time.Time `json:"start_date"`
	EndDate        *time.Time `json:"end_date"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
	OPD            OPDSummary `json:"opd"`
}

type AdminForm struct {
	FormSummary
	Schema   json.RawMessage `json:"schema"`
	Settings json.RawMessage `json:"settings"`
}

type AdminResponse struct {
	ID                 uuid.UUID       `db:"id" json:"id"`
	FormID             uuid.UUID       `db:"form_id" json:"form_id"`
	RegistrationNumber *string         `db:"registration_number" json:"registration_number"`
	Answers            json.RawMessage `db:"answers" json:"answers"`
	Metadata           json.RawMessage `db:"metadata" json:"metadata"`
	VerificationStatus string          `db:"verification_status" json:"verification_status"`
	VerificationNote   *string         `db:"verification_note" json:"verification_note"`
	VerifiedBy         *uuid.UUID      `db:"verified_by" json:"verified_by"`
	VerifiedByName     *string         `db:"verified_by_name" json:"verified_by_name"`
	VerifiedAt         *time.Time      `db:"verified_at" json:"verified_at"`
	SubmittedAt        time.Time       `db:"submitted_at" json:"submitted_at"`
}

type ResponseSummary struct {
	Total    int `db:"total" json:"total"`
	Pending  int `db:"pending" json:"pending"`
	Accepted int `db:"accepted" json:"accepted"`
	Rejected int `db:"rejected" json:"rejected"`
	Revision int `db:"revision" json:"revision"`
}

type TrendPoint struct {
	Date  string `db:"date" json:"date"`
	Count int    `db:"count" json:"count"`
}

type RecentResponse struct {
	ID                 uuid.UUID `db:"id" json:"id"`
	FormID             uuid.UUID `db:"form_id" json:"form_id"`
	FormTitle          string    `db:"form_title" json:"form_title"`
	FormSlug           string    `db:"form_slug" json:"form_slug"`
	RegistrationNumber *string   `db:"registration_number" json:"registration_number"`
	VerificationStatus string    `db:"verification_status" json:"verification_status"`
	SubmittedAt        time.Time `db:"submitted_at" json:"submitted_at"`
}

type TopForm struct {
	ID             uuid.UUID `db:"id" json:"id"`
	Slug           string    `db:"slug" json:"slug"`
	Title          string    `db:"title" json:"title"`
	TotalResponses int       `db:"total_responses" json:"total_responses"`
	Status         string    `db:"status" json:"status"`
}

type DashboardSummary struct {
	TotalForms          int              `db:"total_forms" json:"total_forms"`
	PublishedForms      int              `db:"published_forms" json:"published_forms"`
	DraftForms          int              `db:"draft_forms" json:"draft_forms"`
	ClosedForms         int              `db:"closed_forms" json:"closed_forms"`
	TotalResponses      int              `db:"total_responses" json:"total_responses"`
	ResponsesToday      int              `db:"responses_today" json:"responses_today"`
	ResponsesThisMonth  int              `db:"responses_this_month" json:"responses_this_month"`
	PendingVerification int              `db:"pending_verification" json:"pending_verification"`
	ResponseTrend       []TrendPoint     `json:"response_trend"`
	RecentResponses     []RecentResponse `json:"recent_responses"`
	TopForms            []TopForm        `json:"top_forms"`
}
