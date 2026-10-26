-- ==============================================================================
-- 04_seed_bansos_lansia_dinsos.sql - Formulir Bantuan Sosial Lansia Dinsos
-- ==============================================================================

ALTER TABLE form_responses
    ADD COLUMN IF NOT EXISTS registration_number VARCHAR(50);

CREATE UNIQUE INDEX IF NOT EXISTS idx_responses_registration_number
    ON form_responses(registration_number);

CREATE UNIQUE INDEX IF NOT EXISTS idx_responses_form_identifier
    ON form_responses(form_id, respondent_identifier)
    WHERE respondent_identifier IS NOT NULL;

INSERT INTO forms (
    id, opd_id, creator_id, slug, title, description, status, schema, settings, start_date, end_date
) VALUES (
    'f1a2b3c4-7777-4678-90ab-cdef12345678',
    'e8d7a12b-3333-4c78-90ab-cdef12345678',
    'c1f8a847-3333-4f8e-bf82-7235a90e3952',
    'bantuan-kesejahteraan-sosial-lansia',
    'Verifikasi Calon Penerima Program Asistensi Sosial Lanjut Usia',
    'Pemutakhiran basis data terpadu (DTKS) warga lansia terlantar dan disabilitas berat untuk penetapan bantuan jaminan kebutuhan hidup bulanan.',
    'PUBLISHED',
    '{
        "version": "1.0",
        "sections": [
            {
                "id": "sec_identitas",
                "title": "Identitas Pemohon",
                "description": "Lengkapi identitas sesuai dokumen kependudukan yang berlaku.",
                "fields": [
                    { "id": "f_nik", "type": "nik", "label": "Nomor Induk Kependudukan (NIK)", "placeholder": "3303xxxxxxxxxxxx", "required": true },
                    { "id": "f_nama", "type": "text", "label": "Nama Lengkap", "placeholder": "Sesuai KTP/KK", "required": true },
                    { "id": "f_no_hp", "type": "text", "label": "Nomor HP / WhatsApp", "placeholder": "08xxxxxxxxxx", "required": true },
                    { "id": "f_email", "type": "text", "label": "Email (opsional)", "placeholder": "nama@email.com", "required": false },
                    { "id": "f_tanggal_lahir", "type": "date", "label": "Tanggal Lahir", "required": true },
                    { "id": "f_jenis_kelamin", "type": "select", "label": "Jenis Kelamin", "required": true, "options": [{"value":"L","label":"Laki-laki"},{"value":"P","label":"Perempuan"}] },
                    { "id": "f_no_kk", "type": "text", "label": "Nomor Kartu Keluarga", "placeholder": "16 digit", "required": true },
                    { "id": "f_wilayah", "type": "regional_purbalingga", "label": "Wilayah Domisili", "required": true },
                    { "id": "f_alamat", "type": "textarea", "label": "Alamat Lengkap", "placeholder": "RT/RW, jalan, desa, kecamatan", "required": true }
                ]
            },
            {
                "id": "sec_kondisi",
                "title": "Kondisi Sosial Ekonomi",
                "description": "Data ini digunakan untuk verifikasi kelayakan penerima bantuan.",
                "fields": [
                    { "id": "f_status_lansia", "type": "radio", "label": "Kategori Pemohon", "required": true, "options": [{"value":"lansia_terlantar","label":"Lansia terlantar"},{"value":"lansia_tidak_terlantar","label":"Lansia tidak terlantar"},{"value":"disabilitas_berat","label":"Disabilitas berat"},{"value":"lansia_disabilitas","label":"Lansia dengan disabilitas"}] },
                    { "id": "f_jenis_disabilitas", "type": "select", "label": "Jenis Disabilitas", "required": false, "options": [{"value":"tidak_ada","label":"Tidak ada"},{"value":"fisik","label":"Fisik"},{"value":"sensorik","label":"Sensorik"},{"value":"mental","label":"Mental"},{"value":"intelektual","label":"Intelektual"},{"value":"ganda","label":"Ganda"}] },
                    { "id": "f_status_dtks", "type": "select", "label": "Status DTKS", "required": true, "options": [{"value":"sudah","label":"Sudah terdaftar DTKS"},{"value":"belum","label":"Belum terdaftar DTKS"},{"value":"tidak_tahu","label":"Tidak mengetahui"}] },
                    { "id": "f_tinggal_bersama", "type": "select", "label": "Tempat Tinggal Saat Ini", "required": true, "options": [{"value":"sendiri","label":"Tinggal sendiri"},{"value":"keluarga","label":"Bersama keluarga"},{"value":"panti","label":"Panti / panti sosial"},{"value":"lainnya","label":"Lainnya"}] },
                    { "id": "f_sumber_penghasilan", "type": "select", "label": "Sumber Penghasilan Utama", "required": true, "options": [{"value":"tidak_ada","label":"Tidak ada"},{"value":"keluarga","label":"Bantuan keluarga"},{"value":"pensiun","label":"Pensiun"},{"value":"usaha","label":"Usaha / bekerja"},{"value":"bantuan_sosial","label":"Bantuan sosial"},{"value":"lainnya","label":"Lainnya"}] },
                    { "id": "f_penghasilan_bulanan", "type": "select", "label": "Penghasilan per Bulan", "required": true, "options": [{"value":"0","label":"Tidak berpenghasilan"},{"value":"<500000","label":"Kurang dari Rp500.000"},{"value":"500000-1000000","label":"Rp500.000 - Rp1.000.000"},{"value":"1000000-2000000","label":"Rp1.000.000 - Rp2.000.000"},{"value":">2000000","label":"Lebih dari Rp2.000.000"}] },
                    { "id": "f_jumlah_tanggungan", "type": "number", "label": "Jumlah Tanggungan Keluarga", "required": false },
                    { "id": "f_kondisi_rumah", "type": "select", "label": "Kondisi Rumah", "required": true, "options": [{"value":"layak","label":"Layak"},{"value":"kurang_layak","label":"Kurang layak"},{"value":"tidak_layak","label":"Tidak layak"}] }
                ]
            },
            {
                "id": "sec_bantuan",
                "title": "Bantuan yang Diajukan",
                "fields": [
                    { "id": "f_jenis_bantuan", "type": "checkbox", "label": "Jenis Bantuan yang Dibutuhkan", "required": true, "options": [{"value":"pkh","label":"Program Keluarga Harapan (PKH)"},{"value":"bpnt","label":"Bantuan Pangan Non Tunai (BPNT)"},{"value":"asistensi_lansia","label":"Asistensi Sosial Lanjut Usia"},{"value":"alat_bantu_disabilitas","label":"Alat Bantu Disabilitas"},{"value":"sembako","label":"Bantuan Sembako"},{"value":"lainnya","label":"Lainnya"}] },
                    { "id": "f_keterangan", "type": "textarea", "label": "Keterangan Tambahan", "required": false }
                ]
            },
            {
                "id": "sec_dokumen",
                "title": "Dokumen Pendukung",
                "description": "Unggah berkas JPG, PNG, atau PDF dengan ukuran maksimal 5 MB per berkas.",
                "fields": [
                    { "id": "f_foto_ktp", "type": "file_upload", "label": "Foto KTP", "required": true },
                    { "id": "f_foto_kk", "type": "file_upload", "label": "Foto Kartu Keluarga", "required": true },
                    { "id": "f_foto_rumah", "type": "file_upload", "label": "Foto Kondisi Rumah (opsional)", "required": false },
                    { "id": "f_surat_keterangan", "type": "file_upload", "label": "Surat Keterangan Tidak Mampu (opsional)", "required": false }
                ]
            },
            {
                "id": "sec_pernyataan",
                "title": "Pernyataan Pemohon",
                "fields": [
                    { "id": "f_pernyataan", "type": "checkbox", "label": "Saya menyatakan bahwa data yang saya isikan benar dan dapat dipertanggungjawabkan.", "required": true, "options": [{"value":"setuju","label":"Saya menyetujui pernyataan ini"}] }
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
        "start_date": "2026-10-01T00:00:00+07:00",
        "end_date": "2026-11-20T23:59:59+07:00"
    }',
    '2026-10-01 00:00:00+07',
    '2026-11-20 23:59:59+07'
) ON CONFLICT (slug) DO NOTHING;
