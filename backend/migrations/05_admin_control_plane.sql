-- Super Admin audit trail for OPD and user administration.
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID NOT NULL,
    action VARCHAR(80) NOT NULL,
    entity_type VARCHAR(30) NOT NULL,
    entity_id UUID,
    entity_name VARCHAR(255) NOT NULL DEFAULT '',
    details JSONB NOT NULL DEFAULT '{}',
    ip_address VARCHAR(64) NOT NULL DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_created_at
    ON admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_entity_type_created_at
    ON admin_audit_logs(entity_type, created_at DESC);
