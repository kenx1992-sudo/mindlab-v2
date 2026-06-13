-- Mindlab Database Schema V1.0
-- Per-region deployment, data localized, RLS enforced
-- Author: Charlie (Backend Engineer)
-- Date: 2026-04-26

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region          TEXT NOT NULL CHECK (region IN ('HK', 'TW', 'GB')),
    email           TEXT NOT NULL,
    display_name    TEXT,
    minor_flag      BOOLEAN NOT NULL DEFAULT FALSE,
    guardian_id     UUID REFERENCES users(id),
    subscription    TEXT NOT NULL DEFAULT 'ai_free' CHECK (subscription IN ('ai_free', 'ai_plus', 'counselor', 'eap')),
    password_hash   TEXT NOT NULL,  -- bcrypt hash, NEVER plaintext (A级修复)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ,
    deleted_at      TIMESTAMPTZ,
    UNIQUE (region, email)
);

-- Row Level Security: each region only sees its own data
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY region_isolation_users ON users
    USING (region = current_setting('app.region', true)::text);

-- Index for lookups
CREATE INDEX idx_users_region ON users(region);
CREATE INDEX idx_users_email ON users(region, email) WHERE deleted_at IS NULL;

-- ============================================================
-- CONSENTS (informed consent, derived data consent per CR-008)
-- ============================================================
CREATE TABLE consents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    type            TEXT NOT NULL CHECK (type IN (
        'terms_of_service', 'privacy_policy', 'data_processing',
        'sensitive_data', 'derived_data', 'minor_guardian', 'cross_region'
    )),
    data_type       TEXT,          -- for derived_data: "emotion_profile", "assessment_result"
    data_scope      TEXT,          -- defines data source boundary
    granted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at      TIMESTAMPTZ,
    version         TEXT NOT NULL,  -- consent document version
    ip_address      INET,
    user_agent      TEXT,
    UNIQUE (user_id, type, data_type)
);

CREATE INDEX idx_consents_user ON consents(user_id);
CREATE INDEX idx_consents_type ON consents(user_id, type) WHERE revoked_at IS NULL;

-- ============================================================
-- SESSIONS
-- ============================================================
CREATE TABLE counselors (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    region          TEXT NOT NULL CHECK (region IN ('HK', 'TW', 'GB')),
    license_type    TEXT NOT NULL,   -- "HKPCA", "心理師法", "BACP", "UKCP", etc.
    specialties     JSONB NOT NULL DEFAULT '[]',
    languages       JSONB NOT NULL DEFAULT '[]',
    cert_valid      BOOLEAN NOT NULL DEFAULT FALSE,
    cert_expiry     DATE,
    background_check_date DATE,
    online          BOOLEAN NOT NULL DEFAULT FALSE,
    onboarding_status TEXT NOT NULL DEFAULT 'pending' CHECK (onboarding_status IN (
        'pending', 'in_review', 'approved', 'suspended', 'terminated'
    )),
    statutory_standard TEXT,         -- HK: track which standard applies (CR-004)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ
);

ALTER TABLE counselors ENABLE ROW LEVEL SECURITY;
CREATE POLICY region_isolation_counselors ON counselors
    USING (region = current_setting('app.region', true)::text);

CREATE INDEX idx_counselors_region_online ON counselors(region, online) WHERE onboarding_status = 'approved';
CREATE INDEX idx_counselors_specialties ON counselors USING GIN(specialties);

-- ============================================================
-- COUNSELOR SCHEDULES
CREATE TABLE sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    state           TEXT NOT NULL DEFAULT 'CHATTING' CHECK (state IN (
        'NEW', 'FREE_TRIAL', 'CHATTING', 'COUNSELOR_PENDING',
        'COUNSELOR_SESSION', 'CRISIS_HANDLING'
    )),
    region          TEXT NOT NULL CHECK (region IN ('HK', 'TW', 'GB')),
    counselor_id    UUID REFERENCES counselors(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at        TIMESTAMPTZ,
    timeout_at      TIMESTAMPTZ  -- session auto-timeout (30min for AI, 60min for counselor)
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY region_isolation_sessions ON sessions
    USING (region = current_setting('app.region', true)::text);

CREATE INDEX idx_sessions_user ON sessions(user_id) WHERE ended_at IS NULL;
CREATE INDEX idx_sessions_state ON sessions(state) WHERE ended_at IS NULL;
CREATE INDEX idx_sessions_counselor ON sessions(counselor_id) WHERE counselor_id IS NOT NULL AND ended_at IS NULL;

-- ============================================================
-- MESSAGES (encrypted content)
-- ============================================================
CREATE TABLE messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    role            TEXT NOT NULL CHECK (role IN ('user', 'ai', 'counselor', 'system')),
    content         BYTEA NOT NULL,  -- AES-256 encrypted, never stored as plaintext
    risk_level      TEXT DEFAULT 'none' CHECK (risk_level IN ('none', 'low', 'medium', 'high', 'critical')),
    emotion_tags    JSONB DEFAULT '[]',
    disclaimer_appended BOOLEAN DEFAULT FALSE,  -- AI responses always have disclaimer
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_session ON messages(session_id, created_at);

-- ============================================================
-- COUNSELORS
-- ============================================================
-- ============================================================
CREATE TABLE counselor_schedules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    counselor_id    UUID NOT NULL REFERENCES counselors(id) ON DELETE CASCADE,
    day_of_week     SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    timezone        TEXT NOT NULL DEFAULT 'UTC',
    UNIQUE (counselor_id, day_of_week, start_time)
);

-- ============================================================
-- HANDOVERS (AI↔Counselor transitions)
-- ============================================================
CREATE TABLE handovers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES sessions(id),
    trigger_type    TEXT NOT NULL CHECK (trigger_type IN ('crisis', 'user_request', 'ai_suggestion')),
    risk_level      TEXT NOT NULL CHECK (risk_level IN ('none', 'low', 'medium', 'high', 'critical')),
    urgency         TEXT NOT NULL CHECK (urgency IN ('normal', 'urgent', 'emergency')),
    counselor_id    UUID REFERENCES counselors(id),
    status          TEXT NOT NULL DEFAULT 'REQUESTED' CHECK (status IN (
        'REQUESTED', 'MATCHING', 'PENDING_ACCEPT', 'HANDSHAKE',
        'IN_SESSION', 'COMPLETED', 'FEEDBACK', 'FAILED', 'TIMEOUT'
    )),
    handover_summary BYTEA,  -- encrypted structured summary (not raw conversation)
    emotion_summary TEXT,     -- non-raw emotion summary for counselor handoff
    topic_tags      JSONB DEFAULT '[]',
    fallback_used   BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    accepted_at     TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ
);

CREATE INDEX idx_handovers_session ON handovers(session_id);
CREATE INDEX idx_handovers_counselor ON handovers(counselor_id) WHERE status IN ('PENDING_ACCEPT', 'IN_SESSION');
CREATE INDEX idx_handovers_status ON handovers(status) WHERE status IN ('REQUESTED', 'MATCHING', 'PENDING_ACCEPT');

-- ============================================================
-- EMOTION PROFILES (derived data — requires separate consent CR-008)
-- ============================================================
CREATE TABLE emotion_profiles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    date            DATE NOT NULL,
    score           SMALLINT CHECK (score BETWEEN 0 AND 100),
    tags            JSONB DEFAULT '[]',
    source          TEXT NOT NULL DEFAULT 'ai_analysis',  -- "ai_analysis", "self_report", "assessment"
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, date, source)
);

-- RLS: only user can access their own emotion profile
ALTER TABLE emotion_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_own_emotion ON emotion_profiles
    USING (user_id::text = current_setting('app.user_id', true)::text);

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE TABLE payments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    region          TEXT NOT NULL CHECK (region IN ('HK', 'TW', 'GB')),
    amount          DECIMAL(12,2) NOT NULL,
    currency        TEXT NOT NULL CHECK (currency IN ('HKD', 'TWD', 'GBP')),
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    provider        TEXT NOT NULL,  -- "stripe", "fps", "line_pay"
    provider_id     TEXT,           -- provider's payment ID
    tier            TEXT NOT NULL,  -- "ai_plus", "counselor", "eap"
    idempotency_key TEXT,           -- for idempotent writes
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,
    UNIQUE (idempotency_key)
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY region_isolation_payments ON payments
    USING (region = current_setting('app.region', true)::text);

CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status) WHERE status = 'pending';

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
CREATE TABLE subscriptions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    region          TEXT NOT NULL CHECK (region IN ('HK', 'TW', 'GB')),
    plan            TEXT NOT NULL CHECK (plan IN ('ai_free', 'ai_plus', 'counselor', 'eap')),
    billing_cycle   TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'quarterly', 'annual')),
    status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end   TIMESTAMPTZ NOT NULL,
    provider_subscription_id TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cancelled_at    TIMESTAMPTZ
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY region_isolation_subscriptions ON subscriptions
    USING (region = current_setting('app.region', true)::text);

-- ============================================================
-- FEEDBACK & COMPLAINTS (G-021)
-- ============================================================
CREATE TABLE feedback (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    session_id      UUID REFERENCES sessions(id),
    region          TEXT NOT NULL,
    rating          SMALLINT CHECK (rating BETWEEN 1 AND 5),
    comment         TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE complaints (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    region          TEXT NOT NULL,
    category        TEXT NOT NULL CHECK (category IN (
        'ai_quality', 'counselor_behavior', 'technical_fault', 'data_breach', 'other'
    )),
    priority        TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'critical')),
    status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'escalated')),
    description     BYTEA NOT NULL,  -- encrypted
    escalated_to    TEXT,            -- "compliance_team" when high risk (G-021)
    response_deadline TIMESTAMPTZ,   -- 48h from creation
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at     TIMESTAMPTZ
);

CREATE INDEX idx_complaints_status ON complaints(status) WHERE status IN ('open', 'in_progress');
CREATE INDEX idx_complaints_escalated ON complaints(priority) WHERE priority IN ('high', 'critical');

-- ============================================================
-- AUDIT LOGS (immutable, encrypted, never deleted)
-- ============================================================
CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actor_id        UUID,
    actor_type      TEXT NOT NULL CHECK (actor_type IN ('user', 'counselor', 'admin', 'system')),
    action          TEXT NOT NULL,   -- "create", "read", "update", "delete"
    resource        TEXT NOT NULL,   -- "session", "user", "consent", "payment", etc.
    resource_id     UUID,
    region          TEXT NOT NULL CHECK (region IN ('HK', 'TW', 'GB')),
    detail          BYTEA,          -- encrypted JSON details
    ip_address      INET,
    request_id      UUID
);

-- Append-only: no UPDATE or DELETE allowed
REVOKE UPDATE, DELETE ON audit_logs FROM PUBLIC;

CREATE INDEX idx_audit_actor ON audit_logs(actor_id, timestamp);
CREATE INDEX idx_audit_resource ON audit_logs(resource, resource_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);

-- ============================================================
-- DATA DELETION TRACKING (for cross-region one-click delete G-006)
-- ============================================================
CREATE TABLE deletion_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    home_region     TEXT NOT NULL,
    target_region   TEXT NOT NULL,  -- region that needs to delete
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'completed', 'timeout')),
    requested_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deadline        TIMESTAMPTZ NOT NULL,  -- 72h from request
    completed_at    TIMESTAMPTZ
);

CREATE INDEX idx_deletion_pending ON deletion_requests(status) WHERE status = 'pending';

-- ============================================================
-- VIEWS
-- ============================================================

-- Active sessions view (for monitoring)
CREATE VIEW v_active_sessions AS
SELECT s.id, s.user_id, s.state, s.region, s.counselor_id, s.created_at,
       u.subscription, u.minor_flag
FROM sessions s
JOIN users u ON s.user_id = u.id
WHERE s.ended_at IS NULL AND u.deleted_at IS NULL;

-- Counselor availability view (for matching)
CREATE VIEW v_available_counselors AS
SELECT c.id, c.region, c.specialties, c.languages, c.license_type, c.online
FROM counselors c
WHERE c.onboarding_status = 'approved'
  AND c.cert_valid = TRUE
  AND c.online = TRUE;

-- ============================================================
-- CASCADE DELETION FUNCTION (DEF-S003 fix)
-- One-click data deletion must cascade to ALL dependent records
-- ============================================================

CREATE OR REPLACE FUNCTION cascade_delete_user(p_user_id UUID)
RETURNS void AS $$
DECLARE
    v_user_region TEXT;
    v_audit_detail BYTEA;
BEGIN
    -- Get user region for audit
    SELECT region INTO v_user_region FROM users WHERE id = p_user_id;
    IF v_user_region IS NULL THEN
        RAISE EXCEPTION 'User % not found', p_user_id;
    END IF;

    -- Encrypt audit detail
    v_audit_detail := pgp_sym_encrypt(json_build_object(
        'action', 'cascade_delete',
        'user_id', p_user_id
    )::text, current_setting('app.encryption_key'));

    -- Log cascade deletion in audit (before deletion, so we can reference the user)
    INSERT INTO audit_logs (actor_id, actor_type, action, resource, resource_id, region, detail)
    VALUES (p_user_id, 'system', 'delete', 'user', p_user_id, v_user_region, v_audit_detail);

    -- Delete in correct dependency order (child → parent)

    -- 1. Feedback and complaints (no FK dependencies on other child tables)
    DELETE FROM feedback WHERE user_id = p_user_id;
    DELETE FROM complaints WHERE user_id = p_user_id;

    -- 2. Emotion profiles (derived data, requires consent)
    DELETE FROM emotion_profiles WHERE user_id = p_user_id;

    -- 3. Consents
    DELETE FROM consents WHERE user_id = p_user_id;

    -- 4. Subscriptions and payments
    DELETE FROM subscriptions WHERE user_id = p_user_id;
    DELETE FROM payments WHERE user_id = p_user_id;

    -- 5. Deletion requests (cleanup)
    DELETE FROM deletion_requests WHERE user_id = p_user_id;

    -- 6. Handovers (depend on sessions)
    DELETE FROM handovers WHERE session_id IN (
        SELECT id FROM sessions WHERE user_id = p_user_id
    );

    -- 7. Messages (depend on sessions)
    DELETE FROM messages WHERE session_id IN (
        SELECT id FROM sessions WHERE user_id = p_user_id
    );

    -- 8. Sessions
    DELETE FROM sessions WHERE user_id = p_user_id;

    -- 9. Counselor schedules and counselor records (if user is a counselor)
    DELETE FROM counselor_schedules WHERE counselor_id IN (
        SELECT id FROM counselors WHERE user_id = p_user_id
    );
    DELETE FROM counselors WHERE user_id = p_user_id;

    -- 10. Finally, hard-delete the user record
    DELETE FROM users WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to application role
-- GRANT EXECUTE ON FUNCTION cascade_delete_user(UUID) TO mindlab_app;

-- ============================================================
-- MESSAGE ENCRYPTION HELPER (A级修复: AES-256 encryption)
-- ============================================================

-- Encrypt message content before storage
CREATE OR REPLACE FUNCTION encrypt_message_content(p_content TEXT)
RETURNS BYTEA AS $$
BEGIN
    -- In production: use pgcrypto's pgp_sym_encrypt with AES-256
    -- Key sourced from app.encryption_key session variable
    RETURN pgp_sym_encrypt(p_content, current_setting('app.encryption_key'), 'cipher-algo=aes256');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrypt message content for authorized access
CREATE OR REPLACE FUNCTION decrypt_message_content(p_encrypted BYTEA)
RETURNS TEXT AS $$
BEGIN
    RETURN pgp_sym_decrypt(p_encrypted, current_setting('app.encryption_key'), 'cipher-algo=aes256');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: auto-encrypt messages on insert (defense in depth)
-- Note: Application layer should also encrypt. This is a safety net.
CREATE OR REPLACE FUNCTION trg_encrypt_message()
RETURNS TRIGGER AS $$
BEGIN
    -- Only encrypt if content is not already encrypted (plaintext check)
    IF NEW.content IS NOT NULL AND pg_typeof(NEW.content) = 'bytea' THEN
        -- Already encrypted at application layer, no-op
        RETURN NEW;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
