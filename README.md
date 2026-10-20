# E-Form Kabupaten Purbalingga 🏛️📝

> **Sistem Informasi Formulir & Survei Digital Terpadu Pemerintah Kabupaten Purbalingga**
> Platform form dinamis ala Google Forms dengan integrasi data wilayah bertingkat (*Live API Sidami Purbalingga*), manajemen multi-OPD, dan antarmuka **Professional Neobrutalism UI**.

[![Go Version](https://img.shields.io/badge/Go-1.22+-00ADD8?style=flat&logo=go)](https://go.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2+-black?style=flat&logo=next.js)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker)](https://www.docker.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v3.4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![UI Style](https://img.shields.io/badge/UI-Civic%20Neobrutalism-065F46?style=flat)](./DESIGN.md)

---

## 📌 Ikhtisar Aplikasi

**E-Form Kabupaten Purbalingga** adalah sistem terpusat bagi seluruh Organisasi Perangkat Daerah (OPD), Badan, dan Kantor Kecamatan di lingkungan Pemerintah Kabupaten Purbalingga untuk membuat, mempublikasikan, dan mengelola formulir publik serta survei secara mandiri dan terstandarisasi.

### ✨ Fitur Unggulan:
- 🧩 **Dynamic Form Builder:** Merakit formulir fleksibel ala Google Forms dengan semua tipe input (teks, paragraf, angka, pilihan ganda, checkbox, upload berkas KTP, tanggal/waktu, skala rating kepuasan, hingga tanda tangan digital).
- 🗺️ **Spesial Input Wilayah Purbalingga (Chaining Live API):** Dropdown bertingkat otomatis dari 18 Kecamatan dan 224 Desa/Kelurahan se-Kabupaten Purbalingga yang terhubung langsung ke **API Sidami Purbalingga**.
- 🏢 **Arsitektur Multi-OPD:** Tiap dinas memiliki ruang kerja dan basis data formulir terisolasi dengan hak akses terproteksi (Super Admin Diskominfo vs Admin OPD).
- 📊 **Analitik & Ekspor Data Real-Time:** Visualisasi respon secara instan dan ekspor data rekapitulasi ke format Excel (`.xlsx`) dan CSV.
- 🎨 **Civic Neobrutalism UI:** Tampilan berwibawa, bersih, tidak menyilaukan mata, kontras tinggi, 100% responsif, serta penegakan aturan wajib `cursor-pointer` pada seluruh elemen interaktif.

---

## ⚡ Panduan Cepat (Quick Start Guide)

Hanya perlu 3 langkah untuk menjalankan seluruh sistem (Database PostgreSQL, Backend Go REST API, dan Frontend Next.js) di komputer pengembang:

### 1. Salin Konfigurasi Environment
```bash
cp .env.example .env
```

### 2. Jalankan Container via Docker Compose
```bash
docker compose up -d --build
```
*Atau menggunakan Makefile shortcut:*
```bash
make up
```

### 3. Akses Layanan Aplikasi
- **Portal Publik (Next.js):** [http://localhost:3002](http://localhost:3002)
- **Backend REST API (Go):** [http://localhost:8088/api/v1](http://localhost:8088/api/v1)
- **Database PostgreSQL:** `localhost:5433` (User: `postgres`, Pass: `purbalinggapass`, DB: `eform_purbalingga`)

---

## 🔑 Kredensial Awal (Default Seed Data)

Sistem migrasi database otomatis menyediakan akun master awal untuk pengujian:

| Peran (Role) | Email Login | Password | Instansi / OPD |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@purbalinggakab.go.id` | `Purbalingga2026!` | Diskominfo Purbalingga |
| **Admin OPD** | `admin.dinkes@purbalinggakab.go.id` | `Purbalingga2026!` | Dinas Kesehatan Purbalingga |
| **Admin OPD** | `admin.dinsos@purbalinggakab.go.id` | `Purbalingga2026!` | Dinas Sosial Purbalingga |
| **Admin OPD** | `admin.dkukm@purbalinggakab.go.id` | `Purbalingga2026!` | Dinas Koperasi dan UKM Purbalingga |

---

## 🗺️ Integrasi API Wilayah Purbalingga (Sidami)

Data wilayah Kecamatan & Desa Purbalingga **tidak disimpan di database**, melainkan diambil secara dinamis dan *real-time* langsung dari API Sidami resmi Pemkab Purbalingga:

- **Daftar 18 Kecamatan:** `GET /api/v1/wilayah/kecamatan`
  - *Sumber API Sidami:* `https://api.sidami.purbalinggakab.go.id/api/datakecamatan?size=-1`
- **Daftar Desa per Kecamatan:** `GET /api/v1/wilayah/desa?kode_kec={kode_kec}`
  - *Sumber API Sidami:* `https://api.sidami.purbalinggakab.go.id/api/datadesa?kode_kec=equal:{kode_kec}&size=-1`

*Pengujian cepat di terminal:*
```bash
# Cek 18 Kecamatan
curl -s http://localhost:8088/api/v1/wilayah/kecamatan

# Cek Desa di Kecamatan Padamara (330315)
curl -s "http://localhost:8088/api/v1/wilayah/desa?kode_kec=330315"
```

---

## 📚 Dokumen Spesifikasi & Perencanaan Lengkap

Arsitektur dan panduan lengkap proyek terbagi ke dalam dokumen spesifikasi berikut:

- 📖 **[GEMINI.md](file:///home/novikd/projek/e-form-purbalingga/GEMINI.md):** Standar pengembangan utama, panduan keamanan OWASP/UU PDP, dan konvensi penulisan kode.
- 📐 **[ARCHITECTURE.md](file:///home/novikd/projek/e-form-purbalingga/ARCHITECTURE.md):** Diagram arsitektur sistem, skema basis data PostgreSQL (`JSONB`), spesifikasi schema form builder, dan topologi Docker.
- 🎨 **[DESIGN.md](file:///home/novikd/projek/e-form-purbalingga/DESIGN.md):** Panduan **Civic Neobrutalism Design System**, token warna (Deep Forest Emerald & Slate), dan penegakan aturan wajib `cursor-pointer`.
- 🔄 **[APP_FLOW.md](file:///home/novikd/projek/e-form-purbalingga/APP_FLOW.md):** Pemetaan persona, diagram urutan alur pembuatan form, pengisian publik, hingga ekspor data respons.
- 🔌 **[API_SPEC.md](file:///home/novikd/projek/e-form-purbalingga/API_SPEC.md):** Kontrak REST API v1 lengkap antara frontend dan backend.

---

## 🛠️ Perintah Makefile yang Tersedia

Gunakan `make <perintah>` di terminal root untuk mempercepat alur kerja:

```bash
make help          # Menampilkan daftar seluruh perintah yang tersedia
make up            # Menjalankan seluruh container di background
make down          # Menghentikan seluruh container
make build         # Membangun ulang seluruh image Docker
make restart       # Memulai ulang container secara bersih
make logs          # Memantau logs live seluruh service
make logs-backend  # Memantau logs khusus backend Go
make logs-frontend # Memantau logs khusus frontend Next.js
make db-shell      # Masuk ke shell psql interaktif di PostgreSQL
make clean         # Menghapus seluruh container dan volume data Docker
```

---

## 📁 Struktur Direktori Repositori

```plaintext
e-form-purbalingga/
├── docker-compose.yml          # Konfigurasi container Frontend, Backend, Postgres
├── Makefile                    # Perintah jalan cepat untuk pengembang
├── .env.example                # Template variabel lingkungan
├── API_SPEC.md                 # Spesifikasi endpoint REST API
├── ARCHITECTURE.md             # Arsitektur sistem & diagram ERD
├── DESIGN.md                   # Panduan Neobrutalism & UI tokens
├── APP_FLOW.md                 # Alur pengguna & diagram sekuens
├── GEMINI.md                   # Konvensi coding & pedoman keamanan
├── README.md                   # Dokumentasi master proyek
│
├── backend/                    # Golang 1.22 REST API Server
│   ├── cmd/server/main.go      # Entrypoint server Go dengan graceful shutdown
│   ├── internal/               # Clean architecture (handler, service, entity)
│   │   ├── config/             # Loader konfigurasi .env
│   │   ├── database/           # Connection pooler PostgreSQL
│   │   ├── domain/             # Entitas DTO (Form, User, OPD, Wilayah)
│   │   ├── handler/            # HTTP Controller Gin (Wilayah, Form)
│   │   └── service/            # Logika bisnis & Live Proxy API Sidami
│   ├── migrations/             # DDL PostgreSQL & Seeder awal otomatis
│   │   ├── 01_init_schema.sql  # Inisialisasi tabel & index GIN JSONB
│   │   └── 02_seed_initial_data.sql # Seed akun awal & formulir contoh
│   └── storage/uploads/        # Volume disk lokal upload berkas KTP & foto
│
└── frontend/                   # Next.js 14+ App Router & Tailwind CSS
    ├── public/                 # Direktori berkas statis & favicon
    ├── src/
    │   ├── app/                # Halaman portal, layout & routing App Router
    │   │   ├── globals.css     # Aturan Neobrutalism & 100% cursor-pointer
    │   │   ├── layout.tsx      # Root layout aplikasi
    │   │   └── page.tsx        # Portal direktori formulir resmi Purbalingga
    │   └── components/
    │       └── regional/
    │           └── PurbalinggaRegionalSelect.tsx # Komponen chaining Kecamatan-Desa
    ├── tailwind.config.ts      # Token warna & bayangan neobrutalis
    └── Dockerfile              # Multi-stage production build Next.js
```

---

## 🔒 Kebijakan Keamanan & Kepatuhan Regulasi (UU PDP)

1. **Sanitasi Berkas Unggahan:** Berkas foto KTP/lampiran dokumen disanitasi menggunakan `filepath.Base`, diubah menjadi UUID unik acak (`<uuid>_<timestamp>.<ext>`), serta divalidasi berdasarkan *Magic Bytes* (header MIME asli).
2. **Perlindungan Injeksi:** Akses basis data PostgreSQL selalu menggunakan kueri terparameterisasi (*parameterized queries* `$1, $2, ...`) untuk mencegah SQL Injection.
3. **Pencegahan Double-Submit:** Pengiriman respon formulir dilindungi dengan status tombol `disabled` dan token *Idempotency-Key*.
4. **Isolasi Multi-Tenant:** Hak akses data formulir dan respon terisolasi secara ketat berdasarkan `opd_id` masing-masing dinas.

---

## 🏛️ Lisensi & Hak Cipta

Dikelola dan dikembangkan untuk **Pemerintah Kabupaten Purbalingga** melalui **Dinas Komunikasi dan Informatika (Diskominfo)**. Hak Cipta © 2026.
#   e - f o r m  
 