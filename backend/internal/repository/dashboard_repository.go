package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/purbalinggakab/e-form-purbalingga/internal/domain"
)

type DashboardRepository struct {
	db *sqlx.DB
}

func NewDashboardRepository(db *sqlx.DB) *DashboardRepository {
	return &DashboardRepository{db: db}
}

func (r *DashboardRepository) Summary(ctx context.Context, opdID *uuid.UUID) (*domain.DashboardSummary, error) {
	formWhere, formArgs := scopedFormWhere(opdID, "f")
	responseWhere, responseArgs := scopedFormWhere(opdID, "f")

	summary := &domain.DashboardSummary{}

	var formCounts struct {
		Total     int `db:"total"`
		Published int `db:"published"`
		Draft     int `db:"draft"`
		Closed    int `db:"closed"`
	}
	if err := r.db.GetContext(ctx, &formCounts, `
		SELECT COUNT(*) AS total,
		       COUNT(*) FILTER (WHERE f.status = 'PUBLISHED') AS published,
		       COUNT(*) FILTER (WHERE f.status = 'DRAFT') AS draft,
		       COUNT(*) FILTER (WHERE f.status = 'CLOSED') AS closed
		FROM forms f
		WHERE `+formWhere, formArgs...); err != nil {
		return nil, err
	}
	summary.TotalForms = formCounts.Total
	summary.PublishedForms = formCounts.Published
	summary.DraftForms = formCounts.Draft
	summary.ClosedForms = formCounts.Closed

	if err := r.db.GetContext(ctx, summary, `
		SELECT COUNT(*) AS total_responses,
		       COUNT(*) FILTER (WHERE r.submitted_at::date = CURRENT_DATE) AS responses_today,
		       COUNT(*) FILTER (WHERE date_trunc('month', r.submitted_at) = date_trunc('month', CURRENT_DATE)) AS responses_this_month,
		       COUNT(*) FILTER (WHERE r.verification_status = 'PENDING') AS pending_verification
		FROM form_responses r
		JOIN forms f ON f.id = r.form_id
		WHERE `+responseWhere, responseArgs...); err != nil {
		return nil, err
	}

	trendWhere := "1=1"
	if opdID != nil {
		trendWhere = "f.opd_id = $1"
	}
	trendArgs := make([]any, 0)
	if opdID != nil {
		trendArgs = append(trendArgs, *opdID)
	}
	trend := make([]domain.TrendPoint, 0)
	trendQuery := fmt.Sprintf(`
		WITH days AS (
			SELECT generate_series(CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE, INTERVAL '1 day')::date AS day
		)
		SELECT to_char(days.day, 'YYYY-MM-DD') AS date, COUNT(f.id) AS count
		FROM days
		LEFT JOIN form_responses r ON r.submitted_at::date = days.day
		LEFT JOIN forms f ON f.id = r.form_id AND %s
		GROUP BY days.day
		ORDER BY days.day
	`, trendWhere)
	if err := r.db.SelectContext(ctx, &trend, trendQuery, trendArgs...); err != nil {
		return nil, err
	}
	summary.ResponseTrend = trend

	recentWhere, recentArgs := scopedFormWhere(opdID, "f")
	recent := make([]domain.RecentResponse, 0)
	if err := r.db.SelectContext(ctx, &recent, `
		SELECT r.id, r.form_id, f.title AS form_title, f.slug AS form_slug,
		       r.registration_number, r.verification_status, r.submitted_at
		FROM form_responses r
		JOIN forms f ON f.id = r.form_id
		WHERE `+recentWhere+`
		ORDER BY r.submitted_at DESC
		LIMIT 5
	`, recentArgs...); err != nil {
		return nil, err
	}
	summary.RecentResponses = recent

	topWhere, topArgs := scopedFormWhere(opdID, "f")
	top := make([]domain.TopForm, 0)
	if err := r.db.SelectContext(ctx, &top, `
		SELECT f.id, f.slug, f.title, f.total_responses, f.status
		FROM forms f
		WHERE `+topWhere+`
		ORDER BY f.total_responses DESC, f.updated_at DESC
		LIMIT 5
	`, topArgs...); err != nil {
		return nil, err
	}
	summary.TopForms = top

	return summary, nil
}

func scopedFormWhere(opdID *uuid.UUID, alias string) (string, []any) {
	if opdID == nil {
		return "1=1", nil
	}
	return fmt.Sprintf("%s.opd_id = $1", alias), []any{*opdID}
}
