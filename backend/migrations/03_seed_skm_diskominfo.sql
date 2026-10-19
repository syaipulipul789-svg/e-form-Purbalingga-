-- ==============================================================================
-- 03_seed_skm_diskominfo.sql - Formulir Survei Kepuasan Masyarakat (SKM)
-- Dinas Komunikasi dan Informatika Kabupaten Purbalingga
-- ==============================================================================

INSERT INTO forms (
    id, opd_id, creator_id, slug, title, description, status, schema, settings
) VALUES (
    'f1a2b3c4-6666-4678-90ab-cdef12345678',
    'e8d7a12b-1111-4c78-90ab-cdef12345678',
    'c1f8a847-1111-4f8e-bf82-7235a90e3952',
    'survei-kepuasan-masyarakat-diskominfo',
    'Survei Kepuasan Masyarakat (SKM) Layanan Diskominfo',
    'Evaluasi transparansi informasi publik, kecepatan respon kanal aduan, dan kualitas konektivitas internet desa se-Kabupaten Purbalingga.',
    'PUBLISHED',
    '{
        "version": "1.0",
        "sections": [
            {
                "id": "sec_identitas",
                "title": "Identitas Responden (Opsional)",
                "fields": [
                    { "id": "r_nama", "type": "text", "label": "Nama Lengkap", "required": false },
                    { "id": "r_jenis_kelamin", "type": "select", "label": "Jenis Kelamin", "required": false, "options": [{"value":"L","label":"Laki-laki"},{"value":"P","label":"Perempuan"},{"value":"LAIN","label":"Tidak menyebutkan"}] },
                    { "id": "r_usia", "type": "select", "label": "Kelompok Usia", "required": false, "options": [{"value":"<17","label":"< 17 tahun"},{"value":"17-25","label":"17-25 tahun"},{"value":"26-40","label":"26-40 tahun"},{"value":"41-60","label":"41-60 tahun"},{"value":">60","label":"> 60 tahun"}] },
                    { "id": "r_pendidikan", "type": "select", "label": "Pendidikan Terakhir", "required": false, "options": [{"value":"SD","label":"SD/Sederajat"},{"value":"SMP","label":"SMP/Sederajat"},{"value":"SMA","label":"SMA/SMK/Sederajat"},{"value":"D3","label":"Diploma (D3)"},{"value":"S1","label":"Sarjana (S1)"},{"value":"S2/S3","label":"Pascasarjana (S2/S3)"}] },
                    { "id": "r_pekerjaan", "type": "text", "label": "Pekerjaan", "required": false },
                    { "id": "r_status_responden", "type": "select", "label": "Status Responden", "required": false, "options": [{"value":"Warga","label":"Warga / Masyarakat Umum"},{"value":"ASN","label":"ASN / Aparatur Pemerintah"},{"value":"Pelaku Usaha","label":"Pelaku Usaha / UMKM"},{"value":"Pelajar","label":"Pelajar / Mahasiswa"},{"value":"Lainnya","label":"Lainnya"}] },
                    { "id": "r_wilayah", "type": "regional_purbalingga", "label": "Wilayah Domisili (Kecamatan & Desa)", "required": true, "config": {"kecamatanFieldId":"r_kecamatan","desaFieldId":"r_desa","showKodePos":false} },
                    { "id": "r_alamat", "type": "textarea", "label": "Alamat", "required": false }
                ]
            },
            {
                "id": "sec_transparansi",
                "title": "Transparansi Informasi Publik",
                "fields": [
                    { "id": "t_info_kemudahan", "type": "rating", "label": "Kemudahan menemukan informasi layanan Dinkominfo di kanal resmi", "required": true, "config": {"min":1,"max":5} },
                    { "id": "t_info_ketepatan", "type": "rating", "label": "Ketepatan dan kebaruan informasi yang dipublikasikan", "required": true, "config": {"min":1,"max":5} },
                    { "id": "t_info_kelengkapan", "type": "rating", "label": "Kelengkapan informasi publik", "required": true, "config": {"min":1,"max":5} },
                    { "id": "t_info_transparansi", "type": "rating", "label": "Keterbukaan informasi publik (laporan kinerja, anggaran, kegiatan)", "required": true, "config": {"min":1,"max":5} },
                    { "id": "t_info_akses_dokumen", "type": "rating", "label": "Kemudahan mengakses dan mengunduh dokumen publik", "required": true, "config": {"min":1,"max":5} },
                    { "id": "t_info_saran", "type": "textarea", "label": "Saran transparansi informasi", "required": false }
                ]
            },
            {
                "id": "sec_aduan",
                "title": "Kecepatan Respon Kanal Aduan",
                "fields": [
                    { "id": "aduan_kanal", "type": "checkbox", "label": "Kanal aduan yang pernah digunakan", "required": false, "options": [{"value":"WhatsApp / Call Center Dinkominfo","label":"WhatsApp / Call Center Dinkominfo"},{"value":"Telepon langsung","label":"Telepon langsung"},{"value":"Email resmi","label":"Email resmi"},{"value":"Media sosial","label":"Media sosial"},{"value":"Website resmi & form pengaduan","label":"Website resmi & form pengaduan"},{"value":"SP4N-LAPOR!","label":"SP4N-LAPOR!"},{"value":"Datang langsung ke kantor","label":"Datang langsung ke kantor"},{"value":"Lainnya","label":"Lainnya"}] },
                    { "id": "aduan_frekuensi", "type": "select", "label": "Frekuensi penggunaan kanal aduan", "required": false, "options": [{"value":"Belum pernah","label":"Belum pernah"},{"value":"1 kali","label":"1 kali"},{"value":"2-5 kali","label":"2-5 kali"},{"value":">5 kali","label":"> 5 kali"}] },
                    { "id": "aduan_kecepatan", "type": "rating", "label": "Kecepatan respons awal kanal aduan", "required": true, "config": {"min":1,"max":5} },
                    { "id": "aduan_kualitas", "type": "rating", "label": "Kualitas penanganan aduan", "required": true, "config": {"min":1,"max":5} },
                    { "id": "aduan_penyelesaian", "type": "select", "label": "Status penyelesaian aduan", "required": false, "options": [{"value":"Ya","label":"Ya, terselesaikan"},{"value":"Sebagian","label":"Sebagian terselesaikan"},{"value":"Tidak","label":"Tidak terselesaikan"},{"value":"Belum","label":"Belum ada tindak lanjut"}] },
                    { "id": "aduan_saran", "type": "textarea", "label": "Saran kanal aduan", "required": false }
                ]
            },
            {
                "id": "sec_internet",
                "title": "Kualitas Konektivitas Internet Desa",
                "fields": [
                    { "id": "inet_provider", "type": "select", "label": "Penyedia internet utama", "required": false, "options": [{"value":"Telkomsel","label":"Telkomsel"},{"value":"Indosat (IM3)","label":"Indosat (IM3)"},{"value":"XL Axiata","label":"XL Axiata"},{"value":"Tri (3)","label":"Tri (3)"},{"value":"Smartfren","label":"Smartfren"},{"value":"IndiHome","label":"IndiHome (Telkom)"},{"value":"Biznet","label":"Biznet"},{"value":"MyRepublic","label":"MyRepublic"},{"value":"Lainnya","label":"Lainnya / tidak tahu"}] },
                    { "id": "inet_kecepatan", "type": "rating", "label": "Kecepatan internet yang dirasakan", "required": true, "config": {"min":1,"max":5} },
                    { "id": "inet_stabilitas", "type": "select", "label": "Kestabilan koneksi internet", "required": false, "options": [{"value":"Sangat stabil","label":"Sangat stabil"},{"value":"Cukup stabil","label":"Cukup stabil"},{"value":"Tidak stabil","label":"Tidak stabil"},{"value":"Sangat tidak stabil","label":"Sangat tidak stabil"}] },
                    { "id": "inet_sinyal", "type": "rating", "label": "Kekuatan sinyal di rumah", "required": true, "config": {"min":1,"max":5} },
                    { "id": "inet_jangkauan", "type": "select", "label": "Jangkauan jaringan 4G/5G di desa", "required": false, "options": [{"value":"Tersedia merata","label":"Tersedia merata"},{"value":"Tersedia sebagian","label":"Tersedia sebagian"},{"value":"Tidak tersedia","label":"Tidak tersedia"},{"value":"Tidak tahu","label":"Tidak tahu"}] },
                    { "id": "inet_memadai", "type": "radio", "label": "Apakah internet memadai untuk kebutuhan sehari-hari", "required": false, "options": [{"value":"Ya, sangat memadai","label":"Ya, sangat memadai"},{"value":"Cukup memadai","label":"Cukup memadai"},{"value":"Kurang memadai","label":"Kurang memadai"},{"value":"Tidak memadai","label":"Tidak memadai"}] },
                    { "id": "inet_kendala", "type": "checkbox", "label": "Kendala utama konektivitas internet", "required": false, "options": [{"value":"Sinyal lemah","label":"Sinyal lemah"},{"value":"Koneksi sering putus","label":"Koneksi sering putus"},{"value":"Kecepatan internet lambat","label":"Kecepatan internet lambat"},{"value":"Kuota mahal","label":"Kuota mahal"},{"value":"Infrastruktur kurang","label":"Infrastruktur kurang"},{"value":"Gangguan cuaca","label":"Gangguan cuaca"},{"value":"Listrik tidak stabil","label":"Listrik tidak stabil"},{"value":"Belum tersedia internet","label":"Belum tersedia internet"}] },
                    { "id": "inet_saran", "type": "textarea", "label": "Saran koneksi internet desa", "required": false }
                ]
            },
            {
                "id": "sec_umum",
                "title": "Penilaian Umum",
                "fields": [
                    { "id": "overall", "type": "rating", "label": "Kepuasan keseluruhan terhadap layanan Diskominfo", "required": true, "config": {"min":1,"max":5} },
                    { "id": "rekomendasi", "type": "radio", "label": "Apakah Anda merekomendasikan layanan Diskominfo", "required": true, "options": [{"value":"Pasti","label":"Pasti"},{"value":"Mungkin","label":"Mungkin"},{"value":"Tidak","label":"Tidak"}] },
                    { "id": "saran_umum", "type": "textarea", "label": "Saran umum", "required": false }
                ]
            }
        ]
    }',
    '{
        "is_public": true,
        "require_nik": false,
        "one_response_per_nik": false,
        "max_submissions": 0,
        "allow_edit_response": false,
        "send_email_receipt": false,
        "start_date": "2026-10-01T00:00:00Z"
    }'
) ON CONFLICT (slug) DO NOTHING;
