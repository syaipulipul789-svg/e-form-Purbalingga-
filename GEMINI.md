# Panduan Pengembangan Proyek: E-Form Kabupaten Purbalingga

Dokumen ini adalah acuan instruksi utama untuk pengembangan dan pemeliharaan aplikasi **E-Form Kabupaten Purbalingga** — platform formulir dinamis terintegrasi berbasis web ala Google Forms dengan identitas visual Neobrutalism khas Pemerintah Kabupaten Purbalingga.

---

## 1. Ikhtisar Proyek (Project Overview)

- **Nama Aplikasi:** E-Form Kabupaten Purbalingga (*Sistem Formulir Digital Terpadu*)
- **Deskripsi:** Aplikasi pengelola dan pengisi formulir publik serta internal OPD (Organisasi Perangkat Daerah) Kabupaten Purbalingga dengan fitur builder form dinamis lengkap, field khusus wilayah bertingkat (Kecamatan & Desa/Kelurahan via API Sidami Purbalingga), manajemen multi-OPD, dan analitik respons real-time.
- **Arsitektur:** Decoupled Client-Server (Frontend Next.js + Backend Go REST API + Database PostgreSQL + Docker Compose).
- **Tema Desain:** **Neobrutalism** (High-contrast, bold outlines, vivid retro palette, solid drop shadows, responsive, 100% `cursor-pointer` di seluruh elemen interaktif).

---

## 2. Struktur Direktori Proyek (Repository Structure)

```plaintext
e-form-purbalingga/
├── .dockerignore
├── docker-compose.yml
├── Makefile
├── README.md
├── GEMINI.md
├── ARCHITECTURE.md
├── DESIGN.md
├── APP_FLOW.md
│
├── backend/                        # Golang REST API Server
│   ├── cmd/
│   │   └── server/
│   │       └── main.go             # Entrypoint server Go
│   ├── internal/
│   │   ├── config/                 # Konfigurasi aplikasi & env
│   │   ├── database/               # Koneksi & migrasi PostgreSQL
│   │   ├── domain/                 # Entitas & interface domain
│   │   ├── handler/                # HTTP Handlers (Gin / Chi / Fiber)
│   │   ├── middleware/             # Auth JWT, CORS, Rate Limit, Logger
│   │   ├── repository/             # Implementasi database queries (sqlx/pgx)
│   │   ├── service/                # Business logic & form processor
│   │   ├── worker/                 # Background job (Sync API Sidami)
│   │   └── utils/                  # Helper: validation, file storage, hasher
│   ├── migrations/                 # File SQL migration
│   ├── storage/                    # Local volume storage uploads
│   │   └── uploads/
│   ├── go.mod
│   ├── go.sum
│   └── Dockerfile
│
├── frontend/                       # Next.js 14+ (App Router)
│   ├── public/                     # Static assets (logo Purbalingga, favicon, icons)
│   ├── src/
│   │   ├── app/                    # Next.js App Router
│   │   │   ├── (auth)/             # Login OPD / Admin portal
│   │   │   ├── (admin)/            # Dashboard, Form Builder, Submissions, OPD Settings
│   │   │   ├── f/[slug]/           # Halaman publik pengisian form
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx            # Portal utama E-Form Purbalingga
│   │   ├── components/
│   │   │   ├── ui/                 # Brutalist UI primitives (Button, Card, Input, Badge)
│   │   │   ├── builder/            # Drag & drop form builder canvas & field toolbox
│   │   │   ├── renderer/           # Dynamic form renderer untuk responden
│   │   │   ├── regional/           # Chaining selector Kecamatan & Desa Purbalingga
│   │   │   └── analytics/          # Chart & response table viewer
│   │   ├── hooks/                  # Custom hooks (useFormBuilder, useRegionalData)
│   │   ├── lib/                    # API client fetcher, validasi schema, formatters
│   │   ├── styles/                 # Tailwind config & brutalist custom styles
│   │   └── types/                  # TypeScript interface definisi form & response
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   └── Dockerfile
│
└── nginx/                          # Reverse Proxy (Opsional untuk production gateway)
    └── default.conf
```

---

## 3. Tech Stack & Dependensi Utama

| Lapisan | Teknologi | Deskripsi |
| :--- | :--- | :--- |
| **Frontend** | Next.js 14+ (App Router, TypeScript) | SSR/SSG, performa tinggi, SEO-friendly |
| **Styling** | Tailwind CSS v3 / v4 + Neobrutalism Preset | Border 2-3px hitam, solid shadow, palet cerah, micro-interaction |
| **Icons & Font** | Lucide React + Plus Jakarta Sans / Outfit | Tipografi modern & ikonografi tajam |
| **Backend** | Go (Golang 1.22+) | Konkurensi tinggi, latency rendah, type-safe |
| **HTTP Router** | Gin / Chi | Ringan, cepat, idiomatik Go |
| **Database** | PostgreSQL 16 | Relational tables + JSONB untuk dynamic form schema & responses |
| **File Storage** | Local Volume Binding (`/app/storage/uploads`) | Penyimpanan berkas KTP, foto, PDF di volume server yang aman |
| **Container** | Docker & Docker Compose | Multi-container setup (frontend, backend, postgres) |

---

## 4. Standar Coding & Konvensi Wajib

### A. Frontend (Next.js & React)
1. **Aturan Cursor Pointer:** Semua tombol (`<button>`), tautan (`<a>`), checkbox, radio, tab, dropdown trigger, dan elemen apa pun yang memiliki event `onClick` **WAJIB** memiliki class `cursor-pointer`.
2. **Neobrutalism System:** Seluruh elemen interaktif wajib konsisten dengan prinsip brutalism:
   - Border tebal: `border-2 border-black` atau `border-3 border-black`.
   - Hard shadow: `shadow-[4px_4px_0px_#000000]` dengan hover `hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000000]`.
   - Active state: `active:translate-x-[4px] active:translate-y-[4px] active:shadow-none`.
3. **Responsivitas:** Wajib 100% responsif pada layar Smartphone (360px+), Tablet (768px), hingga Desktop (1280px+).
4. **Pencegahan XSS:** Tidak boleh menggunakan `dangerouslySetInnerHTML` secara sembarangan. Gunakan sanitasi `DOMPurify` jika merender deskripsi form kaya teks.
5. **State Management:** Form Builder menggunakan state terpusat (Zustand atau React Context) untuk menangani reordering field, manipulasi validasi, dan live preview.

### B. Backend (Golang)
1. **Clean Architecture:** Pisahkan kode secara tegas menjadi:
   - `handler`: Menerima request HTTP, binding DTO, validasi input, mengirim respon JSON standar.
   - `service`: Logika bisnis (evaluasi validasi formulir dinamis, sinkronisasi data Sidami, otorisasi OPD).
   - `repository`: Akses query PostgreSQL menggunakan parameterized query (`$1, $2, ...`) untuk mencegah SQL Injection.
2. **Penanganan API Sidami Purbalingga:**
   - Kecamatan: `https://api.sidami.purbalinggakab.go.id/api/datakecamatan?size=-1`
   - Desa: `https://api.sidami.purbalinggakab.go.id/api/datadesa?kode_kec=equal:<kode_kec>&size=-1`
   - **Aturan Live API:** Backend Go bertindak sebagai reverse proxy langsung ke API Sidami (endpoint internal `/api/v1/wilayah/kecamatan` dan `/api/v1/wilayah/desa?kode_kec=xxx`). Data wilayah **tidak disimpan di database**, melainkan diambil secara dinamis dan live.
3. **Penyimpanan Berkas (Uploads):**
   - Wajib sanitasi nama berkas menggunakan `filepath.Base` untuk mencegah Path Traversal (`../../`).
   - Berkas disimpan dengan format nama acak unik: `<uuid>_<timestamp>.<ext>`.
   - Validasi MIME-type berdasarkan byte header (magic bytes), bukan hanya ekstensi string.
   - Ukuran upload dibatasi (misal: gambar/dokumen max 5MB - 10MB).

### C. Database (PostgreSQL)
1. Gunakan tipe data `JSONB` untuk:
   - Struktur field form dinamis (`schema` pada tabel `forms`).
   - Data isian respon dari pengguna (`answers` pada tabel `form_responses`).
2. Buat GIN index pada kolom JSONB untuk pencarian cepat data respons.
3. Gunakan migrasi database berbasis file (Golang-migrate atau goose).

---

## 5. Variabel Lingkungan (.env)

Contoh konfigurasi environment yang digunakan:

```env
# Backend Environment
APP_ENV=development
APP_PORT=8080
APP_SECRET=purbalingga-super-secret-key-change-in-production
DATABASE_URL=postgres://postgres:purbalinggapass@postgres:5432/eform_purbalingga?sslmode=disable
UPLOAD_DIR=/app/storage/uploads
MAX_UPLOAD_SIZE_MB=10
SIDAMI_API_BASE=https://api.sidami.purbalinggakab.go.id/api

# Frontend Environment
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_APP_NAME="E-Form Purbalingga"
NEXT_PUBLIC_STORAGE_URL=http://localhost:8080/uploads
```

---

## 6. Perintah Menjalankan Aplikasi (Docker)

```bash
# 1. Jalankan seluruh layanan (Frontend, Backend, PostgreSQL)
docker compose up -d --build

# 2. Cek status container
docker compose ps

# 3. Jalankan migrasi database (otomatis atau via perintah backend)
docker compose exec backend ./server migrate-up

# 4. Akses Aplikasi:
# Frontend : http://localhost:3000
# Backend  : http://localhost:8080/api/v1
# DB       : localhost:5432
```
