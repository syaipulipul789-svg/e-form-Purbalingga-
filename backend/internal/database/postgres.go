package database

import (
	"log"
	"time"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

func InitDB(databaseURL string) (*sqlx.DB, error) {
	db, err := sqlx.Connect("postgres", databaseURL)
	if err != nil {
		return nil, err
	}

	// Set connection pooling parameters
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(5 * time.Minute)

	if err := db.Ping(); err != nil {
		return nil, err
	}

	log.Println("✓ Terhubung ke database PostgreSQL Purbalingga dengan sukses")
	return db, nil
}
