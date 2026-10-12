# Spesifikasi Kontrak API (API Specification): E-Form Purbalingga

Dokumen ini mendefinisikan kontrak REST API v1 antara Frontend Next.js dan Backend Go untuk sistem **E-Form Kabupaten Purbalingga**.

- **Base URL:** `http://localhost:8080/api/v1` (Lokal) / `https://eform.purbalinggakab.go.id/api/v1` (Produksi)
- **Format Pertukaran:** `application/json` (Kecuali multipart untuk upload berkas)
- **Autentikasi:** Bearer Token JWT pada header `Authorization: Bearer <token>` (Untuk endpoint terproteksi OPD/Admin)

---

## 1. Format Respon Standar (Standard Response Envelopes)

### Respon Sukses (HTTP 200 / 201)
```json
{
  "success": true,
  "message": "Operasi berhasil",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 145,
    "total_pages": 8
  }
}
```

### Respon Error (HTTP 400 / 401 / 403 / 404 / 422 / 500)
```json
{
  "success": false,
  "message": "Validasi gagal",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "nik",
        "issue": "NIK harus 16 digit dan diawali dengan kode Purbalingga 3303"
      }
    ]
  }
}
```

---

## 2. Autentikasi & Akun OPD (Auth Endpoints)

### 2.1. Login Admin OPD / Super Admin
- **Endpoint:** `POST /api/v1/auth/login`
- **Akses:** Publik
- **Request Body:**
```json
{
  "email": "admin.dinkes@purbalinggakab.go.id",
  "password": "PasswordSuperKuat123!"
}
```
- **Response 200 OK:**
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 86400,
    "user": {
      "id": "c1f8a847-a87f-4f8e-bf82-7235a90e3952",
      "nama": "Administrator Dinkes Purbalingga",
      "email": "admin.dinkes@purbalinggakab.go.id",
      "role": "ADMIN_OPD",
      "opd": {
        "id": "e8d7a12b-3456-4c78-90ab-cdef12345678",
        "kode_opd": "DINKES",
        "nama_opd": "Dinas Kesehatan Kabupaten Purbalingga",
        "singkatan": "Dinkes"
      }
    }
  }
}
```

### 2.2. Get User Profile (Me)
- **Endpoint:** `GET /api/v1/auth/me`
- **Headers:** `Authorization: Bearer <token>`
- **Response 200 OK:** Mengembalikan objek user yang sedang login beserta data OPD terkait.

---

## 3. Wilayah Kabupaten Purbalingga (Chaining Data Endpoints)

Endpoint ini diteruskan (live proxy) oleh Backend Go langsung dari API Sidami Purbalingga (tanpa disimpan di database) untuk menghindari masalah CORS dan menyeragamkan respon format.

### 3.1. Daftar Seluruh Kecamatan Purbalingga
- **Endpoint:** `GET /api/v1/wilayah/kecamatan`
- **Akses:** Publik (Bebas diakses oleh formulir publik)
- **Response 200 OK:**
```json
{
  "success": true,
  "message": "Daftar kecamatan berhasil dimuat",
  "data": [
    {
      "kode_kec": 330309,
      "nama_kecamatan": "BOBOTSARI",
      "kode_kab": "3303"
    },
    {
      "kode_kec": 330310,
      "nama_kecamatan": "KARANGREJA",
      "kode_kab": "3303"
    },
    {
      "kode_kec": 330315,
      "nama_kecamatan": "PADAMARA",
      "kode_kab": "3303"
    },
    {
      "kode_kec": 330305,
      "nama_kecamatan": "PURBALINGGA",
      "kode_kab": "3303"
    }
  ]
}
```

### 3.2. Daftar Desa / Kelurahan Berdasarkan Kecamatan
- **Endpoint:** `GET /api/v1/wilayah/desa`
- **Akses:** Publik
- **Query Parameter:** `kode_kec` (Wajib, integer misal `330315`)
- **Contoh Request:** `GET /api/v1/wilayah/desa?kode_kec=330315`
- **Response 200 OK:**
```json
{
  "success": true,
  "message": "Daftar desa berhasil dimuat",
  "data": [
    {
      "kode_desa": 3303152001,
      "kode_kec": 330315,
      "nama_desa": "KARANGPULE"
    },
    {
      "kode_desa": 3303152002,
      "kode_kec": 330315,
      "nama_desa": "SOKAWERA"
    },
    {
      "kode_desa": 3303151004,
      "kode_kec": 330315,
      "nama_desa": "KARANGSENTUL"
    }
  ]
}
```

---

## 4. Manajemen Formulir (Form Builder Endpoints)

### 4.1. Daftar Formulir Milik OPD
- **Endpoint:** `GET /api/v1/forms`
- **Headers:** `Authorization: Bearer <token>`
- **Query:** `page=1&limit=10&status=PUBLISHED&search=bansos`
- **Response 200 OK:** Mengembalikan daftar ringkasan form milik OPD pengguna beserta jumlah respon yang terkumpul.

### 4.2. Buat Formulir Baru
- **Endpoint:** `POST /api/v1/forms`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "title": "Pendaftaran Bansos Produktif Padamara 2026",
  "slug": "bansos-padamara-2026",
  "description": "Formulir pendataan penerima bansos UMKM Kecamatan Padamara.",
  "banner_url": "/uploads/banners/bansos-banner.jpg",
  "status": "DRAFT",
  "settings": {
    "is_public": true,
    "require_nik": true,
    "one_response_per_nik": true,
    "max_submissions": 500,
    "start_date": "2026-10-15T00:00:00Z",
    "end_date": "2026-10-30T23:59:59Z"
  },
  "schema": {
    "sections": [
      {
        "id": "sec_1",
        "title": "Identitas Pemohon",
        "fields": [
          {
            "id": "f_nik",
            "type": "nik",
            "label": "NIK Pemohon",
            "required": true
          },
          {
            "id": "f_nama",
            "type": "text",
            "label": "Nama Lengkap",
            "required": true
          },
          {
            "id": "f_wilayah",
            "type": "regional_purbalingga",
            "label": "Wilayah Domisili Purbalingga",
            "required": true
          }
        ]
      }
    ]
  }
}
```
- **Response 201 Created:** Mengembalikan metadata form yang berhasil dibuat.

### 4.3. Ambil Detail Formulir untuk Pengisian Publik
- **Endpoint:** `GET /api/v1/public/forms/:slug`
- **Akses:** Publik
- **Response 200 OK:** Mengembalikan skema form siap render, nama OPD penerbit, dan status ketersediaan form (apakah masih buka atau sudah ditutup).

---

## 5. Pengisian Form & Unggah Berkas (Submission Endpoints)

### 5.1. Unggah Berkas Pendukung (KTP/Dokumen)
- **Endpoint:** `POST /api/v1/public/upload`
- **Akses:** Publik / Token sesi form
- **Content-Type:** `multipart/form-data`
- **Form Data Field:** `file` (Berkas binary, Max 5MB - JPG/PNG/PDF)
- **Response 200 OK:**
```json
{
  "success": true,
  "message": "Berkas berhasil diunggah",
  "data": {
    "file_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "original_name": "ktp_budi.jpg",
    "file_url": "/uploads/submissions/9b1deb4d_1728723600.jpg",
    "file_size": 1450230,
    "mime_type": "image/jpeg"
  }
}
```

### 5.2. Kirim Isian Formulir (Submit Response)
- **Endpoint:** `POST /api/v1/public/forms/:slug/submit`
- **Akses:** Publik
- **Headers:** `Idempotency-Key: <uuid>` (Mencegah submit ganda)
- **Request Body:**
```json
{
  "respondent_nik": "3303151201900001",
  "answers": {
    "f_nik": "3303151201900001",
    "f_nama": "Budi Santoso",
    "f_wilayah": {
      "kode_kec": 330315,
      "nama_kecamatan": "PADAMARA",
      "kode_desa": 3303152001,
      "nama_desa": "KARANGPULE"
    },
    "f_berkas": {
      "file_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "file_url": "/uploads/submissions/9b1deb4d_1728723600.jpg"
    }
  }
}
```
- **Response 201 Created:**
```json
{
  "success": true,
  "message": "Formulir berhasil terkirim",
  "data": {
    "submission_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "registration_number": "PBG-2026-10-8921B",
    "submitted_at": "2026-10-12T09:40:00Z"
  }
}
```

---

## 6. Analitik & Ekspor Data Respons (Admin OPD)

### 6.1. Ambil Seluruh Respons Formulir
- **Endpoint:** `GET /api/v1/forms/:id/responses`
- **Headers:** `Authorization: Bearer <token>`
- **Query:** `page=1&limit=20&search=budi&kode_kec=330315`
- **Response 200 OK:** Mengembalikan daftar baris data responden dalam format tabular JSON.

### 6.2. Ekspor Data ke Excel (.xlsx)
- **Endpoint:** `GET /api/v1/forms/:id/export?format=xlsx`
- **Headers:** `Authorization: Bearer <token>`
- **Response:** File Stream `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` dengan header `Content-Disposition: attachment; filename="respons_pbg_bansos-padamara-2026.xlsx"`.
