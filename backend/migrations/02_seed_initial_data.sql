-- ==============================================================================
-- 02_seed_initial_data.sql - Data Master Awal & Cache Wilayah Sidami Purbalingga
-- ==============================================================================

-- 1. Master OPD Purbalingga
INSERT INTO opd (id, kode_opd, nama_opd, singkatan) VALUES
('e8d7a12b-1111-4c78-90ab-cdef12345678', 'DISKOMINFO', 'Dinas Komunikasi dan Informatika Kabupaten Purbalingga', 'Diskominfo'),
('e8d7a12b-2222-4c78-90ab-cdef12345678', 'DINKES', 'Dinas Kesehatan Kabupaten Purbalingga', 'Dinkes'),
('e8d7a12b-3333-4c78-90ab-cdef12345678', 'DINSOS', 'Dinas Sosial Kabupaten Purbalingga', 'Dinsos'),
('e8d7a12b-4444-4c78-90ab-cdef12345678', 'DKUKM', 'Dinas Koperasi dan UKM Purbalingga', 'Dkukm')
ON CONFLICT (kode_opd) DO NOTHING;

-- 2. Master Pengguna Default (Password Default: Purbalingga2026!)
-- Hash Bcrypt untuk 'Purbalingga2026!': $2a$10$7v1bS.vW4U..d4QxMqmHse6P7j3e5hZpYwR9U1T5V3eN6Q7Y8Z9a0
INSERT INTO users (id, opd_id, nama, email, password_hash, role) VALUES
('c1f8a847-1111-4f8e-bf82-7235a90e3952', 'e8d7a12b-1111-4c78-90ab-cdef12345678', 'Super Admin Diskominfo', 'superadmin@purbalinggakab.go.id', '$2a$10$7v1bS.vW4U..d4QxMqmHse6P7j3e5hZpYwR9U1T5V3eN6Q7Y8Z9a0', 'SUPER_ADMIN'),
('c1f8a847-2222-4f8e-bf82-7235a90e3952', 'e8d7a12b-2222-4c78-90ab-cdef12345678', 'Admin Dinas Kesehatan', 'admin.dinkes@purbalinggakab.go.id', '$2a$10$7v1bS.vW4U..d4QxMqmHse6P7j3e5hZpYwR9U1T5V3eN6Q7Y8Z9a0', 'ADMIN_OPD'),
('c1f8a847-3333-4f8e-bf82-7235a90e3952', 'e8d7a12b-3333-4c78-90ab-cdef12345678', 'Admin Dinas Sosial', 'admin.dinsos@purbalinggakab.go.id', '$2a$10$7v1bS.vW4U..d4QxMqmHse6P7j3e5hZpYwR9U1T5V3eN6Q7Y8Z9a0', 'ADMIN_OPD'),
('c1f8a847-4444-4f8e-bf82-7235a90e3952', 'e8d7a12b-4444-4c78-90ab-cdef12345678', 'Admin Dinas Koperasi dan UKM', 'admin.dkukm@purbalinggakab.go.id', '$2a$10$7v1bS.vW4U..d4QxMqmHse6P7j3e5hZpYwR9U1T5V3eN6Q7Y8Z9a0', 'ADMIN_OPD')
ON CONFLICT (email) DO NOTHING;

-- 3. Formulir Pendaftaran Pendataan Pelaku Usaha Mikro (UMKM) & Bantuan Modal 2026
--    Dinas Koperasi dan UKM Kabupaten Purbalingga — Kategori: Usaha & UMKM — Wajib NIK
INSERT INTO forms (
    id, opd_id, creator_id, slug, title, description, status, schema, settings
) VALUES (
    'f1a2b3c4-5555-4678-90ab-cdef12345678',
    'e8d7a12b-4444-4c78-90ab-cdef12345678',
    'c1f8a847-4444-4f8e-bf82-7235a90e3952',
    'bansos-umkm-purbalingga-2026',
    'Pendataan Pelaku Usaha Mikro (UMKM) & Bantuan Modal 2026',
    'Formulir pendataan pelaku usaha mikro aktif se-Kabupaten Purbalingga dalam rangka verifikasi calon penerima fasilitasi legalitas NIB gratis dan hibah permodalan daerah. Wajib menggunakan NIK KTP Purbalingga.',
    'PUBLISHED',
    '{
        "version": "1.0",
        "sections": [
            {
                "id": "sec_identitas",
                "title": "Data Diri Pemohon",
                "description": "Lengkapi identitas diri sesuai data kependudukan Kabupaten Purbalingga. NIK wajib diisi sesuai KTP.",
                "fields": [
                    {
                        "id": "f_nik",
                        "type": "nik",
                        "label": "Nomor Induk Kependudukan (NIK)",
                        "placeholder": "3303xxxxxxxxxxxx",
                        "helpText": "Wajib 16 digit angka KTP Purbalingga (diawali 3303)",
                        "required": true,
                        "validation": {
                            "pattern": "^3303[0-9]{12}$",
                            "minLength": 16,
                            "maxLength": 16
                        }
                    },
                    {
                        "id": "f_nama",
                        "type": "text",
                        "label": "Nama Lengkap Pemohon",
                        "placeholder": "Masukkan nama sesuai KTP",
                        "required": true
                    },
                    {
                        "id": "f_no_hp",
                        "type": "text",
                        "label": "Nomor Telepon / WhatsApp",
                        "placeholder": "08xxxxxxxxxx",
                        "required": true
                    },
                    {
                        "id": "f_email",
                        "type": "text",
                        "label": "Alamat Email",
                        "placeholder": "contoh@email.com",
                        "required": false
                    },
                    {
                        "id": "f_wilayah",
                        "type": "regional_purbalingga",
                        "label": "Wilayah Domisili Purbalingga (Kecamatan & Desa)",
                        "helpText": "Pilih kecamatan dan desa sesuai tempat tinggal",
                        "required": true,
                        "config": {
                            "kecamatanFieldId": "f_kecamatan",
                            "desaFieldId": "f_desa",
                            "showKodePos": false
                        }
                    },
                    {
                        "id": "f_alamat",
                        "type": "textarea",
                        "label": "Alamat Lengkap Tempat Tinggal",
                        "placeholder": "Jl. / Dusun / RT / RW / Desa",
                        "required": true
                    },
                    {
                        "id": "f_foto_ktp",
                        "type": "file_upload",
                        "label": "Upload Foto KTP Pemohon",
                        "helpText": "Format JPG, PNG, atau PDF. Maksimal 5 MB.",
                        "required": true,
                        "validation": {
                            "allowedExtensions": ["jpg", "jpeg", "png", "pdf"],
                            "maxSizeInMB": 5
                        }
                    }
                ]
            },
            {
                "id": "sec_usaha",
                "title": "Data Usaha Mikro",
                "description": "Lengkapi data usaha mikro yang dijalankan pemohon.",
                "fields": [
                    {
                        "id": "f_nama_usaha",
                        "type": "text",
                        "label": "Nama Usaha / Toko",
                        "placeholder": "Contoh: Warung Kopi Berkah Padamara",
                        "required": true
                    },
                    {
                        "id": "f_jenis_usaha",
                        "type": "text",
                        "label": "Bidang / Jenis Usaha",
                        "placeholder": "Contoh: Kuliner, Fashion, Kerajinan, Pertanian",
                        "required": true
                    },
                    {
                        "id": "f_alamat_usaha",
                        "type": "textarea",
                        "label": "Alamat Lokasi Usaha",
                        "placeholder": "Alamat lengkap tempat usaha beroperasi",
                        "required": true
                    },
                    {
                        "id": "f_lama_usaha",
                        "type": "number",
                        "label": "Lama Usaha (Tahun)",
                        "placeholder": "0",
                        "required": true,
                        "validation": {
                            "min": 0,
                            "max": 100
                        }
                    },
                    {
                        "id": "f_jumlah_tenaga",
                        "type": "number",
                        "label": "Jumlah Tenaga Kerja",
                        "placeholder": "0",
                        "required": true
                    },
                    {
                        "id": "f_omzet",
                        "type": "currency_idr",
                        "label": "Rata-rata Omzet per Bulan (Rp)",
                        "placeholder": "0",
                        "required": true
                    },
                    {
                        "id": "f_modal",
                        "type": "currency_idr",
                        "label": "Modal Usaha Saat Ini (Rp)",
                        "placeholder": "0",
                        "required": true
                    },
                    {
                        "id": "f_nib",
                        "type": "text",
                        "label": "Nomor Induk Berusaha (NIB) jika ada",
                        "placeholder": "Nomor NIB",
                        "required": false
                    },
                    {
                        "id": "f_foto_usaha",
                        "type": "file_upload",
                        "label": "Upload Foto Tempat Usaha",
                        "helpText": "Format JPG, PNG, atau PDF. Maksimal 5 MB.",
                        "required": true,
                        "validation": {
                            "allowedExtensions": ["jpg", "jpeg", "png", "pdf"],
                            "maxSizeInMB": 5
                        }
                    }
                ]
            },
            {
                "id": "sec_bantuan",
                "title": "Rencana Bantuan Modal",
                "description": "Informasi dukungan program yang dibutuhkan usaha mikro.",
                "fields": [
                    {
                        "id": "f_jenis_bantuan",
                        "type": "textarea",
                        "label": "Jenis Bantuan / Fasilitasi yang Diharapkan",
                        "placeholder": "Contoh: Modal usaha, pelatihan manajemen, fasilitas NIB, peralatan produksi",
                        "required": true
                    },
                    {
                        "id": "f_keterangan",
                        "type": "textarea",
                        "label": "Keterangan Tambahan",
                        "placeholder": "Informasi tambahan yang perlu diketahui dinas",
                        "required": false
                    },
                    {
                        "id": "f_pernyataan",
                        "type": "checkbox",
                        "label": "Pernyataan",
                        "helpText": "Saya menyatakan bahwa data yang saya isi adalah benar dan dapat dipertanggungjawabkan.",
                        "required": true,
                        "options": [
                            {
                                "value": "setuju",
                                "label": "Saya menyetujui dan menyatakan kebenaran data di atas"
                            }
                        ]
                    }
                ]
            }
        ]
    }',
    '{
        "is_public": true,
        "require_nik": true,
        "one_response_per_nik": true,
        "max_submissions": 1000,
        "allow_edit_response": false,
        "send_email_receipt": false,
        "start_date": "2026-10-01T00:00:00Z",
        "end_date": "2026-10-30T23:59:59Z"
    }'
) ON CONFLICT (slug) DO NOTHING;
