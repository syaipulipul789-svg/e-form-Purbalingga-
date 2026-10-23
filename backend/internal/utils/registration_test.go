package utils

import (
	"regexp"
	"testing"

	"github.com/google/uuid"
)

func TestGenerateRegistrationNumber(t *testing.T) {
	id := uuid.MustParse("baa3c411-9e6d-4fd1-a312-32058982d495")
	got := GenerateRegistrationNumber(id)

	pattern := regexp.MustCompile(`^PBG-\d{4}-[A-F0-9]{8}$`)
	if !pattern.MatchString(got) {
		t.Fatalf("registration number %q does not match expected format", got)
	}
	if got != "PBG-2026-BAA3C411" && got[9:] != "BAA3C411" {
		t.Fatalf("unexpected registration number suffix: %q", got)
	}
}

func TestHashNIK(t *testing.T) {
	first := HashNIK("3303151201900001", "secret-a")
	second := HashNIK("3303151201900001", "secret-a")
	third := HashNIK("3303151201900001", "secret-b")

	if first != second {
		t.Fatal("expected deterministic hash for the same input and secret")
	}
	if first == third {
		t.Fatal("expected different hash when secret changes")
	}
	if len(first) != 64 {
		t.Fatalf("expected 64 character SHA-256 hex hash, got %d", len(first))
	}
}

func TestIsValidNIK(t *testing.T) {
	if !IsValidNIK("3303151201900001") {
		t.Fatal("expected valid Purbalingga NIK")
	}
	if IsValidNIK("3203151201900001") {
		t.Fatal("expected NIK with non-Purbalingga prefix to be invalid")
	}
	if IsValidNIK("330315120190001") {
		t.Fatal("expected 15 digit NIK to be invalid")
	}
}
