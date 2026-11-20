.PHONY: help up down build restart logs logs-backend logs-frontend db-shell clean migrate test test-backend test-frontend test-e2e

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

migrate: ## Terapkan ulang seluruh migrasi SQL ke database yang sedang berjalan
	@for f in backend/migrations/*.sql; do \
		echo "→ $$f"; \
		docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U $${DB_USER:-postgres} -d $${DB_NAME:-eform_purbalingga} < $$f || exit 1; \
	done
	@echo "✓ Migrasi selesai"

clean: ## Hentikan container dan bersihkan seluruh volume data Docker
	docker compose down -v

test: ## Jalankan seluruh unit test (backend + frontend)
	$(MAKE) test-backend
	$(MAKE) test-frontend

test-backend: ## Jalankan unit test backend Go
	cd backend && go test ./...

test-frontend: ## Jalankan unit test frontend (Jest + RTL)
	cd frontend && npm test

test-e2e: ## Jalankan uji E2E login & RBAC terhadap stack yang sedang hidup
	./test-login.sh
