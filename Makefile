.PHONY: help up down build restart logs logs-backend logs-frontend db-shell clean

help: ## Tampilkan daftar perintah Makefile
	@echo "======================================================================"
	@echo "  E-Form Kabupaten Purbalingga - Perintah Cepat Pengembang"
	@echo "======================================================================"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-18s\033[0m %s\n", $$1, $$2}'

up: ## Jalankan seluruh container di background (Frontend, Backend, Postgres)
	docker compose up -d

down: ## Hentikan seluruh container
	docker compose down

build: ## Bangun ulang seluruh image Docker
	docker compose build

restart: ## Mulai ulang seluruh container
	docker compose down && docker compose up -d

logs: ## Pantau logs dari seluruh service secara live
	docker compose logs -f

logs-backend: ## Pantau logs khusus backend Go
	docker compose logs -f backend

logs-frontend: ## Pantau logs khusus frontend Next.js
	docker compose logs -f frontend

db-shell: ## Masuk ke interactive psql shell di database PostgreSQL
	docker compose exec postgres psql -U postgres -d eform_purbalingga

clean: ## Hentikan container dan bersihkan seluruh volume data Docker
	docker compose down -v
