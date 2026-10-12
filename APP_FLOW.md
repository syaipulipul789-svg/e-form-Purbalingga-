# Alur Aplikasi & Pengalaman Pengguna (App Flow & User Journey)

Dokumen ini memetakan seluruh alur kerja (workflow), diagram urutan interaksi pengguna (sequence flow), dan penanganan kasus khusus (*edge cases*) pada sistem **E-Form Kabupaten Purbalingga**.

---

## 1. Persona Pengguna & Matriks Hak Akses

| Persona | Peran & Lingkup | Hak Akses Utama |
| :--- | :--- | :--- |
| **Super Admin**<br>*(Diskominfo Purbalingga)* | Pengelola master sistem seluruh kabupaten | - Manajemen akun OPD & Admin OPD<br>- Monitoring lalu lintas & statistik server<br>- Manajemen sinkronisasi API Wilayah Sidami<br>- Audit trail seluruh aktivitas form |
| **Admin OPD**<br>*(Dinas / Badan / Kecamatan)* | Pembuat dan pengelola form per dinas | - Membuat, mengedit, menduplikasi, dan mempublikasikan form<br>- Mengonfigurasi komponen dinamis & aturan validasi<br>- Mengatur jadwal buka/tutup form & kuota respon<br>- Mengunduh data respon (Excel/CSV) & verifikasi berkas |
| **Verifikator OPD**<br>*(Staf Pelayanan Dinas)* | Pemeriksa berkas masuk | - Membaca data respon formulir dinasnya<br>- Mengubah status verifikasi (*Diterima / Ditolak / Revisi*)<br>- Menambahkan catatan internal verifikasi |
| **Responden Publik**<br>*(Warga Purbalingga / ASN)* | Pengisi formulir | - Mengakses form via link publik atau scan QR Code<br>- Mengisi pertanyaan dinamis & memilih Kecamatan/Desa<br>- Mengunggah foto KTP / berkas persyaratan<br>- Menerima tanda terima digital / bukti submit |

---

## 2. Diagram Alur Makro Sistem (End-to-End System Journey)

```mermaid
flowchart TD
    Start([Mulai]) --> RoleCheck{Siapa Pengguna?}

    %% Jalur Admin OPD
    RoleCheck -->|Admin OPD / Diskominfo| LoginAdmin[Login Portal Admin OPD]
    LoginAdmin --> DashboardAdmin[Dashboard Ringkasan Form & Statistik]
    DashboardAdmin --> CreateFormChoice{Aksi Admin?}
    CreateFormChoice -->|Buat Form Baru| FormBuilderCanvas[Rakit Form di Form Builder]
    FormBuilderCanvas --> SetupWilayah[Tambahkan Field Spesial: Wilayah Purbalingga]
    SetupWilayah --> PublishForm[Atur Batas Waktu/Kuota & Publish]
    PublishForm --> ShareLink[Dapatkan Link Publik & QR Code]

    CreateFormChoice -->|Kelola Respons| ViewResponses[Buka Tabel Respons & Analitik Grafik]
    ViewResponses --> ExportData[Ekspor ke Excel / CSV / Cetak PDF]

    %% Jalur Responden
    RoleCheck -->|Responden / Warga| OpenFormLink[Buka Link Form / Scan QR]
    ShareLink -.-> OpenFormLink
    OpenFormLink --> CheckStatus{Form Terbuka?}
    CheckStatus -->|Tutup / Kuota Penuh| ShowClosedPage[Tampilkan Halaman Penutupan Form]
    CheckStatus -->|Aktif| FillFormSteps[Isi Formulir Langkah demi Langkah]

    FillFormSteps --> SelectKecamatan[Pilih Kecamatan Purbalingga]
    SelectKecamatan --> AutoLoadDesa[Backend Memuat Daftar Desa Sesuai Kecamatan]
    AutoLoadDesa --> SelectDesa[Pilih Desa / Kelurahan]
    SelectDesa --> UploadDocs[Unggah Berkas KTP / Dokumen]
    UploadDocs --> ReviewSubmit[Periksa Isian & Klik Kirim Formulir]
    ReviewSubmit --> SubmitSuccess[Tanda Terima Berhasil & Unduh Bukti Token]
    SubmitSuccess --> End([Selesai])
```

---

## 3. Alur Detail: Form Builder (Admin OPD)

Admin OPD dapat merakit form secara visual ala Google Forms namun dengan fleksibilitas yang lebih kaya:

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin OPD
    participant UI as Form Builder (Next.js)
    participant API as Backend (Go API)
    participant DB as PostgreSQL

    Admin->>UI: Klik "Buat Formulir Baru"
    UI->>Admin: Tampilkan Kanvas Kosong & Panel Toolbox Komponen
    Admin->>UI: Isi Judul, Deskripsi, Banner OPD, dan Slug Kustom
    Admin->>UI: Drag & Drop Komponen Input (Teks, Pilihan Ganda, NIK, File)
    Admin->>UI: Tambahkan Komponen "Wilayah Purbalingga"
    Note over Admin,UI: Otomatis terpasang chaining Kecamatan & Desa
    Admin->>UI: Tentukan Validasi (Wajib Diisi, Max 5MB, Format NIK 3303)
    Admin->>UI: Konfigurasi Pengaturan (Batas 1 Respon per NIK, Tanggal Berakhir)
    Admin->>UI: Klik "Simpan & Publikasikan"
    UI->>API: POST /api/v1/forms (Payload JSON Schema)
    API->>API: Validasi Struktur Schema & Slug Unik
    API->>DB: INSERT INTO forms (schema, settings, status='PUBLISHED')
    DB-->>API: 201 Created
    API-->>UI: Sukses, kembalikan URL slug & QR Code
    UI-->>Admin: Tampilkan Modal Share Link Form
```

---

## 4. Alur Detail: Pengisian Formulir & Wilayah Chaining (Responden)

Alur interaksi responden saat mengisi form publik:

```mermaid
sequenceDiagram
    autonumber
    actor Warga as Responden (Warga)
    participant Web as Form Viewer (Next.js)
    participant API as Backend (Go API Proxy)
    participant Sidami as API Sidami Purbalingga
    participant Storage as Local Volume Storage

    Warga->>Web: Akses https://eform.purbalinggakab.go.id/f/bansos-padamara
    Web->>API: GET /api/v1/public/forms/bansos-padamara
    API-->>Web: Return JSON Schema Form & Info OPD
    Web-->>Warga: Render Tampilan Form (Neobrutalism UI)

    Warga->>Web: Memasukkan Nama & NIK (Diawali 3303...)
    Web->>Web: Validasi RegEx NIK langsung di browser

    Note over Warga,Sidami: Interaksi Komponen Wilayah Purbalingga (Live API)
    Web->>API: GET /api/v1/wilayah/kecamatan
    API->>Sidami: GET /api/datakecamatan?size=-1
    Sidami-->>API: 18 Data Kecamatan
    API-->>Web: JSON Array [{kode_kec: 330315, nama: "PADAMARA"}, ...]
    Web-->>Warga: Opsi Kecamatan Aktif di Dropdown

    Warga->>Web: Memilih Kecamatan "PADAMARA" (330315)
    Web->>API: GET /api/v1/wilayah/desa?kode_kec=330315
    API->>Sidami: GET /api/datadesa?kode_kec=equal:330315&size=-1
    Sidami-->>API: 14 Data Desa di Padamara
    API-->>Web: JSON Array [{kode_desa: 3303152001, nama: "KARANGPULE"}, ...]
    Web-->>Warga: Dropdown Desa Otomatis Terbuka & Terisi Pilihan

    Warga->>Web: Unggah Foto KTP (ktp_budi.jpg)
    Web->>API: POST /api/v1/public/upload (Multipart)
    API->>API: Validasi Magic Bytes & Batas 5MB
    API->>Storage: Simpan berkas UUID_timestamp.jpg di /app/storage/uploads
    Storage-->>API: File Path
    API-->>Web: Return {file_id, file_url}

    Warga->>Web: Klik "Kirim Formulir"
    Web->>API: POST /api/v1/public/forms/{id}/responses (Answers Payload)
    API->>API: Validasi Ulang Schema & Cek Batasan 1 Respon per NIK
    API->>API: Simpan ke tabel form_responses (JSONB)
    API-->>Web: Return 201 Created + Registration Code (Contoh: PBG-2026-9812A)
    Web-->>Warga: Halaman Sukses dengan Kartu Tanda Terima Neobrutalis
```

---

## 5. Alur Detail: Analitik & Ekspor Data (Admin OPD)

Admin dinas dapat memantau perolehan data secara langsung:

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin OPD
    participant Web as Dashboard (Next.js)
    participant API as Backend (Go API)
    participant DB as PostgreSQL

    Admin->>Web: Buka Tab "Respons Formulir"
    Web->>API: GET /api/v1/forms/{id}/responses?page=1&limit=20
    API->>DB: SELECT * FROM form_responses WHERE form_id = ...
    DB-->>API: List Respon JSON
    API-->>Web: Kembalikan Data & Summary Statistik
    Web-->>Admin: Tampilkan Grafik Distribusi & Tabel Data Isian

    Admin->>Web: Filter berdasarkan Kecamatan "PADAMARA" & Status "Pending"
    Web->>API: GET /api/v1/forms/{id}/responses?kecamatan=330315&status=Pending
    API-->>Web: Data Terfilter
    Web-->>Admin: Tabel Menampilkan Data Warga Khusus Padamara

    Admin->>Web: Klik "Ekspor ke Excel (.xlsx)"
    Web->>API: GET /api/v1/forms/{id}/export?format=xlsx
    API->>API: Generator Excel Go (excelize) membentuk Sheet & Header Field
    API-->>Web: Streaming Download File "respons_form_{slug}_{timestamp}.xlsx"
    Web-->>Admin: File Tersimpan di Komputer Admin
```

---

## 6. Skenario Khusus & Ketahanan Sistem (Edge Cases & Resilience)

### 6.1. Penanganan Akses API Sidami Purbalingga
- **Mekanisme:** Permintaan wilayah dari frontend diteruskan secara transparan melalui backend Go (`/api/v1/wilayah/*`) langsung ke API Sidami Purbalingga. Data wilayah tidak perlu disimpan ke database PostgreSQL, sehingga skema database tetap ringkas dan data wilayah selalu 100% mutakhir mengikuti server Sidami.
- **Error Handling:** Jika panggilan ke API Sidami gagal atau timeout, backend mengembalikan status HTTP 502/504 terstruktur dengan pesan ramah agar pengguna dapat mencoba kembali.

### 6.2. Warga Mengisi Form Panjang dengan Koneksi Tidak Stabil
- **Tantangan:** Koneksi smartphone warga putus saat mengisi survei panjang, menyebabkan data hilang saat halaman direfresh.
- **Solusi Frontend:** Formulir dilengkapi fitur **Autosave Local Draft** di browser (`localStorage`). Jika halaman tertutup atau tidak sengaja ter-refresh, sistem memunculkan banner pemberitahuan Neobrutalis: *"Ditemukan isian tersimpan sebelumnya. Pulihkan data?"*

### 6.3. Pencegahan Spam & Double Submit
- **Tantangan:** Pengguna menekan tombol "Kirim" berkali-kali secara cepat (*spam clicking*).
- **Solusi:**
  - Tombol submit otomatis memasuki status `disabled` dengan indikator spinner dan teks "Memproses...".
  - Frontend melampirkan *Idempotency-Key* (UUID per sesi form) di header permintaan. Backend menolak request kedua jika key yang sama sudah diproses dalam 60 detik terakhir.

### 6.4. Perlindungan Data Pribadi (UU PDP) untuk NIK & Berkas KTP
- Kolom NIK di database disimpan dengan hash terindeks untuk pencarian, sementara nilai aslinya dienkripsi simetris (AES-256-GCM) jika form menyaratkan kerahasiaan tinggi.
- URL unduhan berkas KTP tidak dapat diakses langsung oleh publik. Hanya admin yang memiliki token sesi aktif pada dinas terkait yang memiliki otoritas untuk melihat atau mengunduh dokumen.
