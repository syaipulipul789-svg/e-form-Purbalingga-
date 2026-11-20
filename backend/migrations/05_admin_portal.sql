-- ==============================================================================
-- 05_admin_portal.sql - Verifikasi Respons & Optimasi Pencarian Admin
-- ==============================================================================

ALTER TABLE form_responses
    ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    ADD COLUMN IF NOT EXISTS verification_note TEXT,
    ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'form_responses_verification_status_check'
    ) THEN
        ALTER TABLE form_responses
            ADD CONSTRAINT form_responses_verification_status_check
            CHECK (verification_status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'REVISION'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_form_responses_verification
    ON form_responses (form_id, verification_status);

CREATE INDEX IF NOT EXISTS idx_form_responses_answers_trgm
    ON form_responses USING gin ((answers::text) gin_trgm_ops);
