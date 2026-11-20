package database

import (
	"context"
	"fmt"
	"log"
	"sort"
	"strings"
	"time"

	"github.com/jmoiron/sqlx"
	migrations "github.com/purbalinggakab/e-form-purbalingga/migrations"
)

// EnsureSchema memastikan kolom dan indeks kritis tersedia pada database yang
// sudah ada sebelum migrasi terbaru diterapkan (mis. volume Docker lama).
func EnsureSchema(ctx context.Context, db *sqlx.DB) error {
	statements := []string{
		`ALTER TABLE form_responses ADD COLUMN IF NOT EXISTS registration_number VARCHAR(50)`,
		`ALTER TABLE form_responses ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED'`,
		`ALTER TABLE form_responses ADD COLUMN IF NOT EXISTS internal_note TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE form_responses ADD COLUMN IF NOT EXISTS public_note TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE form_responses ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES users(id) ON DELETE SET NULL`,
		`ALTER TABLE form_responses ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE`,
		`ALTER TABLE form_responses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`,
		`CREATE UNIQUE INDEX IF NOT EXISTS idx_responses_registration_number ON form_responses(registration_number)`,
		`CREATE UNIQUE INDEX IF NOT EXISTS idx_responses_form_identifier ON form_responses(form_id, respondent_identifier) WHERE respondent_identifier IS NOT NULL`,
		`CREATE INDEX IF NOT EXISTS idx_responses_form_status ON form_responses(form_id, status)`,
		`CREATE INDEX IF NOT EXISTS idx_responses_status ON form_responses(status)`,
	}

	for _, statement := range statements {
		if _, err := db.ExecContext(ctx, statement); err != nil {
			return err
		}
	}
	return nil
}

// RunMigrations menjalankan seluruh berkas migrasi SQL secara berurutan.
// Semua berkas migrasi bersifat idempotent (IF NOT EXISTS / ON CONFLICT),
// sehingga aman dijalankan berulang pada database yang sudah terisi.
func RunMigrations(ctx context.Context, db *sqlx.DB) error {
	entries, err := migrations.FS.ReadDir(".")
	if err != nil {
		return fmt.Errorf("gagal membaca berkas migrasi: %w", err)
	}

	names := make([]string, 0, len(entries))
	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".sql") {
			continue
		}
		names = append(names, entry.Name())
	}
	sort.Strings(names)

	for _, name := range names {
		content, err := migrations.FS.ReadFile(name)
		if err != nil {
			return fmt.Errorf("gagal membaca migrasi %s: %w", name, err)
		}

		execCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
		_, err = db.ExecContext(execCtx, string(content))
		cancel()
		if err != nil {
			return fmt.Errorf("gagal menjalankan migrasi %s: %w", name, err)
		}
		log.Printf("  • Migrasi %s diterapkan", name)
	}

	return nil
}
