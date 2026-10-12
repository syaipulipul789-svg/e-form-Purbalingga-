-- ==============================================================================
-- 01_init_schema.sql - Inisialisasi Skema Database E-Form Kabupaten Purbalingga
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1. Tabel OPD (Organisasi Perangkat Daerah)
CREATE TABLE IF NOT EXISTS opd (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kode_opd VARCHAR(50) UNIQUE NOT NULL,
    nama_opd VARCHAR(255) NOT NULL,
    singkatan VARCHAR(50),
    logo_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabel Pengguna (Admin OPD & Super Admin)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opd_id UUID REFERENCES opd(id) ON DELETE SET NULL,
    nama VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'ADMIN_OPD', -- SUPER_ADMIN, ADMIN_OPD, OPERATOR
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabel Formulir Dinamis
CREATE TABLE IF NOT EXISTS forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opd_id UUID NOT NULL REFERENCES opd(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    slug VARCHAR(150) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    banner_url VARCHAR(500),
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT', -- DRAFT, PUBLISHED, CLOSED, ARCHIVED
    schema JSONB NOT NULL DEFAULT '{"fields": []}',
    settings JSONB NOT NULL DEFAULT '{
        "is_public": true,
        "require_nik": false,
        "one_response_per_nik": false,
        "max_submissions": 0,
        "allow_edit_response": false,
        "send_email_receipt": false
    }',
    total_responses INTEGER NOT NULL DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forms_slug ON forms(slug);
CREATE INDEX IF NOT EXISTS idx_forms_opd_id ON forms(opd_id);
CREATE INDEX IF NOT EXISTS idx_forms_status ON forms(status);
CREATE INDEX IF NOT EXISTS idx_forms_schema ON forms USING gin (schema);

-- 4. Tabel Respons Formulir (Jawaban Publik)
CREATE TABLE IF NOT EXISTS form_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    respondent_identifier VARCHAR(255), -- NIK terenkripsi / Hash Sesi
    answers JSONB NOT NULL,
    metadata JSONB DEFAULT '{}',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_responses_form_id ON form_responses(form_id);
CREATE INDEX IF NOT EXISTS idx_responses_submitted_at ON form_responses(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_responses_answers ON form_responses USING gin (answers);

