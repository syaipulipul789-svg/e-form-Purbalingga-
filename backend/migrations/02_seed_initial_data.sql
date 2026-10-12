-- ==============================================================================
-- 02_seed_initial_data.sql - Data Master Awal & Cache Wilayah Sidami Purbalingga
-- ==============================================================================

-- 1. Master OPD Purbalingga
INSERT INTO opd (id, kode_opd, nama_opd, singkatan) VALUES
('e8d7a12b-1111-4c78-90ab-cdef12345678', 'DISKOMINFO', 'Dinas Komunikasi dan Informatika Kabupaten Purbalingga', 'Diskominfo'),
('e8d7a12b-2222-4c78-90ab-cdef12345678', 'DINKES', 'Dinas Kesehatan Kabupaten Purbalingga', 'Dinkes'),
('e8d7a12b-3333-4c78-90ab-cdef12345678', 'DINSOS', 'Dinas Sosial Kabupaten Purbalingga', 'Dinsos')
ON CONFLICT (kode_opd) DO NOTHING;

-- 2. Master Pengguna Default (Password Default: Purbalingga2026!)
-- Hash Bcrypt untuk 'Purbalingga2026!': $2a$10$7v1bS.vW4U..d4QxMqmHse6P7j3e5hZpYwR9U1T5V3eN6Q7Y8Z9a0
INSERT INTO users (id, opd_id, nama, email, password_hash, role) VALUES
('c1f8a847-1111-4f8e-bf82-7235a90e3952', 'e8d7a12b-1111-4c78-90ab-cdef12345678', 'Super Admin Diskominfo', 'superadmin@purbalinggakab.go.id', '$2a$10$7v1bS.vW4U..d4QxMqmHse6P7j3e5hZpYwR9U1T5V3eN6Q7Y8Z9a0', 'SUPER_ADMIN'),
('c1f8a847-2222-4f8e-bf82-7235a90e3952', 'e8d7a12b-2222-4c78-90ab-cdef12345678', 'Admin Dinas Kesehatan', 'admin.dinkes@purbalinggakab.go.id', '$2a$10$7v1bS.vW4U..d4QxMqmHse6P7j3e5hZpYwR9U1T5V3eN6Q7Y8Z9a0', 'ADMIN_OPD'),
('c1f8a847-3333-4f8e-bf82-7235a90e3952', 'e8d7a12b-3333-4c78-90ab-cdef12345678', 'Admin Dinas Sosial', 'admin.dinsos@purbalinggakab.go.id', '$2a$10$7v1bS.vW4U..d4QxMqmHse6P7j3e5hZpYwR9U1T5V3eN6Q7Y8Z9a0', 'ADMIN_OPD')
ON CONFLICT (email) DO NOTHING;

-- 3. Contoh Formulir Aktif (Pendaftaran Bantuan Usaha Mikro Purbalingga)
INSERT INTO forms (
    id, opd_id, creator_id, slug, title, description, status, schema, settings
) VALUES (
    'f1a2b3c4-5555-4678-90ab-cdef12345678',
    'e8d7a12b-3333-4c78-90ab-cdef12345678',
    'c1f8a847-3333-4f8e-bf82-7235a90e3952',
    'bansos-umkm-purbalingga-2026',
    'Pendataan Pelaku Usaha Mikro Kabupaten Purbalingga 2026',
    'Formulir inventarisasi usaha mikro dalam rangka pembinaan dan penyaluran program bantuan dinas.',
    'PUBLISHED',
    '{
        "sections": [
            {
                "id": "sec_identitas",
                "title": "Data Diri Pemohon",
                "description": "Lengkapi identitas diri sesuai data kependudukan Kabupaten Purbalingga.",
                "fields": [
                    {
                        "id": "f_nik",
                        "type": "nik",
                        "label": "Nomor Induk Kependudukan (NIK)",
                        "placeholder": "3303xxxxxxxxxxxx",
                        "required": true
                    },
                    {
                        "id": "f_nama",
                        "type": "text",
                        "label": "Nama Lengkap Pemohon",
                        "placeholder": "Masukkan nama sesuai KTP",
                        "required": true
                    },
                    {
                        "id": "f_wilayah",
                        "type": "regional_purbalingga",
                        "label": "Wilayah Domisili Purbalingga",
                        "required": true
                    },
                    {
                        "id": "f_nama_usaha",
                        "type": "text",
                        "label": "Nama Usaha / Toko",
                        "placeholder": "Contoh: Warung Berkah Kopi Padamara",
                        "required": true
                    },
                    {
                        "id": "f_foto_ktp",
                        "type": "file_upload",
                        "label": "Foto KTP Pemohon",
                        "required": true
                    }
                ]
            }
        ]
    }',
    '{
        "is_public": true,
        "require_nik": true,
        "one_response_per_nik": true,
        "max_submissions": 1000
    }'
) ON CONFLICT (slug) DO NOTHING;
