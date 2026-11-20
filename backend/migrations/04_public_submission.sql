-- ==============================================================================
-- 04_public_submission.sql - Metadata Respons & Pencegahan Submit Ganda
-- ==============================================================================

ALTER TABLE form_responses
    ADD COLUMN IF NOT EXISTS registration_number VARCHAR(50),
    ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100);

CREATE UNIQUE INDEX IF NOT EXISTS uq_form_responses_registration_number
    ON form_responses (registration_number)
    WHERE registration_number IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_form_responses_idempotency_key
    ON form_responses (form_id, idempotency_key)
    WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_form_responses_form_respondent
    ON form_responses (form_id, respondent_identifier);

CREATE INDEX IF NOT EXISTS idx_form_responses_registration_number
    ON form_responses (registration_number);
