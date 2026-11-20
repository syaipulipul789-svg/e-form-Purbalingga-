package utils

import (
	"encoding/json"
	"testing"
)

const testSchema = `{
	"sections": [{
		"id": "sec_1",
		"fields": [
			{"id": "f_nik", "type": "nik", "label": "NIK", "required": true},
			{"id": "f_nama", "type": "text", "label": "Nama", "required": true},
			{"id": "f_rating", "type": "rating", "label": "Rating", "required": true, "config": {"min": 1, "max": 5}},
			{"id": "f_setuju", "type": "checkbox", "label": "Setuju", "required": true, "options": [{"value": "setuju", "label": "Setuju"}]}
		]
	}]
}`

func TestValidateAnswersValid(t *testing.T) {
	answers := map[string]any{
		"f_nik":    "3303151201900001",
		"f_nama":   "Budi Santoso",
		"f_rating": "4",
		"f_setuju": true,
	}

	if details := ValidateAnswers(json.RawMessage(testSchema), answers); len(details) != 0 {
		t.Fatalf("expected no validation errors, got %+v", details)
	}
}

func TestValidateAnswersMissingRequired(t *testing.T) {
	answers := map[string]any{
		"f_nik": "3303151201900001",
	}

	details := ValidateAnswers(json.RawMessage(testSchema), answers)
	if len(details) != 3 {
		t.Fatalf("expected 3 validation errors, got %d: %+v", len(details), details)
	}
}

func TestValidateAnswersInvalidNIK(t *testing.T) {
	answers := map[string]any{
		"f_nik":    "12345",
		"f_nama":   "Budi Santoso",
		"f_rating": 4,
		"f_setuju": true,
	}

	details := ValidateAnswers(json.RawMessage(testSchema), answers)
	if len(details) != 1 || details[0].Field != "f_nik" {
		t.Fatalf("expected NIK validation error, got %+v", details)
	}
}

func TestValidateAnswersOutOfRangeRating(t *testing.T) {
	answers := map[string]any{
		"f_nik":    "3303151201900001",
		"f_nama":   "Budi Santoso",
		"f_rating": 9,
		"f_setuju": true,
	}

	details := ValidateAnswers(json.RawMessage(testSchema), answers)
	if len(details) != 1 || details[0].Field != "f_rating" {
		t.Fatalf("expected rating validation error, got %+v", details)
	}
}
