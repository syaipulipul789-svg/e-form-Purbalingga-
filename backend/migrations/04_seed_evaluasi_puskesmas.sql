-- ==============================================================================
-- 04_seed_evaluasi_puskesmas.sql - Formulir Kuisioner Evaluasi & Umpan Balik
-- Mutu Pelayanan Rawat Jalan Puskesmas Kabupaten Purbalingga
-- OPD: Dinas Kesehatan Kabupaten Purbalingga (Dinkes)
-- Target: 22 Puskesmas se-kabupaten, untuk publik/warga
-- ==============================================================================

INSERT INTO forms (
    id, opd_id, creator_id, slug, title, description, status, schema, settings
) VALUES (
    'f1a2b3c4-8888-4678-90ab-cdef12345678',
    'e8d7a12b-2222-4c78-90ab-cdef12345678',
    'c1f8a847-2222-4f8e-bf82-7235a90e3952',
    'evaluasi-pelayanan-kesehatan-puskesmas',
    'Kuisioner Evaluasi & Umpan Balik Mutu Pelayanan Rawat Jalan Puskesmas',
    'Kuesioner evaluasi ketersediaan obat generik, ketepatan jadwal dokter, keramahan petugas, dan kenyamanan poli di 22 Puskesmas wilayah Kabupaten Purbalingga. Untuk publik/warga. Identitas opsional, pengisian anonim diperbolehkan.',
    'PUBLISHED',
    '{
        "version": "1.0",
        "sections": [
            {
                "id": "sec_identitas",
                "title": "A. Identitas Responden",
                "description": "Identitas bersifat opsional. Wilayah domisili dan Puskesmas yang dikunjungi wajib diisi untuk analisis per wilayah.",
                "fields": [
                    {
                        "id": "r_nama",
                        "type": "text",
                        "label": "Nama Lengkap",
                        "placeholder": "Nama responden (opsional)",
                        "required": false
                    },
                    {
                        "id": "r_nik",
                        "type": "nik",
                        "label": "Nomor Induk Kependudukan (NIK)",
                        "placeholder": "3303xxxxxxxxxxxx (opsional)",
                        "helpText": "Wajib 16 digit angka KTP Purbalingga, diawali 3303",
                        "required": false,
                        "validation": {
                            "pattern": "^3303[0-9]{12}$",
                            "minLength": 16,
                            "maxLength": 16
                        }
                    },
                    {
                        "id": "r_jenis_kelamin",
                        "type": "select",
                        "label": "Jenis Kelamin",
                        "required": false,
                        "options": [
                            { "value": "L", "label": "Laki-laki" },
                            { "value": "P", "label": "Perempuan" },
                            { "value": "LAIN", "label": "Tidak menyebutkan" }
                        ]
                    },
                    {
                        "id": "r_usia",
                        "type": "select",
                        "label": "Kelompok Usia",
                        "required": false,
                        "options": [
                            { "value": "<17", "label": "< 17 tahun" },
                            { "value": "17-25", "label": "17-25 tahun" },
                            { "value": "26-40", "label": "26-40 tahun" },
                            { "value": "41-60", "label": "41-60 tahun" },
                            { "value": ">60", "label": "> 60 tahun" }
                        ]
                    },
                    {
                        "id": "r_pendidikan",
                        "type": "text",
                        "label": "Pendidikan Terakhir",
                        "placeholder": "Contoh: SMA, S1, D3",
                        "required": false
                    },
                    {
                        "id": "r_pekerjaan",
                        "type": "text",
                        "label": "Pekerjaan",
                        "placeholder": "Contoh: Guru, Petani, Wiraswasta, Ibu Rumah Tangga",
                        "required": false
                    },
                    {
                        "id": "r_status_responden",
                        "type": "select",
                        "label": "Status Responden",
                        "required": false,
                        "options": [
                            { "value": "Warga", "label": "Warga / Masyarakat Umum" },
                            { "value": "ASN", "label": "ASN / Aparatur Pemerintah" },
                            { "value": "Pelaku Usaha", "label": "Pelaku Usaha / UMKM" },
                            { "value": "Pelajar", "label": "Pelajar / Mahasiswa" },
                            { "value": "Lainnya", "label": "Lainnya" }
                        ]
                    },
                    {
                        "id": "r_wilayah",
                        "type": "regional_purbalingga",
                        "label": "Wilayah Domisili (Kecamatan & Desa)",
                        "helpText": "Pilih kecamatan dan desa sesuai tempat tinggal",
                        "required": true,
                        "config": {
                            "kecamatanFieldId": "r_kecamatan",
                            "desaFieldId": "r_desa",
                            "showKodePos": false
                        }
                    },
                    {
                        "id": "r_alamat",
                        "type": "textarea",
                        "label": "Alamat",
                        "placeholder": "Alamat tempat tinggal (opsional)",
                        "required": false
                    }
                ]
            },
            {
                "id": "sec_kunjungan",
                "title": "B. Data Kunjungan Puskesmas",
                "description": "Isi data Puskesmas tempat Anda terakhir kali melakukan pemeriksaan rawat jalan.",
                "fields": [
                    {
                        "id": "v_puskesmas",
                        "type": "select",
                        "label": "Puskesmas yang Dikunjungi",
                        "helpText": "Pilih salah satu dari 22 Puskesmas di Kabupaten Purbalingga",
                        "required": true,
                        "options": [
                            { "value": "Puskesmas Purbalingga (Kec. Purbalingga)", "label": "Puskesmas Purbalingga (Kec. Purbalingga)" },
                            { "value": "Puskesmas Padamara (Kec. Padamara)", "label": "Puskesmas Padamara (Kec. Padamara)" },
                            { "value": "Puskesmas Bobotsari (Kec. Bobotsari)", "label": "Puskesmas Bobotsari (Kec. Bobotsari)" },
                            { "value": "Puskesmas Mrebet (Kec. Mrebet)", "label": "Puskesmas Mrebet (Kec. Mrebet)" },
                            { "value": "Puskesmas Kalimanah (Kec. Kalimanah)", "label": "Puskesmas Kalimanah (Kec. Kalimanah)" },
                            { "value": "Puskesmas Karangkemalang (Kec. Karangkemalang)", "label": "Puskesmas Karangkemalang (Kec. Karangkemalang)" },
                            { "value": "Puskesmas Paguyangan (Kec. Paguyangan)", "label": "Puskesmas Paguyangan (Kec. Paguyangan)" },
                            { "value": "Puskesmas Kamisore (Kec. Kamisore)", "label": "Puskesmas Kamisore (Kec. Kamisore)" },
                            { "value": "Puskesmas Kersana (Kec. Kersana)", "label": "Puskesmas Kersana (Kec. Kersana)" },
                            { "value": "Puskesmas Karanganyar (Kec. Karanganyar)", "label": "Puskesmas Karanganyar (Kec. Karanganyar)" },
                            { "value": "Puskesmas Bantan (Kec. Bantan)", "label": "Puskesmas Bantan (Kec. Bantan)" },
                            { "value": "Puskesmas Kertasari (Kec. Kertasari)", "label": "Puskesmas Kertasari (Kec. Kertasari)" },
                            { "value": "Puskesmas Sirampog (Kec. Sirampog)", "label": "Puskesmas Sirampog (Kec. Sirampog)" },
                            { "value": "Puskesmas Singaparna (Kec. Singaparna)", "label": "Puskesmas Singaparna (Kec. Singaparna)" },
                            { "value": "Puskesmas Watumbung (Kec. Watumbung)", "label": "Puskesmas Watumbung (Kec. Watumbung)" },
                            { "value": "Puskesmas Bojong (Kec. Bojong)", "label": "Puskesmas Bojong (Kec. Bojong)" },
                            { "value": "Puskesmas Pangkah (Kec. Pangkah)", "label": "Puskesmas Pangkah (Kec. Pangkah)" },
                            { "value": "Puskesmas Poedjokusumo (Kec. Poedjokusumo)", "label": "Puskesmas Poedjokusumo (Kec. Poedjokusumo)" },
                            { "value": "Puskesmas Bagelen (Kec. Bagelen)", "label": "Puskesmas Bagelen (Kec. Bagelen)" },
                            { "value": "Puskesmas Kaligondang (Kec. Kaligondang)", "label": "Puskesmas Kaligondang (Kec. Kaligondang)" },
                            { "value": "Puskesmas Tamtama (Kec. Tamtama)", "label": "Puskesmas Tamtama (Kec. Tamtama)" },
                            { "value": "Puskesmas Bakalrejo (Kec. Bakalrejo)", "label": "Puskesmas Bakalrejo (Kec. Bakalrejo)" }
                        ]
                    },
                    {
                        "id": "v_tanggal_kunjungan",
                        "type": "date",
                        "label": "Tanggal Kunjungan Terakhir",
                        "placeholder": "Pilih tanggal",
                        "required": false
                    }
                ]
            },
            {
                "id": "sec_obat_generik",
                "title": "1. Ketersediaan Obat Generik",
                "description": "Beri penilaian 1 (sangat tidak puas) s/d 5 (sangat puas).",
                "fields": [
                    {
                        "id": "a_obat_tersedia",
                        "type": "rating",
                        "label": "Ketersediaan obat generik yang diresepkan dokter di apotik Puskesmas",
                        "required": true,
                        "config": { "min": 1, "max": 5 }
                    },
                    {
                        "id": "a_obat_cocok",
                        "type": "rating",
                        "label": "Ketersediaan obat generik yang sesuai dengan penyakit yang Anda penderita",
                        "required": true,
                        "config": { "min": 1, "max": 5 }
                    },
                    {
                        "id": "a_obat_info",
                        "type": "rating",
                        "label": "Keterangan informasi obat generik (manfaat, cara pakai, efek samping) yang diberikan petugas",
                        "required": true,
                        "config": { "min": 1, "max": 5 }
                    },
                    {
                        "id": "a_obat_harga",
                        "type": "rating",
                        "label": "Harga obat generik terjangkau dan sesuai kemampuan",
                        "required": true,
                        "config": { "min": 1, "max": 5 }
                    },
                    {
                        "id": "a_obat_saran",
                        "type": "textarea",
                        "label": "Saran / masukan untuk ketersediaan obat generik",
                        "placeholder": "Tuliskan saran Anda tentang ketersediaan obat generik",
                        "required": false
                    }
                ]
            },
            {
                "id": "sec_jadwal_dokter",
                "title": "2. Ketepatan Jadwal Dokter",
                "description": "Beri penilaian 1 (sangat tidak puas) s/d 5 (sangat puas).",
                "fields": [
                    {
                        "id": "b_jadwal_tepat",
                        "type": "rating",
                        "label": "Dokter hadir sesuai jadwal pelayanan yang telah ditetapkan",
                        "required": true,
                        "config": { "min": 1, "max": 5 }
                    },
                    {
                        "id": "b_jadwal_tidak_tunda",
                        "type": "rating",
                        "label": "Tidak ada penundaan jadwal dokter tanpa pemberitahuan sebelumnya",
                        "required": true,
                        "config": { "min": 1, "max": 5 }
                    },
                    {
                        "id": "b_jadwal_waktu_tunggu",
                        "type": "rating",
                        "label": "Waktu tunggu antrian dokter sesuai dengan harapan",
                        "required": true,
                        "config": { "min": 1, "max": 5 }
                    },
                    {
                        "id": "b_jadwal_info",
                        "type": "rating",
                        "label": "Pemberitahuan jadwal dokter yang jelas dan mudah diakses",
                        "required": true,
                        "config": { "min": 1, "max": 5 }
                    },
                    {
                        "id": "b_jadwal_saran",
                        "type": "textarea",
                        "label": "Saran / masukan untuk ketepatan jadwal dokter",
                        "placeholder": "Tuliskan saran Anda tentang jadwal dokter",
                        "required": false
                    }
                ]
            },
            {
                "id": "sec_keramahan_petugas",
                "title": "3. Keramahan Petugas",
                "description": "Beri penilaian 1 (sangat tidak puas) s/d 5 (sangat puas).",
                "fields": [
                    {
                        "id": "c_petugas_ramah",
                        "type": "rating",
                        "label": "Petugas ramah dan sopan saat pelayanan di balik loket",
                        "required": true,
                        "config": { "min": 1, "max": 5 }
                    },
                    {
                        "id": "c_petugas_info_jelas",
                        "type": "rating",
                        "label": "Memberi informasi yang jelas dan mudah dipahami",
                        "required": true,
                        "config": { "min": 1, "max": 5 }
                    },
                    {
                        "id": "c_petugas_bantuan",
                        "type": "rating",
                        "label": "Bersedia membantu dan merespon keluhan warga",
                        "required": true,
                        "config": { "min": 1, "max": 5 }
                    },
                    {
                        "id": "c_petugas_rahasia",
                        "type": "rating",
                        "label": "Menjaga kerahasiaan data medis pasien",
                        "required": true,
                        "config": { "min": 1, "max": 5 }
                    },
                    {
                        "id": "c_petugas_saran",
                        "type": "textarea",
                        "label": "Saran / masukan untuk peningkatan keramahan petugas",
                        "placeholder": "Tuliskan saran Anda tentang pelayanan petugas",
                        "required": false
                    }
                ]
            },
            {
                "id": "sec_kenyamanan_poli",
                "title": "4. Kenyamanan Poli",
                "description": "Beri penilaian 1 (sangat tidak puas) s/d 5 (sangat puas).",
                "fields": [
                    {
                        "id": "d_poli_bersih",
                        "type": "rating",
                        "label": "Kebersihan ruang tunggu dan fasilitas poli",
                        "required": true,
                        "config": { "min": 1, "max": 5 }
                    },
                    {
                        "id": "d_poli_kursi",
                        "type": "rating",
                        "label": "Ketersediaan kursi dan tempat duduk yang cukup",
                        "required": true,
                        "config": { "min": 1, "max": 5 }
                    },
                    {
                        "id": "d_poli_ventilasi",
                        "type": "rating",
                        "label": "Sirkulasi udara / ventilasi ruang tunggu",
                        "required": true,
                        "config": { "min": 1, "max": 5 }
                    },
                    {
                        "id": "d_poli_toilet",
                        "type": "rating",
                        "label": "Ketersediaan toilet yang bersih dan layak pakai",
                        "required": true,
                        "config": { "min": 1, "max": 5 }
                    },
                    {
                        "id": "d_poli_aksesibilitas",
                        "type": "rating",
                        "label": "Kesesuaian ruang tunggu bagi lansia, disabilitas, dan ibu hamil",
                        "required": true,
                        "config": { "min": 1, "max": 5 }
                    },
                    {
                        "id": "d_poli_saran",
                        "type": "textarea",
                        "label": "Saran / masukan untuk kenyamanan poli",
                        "placeholder": "Tuliskan saran Anda tentang kenyamanan fasilitas poli",
                        "required": false
                    }
                ]
            },
            {
                "id": "sec_umum",
                "title": "5. Penilaian Umum & Keluhan",
                "description": "Kesimpulan umum terhadap pelayanan rawat jalan Puskesmas.",
                "fields": [
                    {
                        "id": "overall",
                        "type": "rating",
                        "label": "Kepuasan keseluruhan terhadap pelayanan rawat jalan Puskesmas",
                        "required": true,
                        "config": { "min": 1, "max": 5 }
                    },
                    {
                        "id": "rekomendasi",
                        "type": "radio",
                        "label": "Apakah Anda akan merekomendasikan Puskesmas ini kepada orang lain?",
                        "required": true,
                        "options": [
                            { "value": "Pasti", "label": "Pasti" },
                            { "value": "Mungkin", "label": "Mungkin" },
                            { "value": "Tidak", "label": "Tidak" }
                        ]
                    },
                    {
                        "id": "keluhan",
                        "type": "checkbox",
                        "label": "Keluhan yang pernah Anda alami (boleh lebih dari satu)",
                        "required": false,
                        "options": [
                            { "value": "Obat generik yang diresepkan tidak tersedia", "label": "Obat generik yang diresepkan tidak tersedia" },
                            { "value": "Dokter tidak hadir sesuai jadwal", "label": "Dokter tidak hadir sesuai jadwal" },
                            { "value": "Waktu antrian terlalu lama", "label": "Waktu antrian terlalu lama" },
                            { "value": "Petugas tidak ramah / kurang sopan", "label": "Petugas tidak ramah / kurang sopan" },
                            { "value": "Informasi jadwal dokter kurang jelas", "label": "Informasi jadwal dokter kurang jelas" },
                            { "value": "Ruang tunggu kotak / kurang nyaman", "label": "Ruang tunggu kotak / kurang nyaman" },
                            { "value": "Toilet kotak / tidak layak pakai", "label": "Toilet kotak / tidak layak pakai" },
                            { "value": "Kursi ruang tunggu tidak cukup", "label": "Kursi ruang tunggu tidak cukup" },
                            { "value": "Tidak ada fasilitas bagi lansia / disabilitas / ibu hamil", "label": "Tidak ada fasilitas bagi lansia / disabilitas / ibu hamil" },
                            { "value": "Lainnya", "label": "Lainnya" }
                        ]
                    },
                    {
                        "id": "saran_umum",
                        "type": "textarea",
                        "label": "Saran umum / masukan tambahan untuk Puskesmas",
                        "placeholder": "Tuliskan saran umum Anda untuk perbaikan pelayanan Puskesmas",
                        "required": false
                    }
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
        "start_date": "2026-10-19T00:00:00Z"
    }'
) ON CONFLICT (slug) DO NOTHING;
