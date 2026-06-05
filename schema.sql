CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    api_key_hash VARCHAR(255) UNIQUE NOT NULL,
    rate_limit_rpm INT DEFAULT 60,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS analytics_events (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    path VARCHAR(512) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INT NOT NULL,
    ip_hash VARCHAR(64) NOT NULL,
    duration_ms INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analytics_tenant_date ON analytics_events(tenant_id, created_at DESC);

-- Seed default tenant (Acme Corp) with SHA-256 hashed API key of 'test_api_key_123'
INSERT INTO tenants (name, api_key_hash, rate_limit_rpm) 
VALUES ('Acme Corp', '934444547be0b9a674395cf90df9d1d8a658fe9694291122a2757270e53a5c10', 60)
ON CONFLICT (api_key_hash) DO NOTHING;