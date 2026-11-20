package migrations

import "embed"

// FS berisi seluruh berkas migrasi SQL yang dijalankan otomatis saat backend startup.
//
//go:embed *.sql
var FS embed.FS
