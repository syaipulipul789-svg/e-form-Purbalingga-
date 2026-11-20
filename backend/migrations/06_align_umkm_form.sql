-- ==============================================================================
-- 06_align_umkm_form.sql - Selaraskan judul form UMKM seed lama dengan katalog
-- Aman dijalankan berulang: hanya mengubah baris dengan judul seed lama.
-- ==============================================================================

UPDATE forms
SET title = 'Pendataan Pelaku Usaha Mikro (UMKM) & Bantuan Modal 2026',
    updated_at = NOW()
WHERE slug = 'bansos-umkm-purbalingga-2026'
  AND title = 'Pendataan Pelaku Usaha Mikro Kabupaten Purbalingga 2026';
