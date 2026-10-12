# E-Form Kabupaten Purbalingga 🏛️📝

> **Sistem Formulir Digital Terpadu Pemerintah Kabupaten Purbalingga**
> Platform form dinamis ala Google Forms dengan integrasi data wilayah (Sidami Purbalingga), sistem Multi-OPD, dan estetika **Neobrutalism UI**.

[![Go Version](https://img.shields.io/badge/Go-1.22+-00ADD8?style=flat&logo=go)](https://go.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=flat&logo=next.js)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker)](https://www.docker.com/)
[![Style](https://img.shields.io/badge/UI-Neobrutalism-FFE600?style=flat)](./DESIGN.md)

---

## ⚡ Panduan Cepat (Developer Quick Start)

Hanya perlu 3 langkah untuk menjalankan seluruh sistem (Database, Backend Go, Frontend Next.js) di laptop Anda:

### 1. Salin Konfigurasi Environment
```bash
cp .env.example .env
```

### 2. Jalankan Container via Docker Compose
```bash
docker compose up -d --build
```
*Atau menggunakan Makefile:*
```bash
make up
```

### 3. Akses Layanan di Browser
- **Frontend Portal (Next.js):** [http://localhost:3000](http://localhost:3000)
- **Backend REST API (Go):** [http://localhost:8080/api/v1](http://localhost:8080/api/v1)
- **PostgreSQL Database:** `localhost:5432` (User: `postgres`, Pass: `purbalinggapass`, DB: `eform_purbalingga`)

---

## 🔑 Kredensial Awal (Default Seeder)

Saat migrasi awal dijalankan, sistem secara otomatis menyediakan akun default:

| Role | Email Login | Password | Keterangan |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@purbalinggakab.go.id` | `Purbalingga2026!` | Diskominfo Purbalingga |
| **Admin OPD** | `admin.dinkes@purbalinggakab.go.id` | `Purbalingga2026!` | Dinas Kesehatan Purbalingga |
| **Admin OPD** | `admin.dinsos@purbalinggakab.go.id` | `Purbalingga2026!` | Dinas Sosial Purbalingga |

---

## 📚 Dokumen Arsitektur & Spesifikasi

Silakan baca dokumen perencanaan berikut sebelum mulai mengoding:

- 📖 **[GEMINI.md](file:///home/novikd/projek/e-form-purbalingga/GEMINI.md):** Aturan coding, standar keamanan data pribadi, dan konvensi proyek.
- 📐 **[ARCHITECTURE.md](file:///home/novikd/projek/e-form-purbalingga/ARCHITECTURE.md):** Diagram arsitektur sistem, skema basis data PostgreSQL (JSONB), dan alur caching API Sidami.
- 🎨 **[DESIGN.md](file:///home/novikd/projek/e-form-purbalingga/DESIGN.md):** Sistem desain **Neobrutalism** Purbalingga, palet warna, hard drop shadow, dan aturan wajib `cursor-pointer`.
- 🔄 **[APP_FLOW.md](file:///home/novikd/projek/e-form-purbalingga/APP_FLOW.md):** Alur kerja end-to-end, alur form builder, pengisian publik, hingga ekspor respon.
- 🔌 **[API_SPEC.md](file:///home/novikd/projek/e-form-purbalingga/API_SPEC.md):** Kontrak REST API v1 lengkap antara frontend dan backend.

---

## 🛠️ Perintah Makefile yang Tersedia

Gunakan `make <perintah>` untuk mempercepat proses pengembangan:

```bash
make help          # Menampilkan bantuan seluruh perintah
make up            # Menjalankan container di background
make down          # Menghentikan seluruh container
make logs          # Memantau live logs seluruh container
make logs-backend  # Memantau logs backend Go
make logs-frontend # Memantau logs frontend Next.js
make migrate-up    # Menjalankan migrasi database
make migrate-down  # Melakukan rollback migrasi database
make seed          # Memasukkan data awal (OPD, Admin, Wilayah Purbalingga)
make clean         # Menghapus volume & container docker
```

---

## 📁 Struktur Repositori

```plaintext
e-form-purbalingga/
├── docker-compose.yml          # Konfigurasi container Frontend, Backend, DB
├── Makefile                    # Shortcut perintah developer
├── .env.example                # Template variabel lingkungan
├── API_SPEC.md                 # Spesifikasi endpoint REST API
├── ARCHITECTURE.md             # Arsitektur sistem & ERD
├── DESIGN.md                   # Panduan Neobrutalism & UI tokens
├── APP_FLOW.md                 # Alur pengguna & sequence diagram
├── GEMINI.md                   # Konvensi coding & pedoman keamanan
│
├── backend/                    # Golang 1.22 REST API Server
│   ├── cmd/server/main.go      # Entrypoint server Go
│   ├── internal/               # Clean architecture (handler, service, repo)
│   ├── migrations/             # Migrasi SQL & seeder awal
│   └── storage/uploads/        # Volume lokal berkas KTP & foto
│
└── frontend/                   # Next.js 14+ App Router & Tailwind CSS
    ├── src/app/                # Halaman portal & form builder
    ├── src/components/         # Komponen Neobrutalism & Chaining Wilayah
    └── tailwind.config.ts      # Konfigurasi token neobrutalis
```

---

## 🔒 Kebijakan Keamanan & Kepatuhan UU PDP
1. Berkas KTP/dokumen pendukung disimpan di volume terlindung dengan validasi *Magic Bytes* (MIME sniffing) dan sanitasi nama berkas acak (UUID).
2. Data wilayah Kecamatan & Desa Purbalingga sepenuhnya diambil secara *live* dari API Sidami resmi tanpa disimpan di database, memastikan data wilayah selalu mutakhir.
3. Seluruh elemen interaktif wajib menyertakan kelas Tailwind `cursor-pointer` untuk konsistensi UX.
