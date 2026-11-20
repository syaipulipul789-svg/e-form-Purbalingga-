-- ==============================================================================
-- 07_response_workflow.sql - Alur verifikasi pengajuan oleh admin OPD
-- Status: SUBMITTED -> VERIFIED -> APPROVED / REJECTED
-- Aman dijalankan berulang.
-- ==============================================================================

ALTER TABLE form_responses
    ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED',
    ADD COLUMN IF NOT EXISTS internal_note TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS public_note TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'chk_form_responses_status'
          AND conrelid = 'form_responses'::regclass
    ) THEN
        ALTER TABLE form_responses
            ADD CONSTRAINT chk_form_responses_status
            CHECK (status IN ('SUBMITTED', 'VERIFIED', 'APPROVED', 'REJECTED'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_responses_form_status
    ON form_responses(form_id, status);
CREATE INDEX IF NOT EXISTS idx_responses_status
    ON form_responses(status);
