-- Migration: 007_create_mfa_recovery_codes
-- Description: Creates table for one-time MFA backup recovery codes

CREATE TABLE IF NOT EXISTS mfa_recovery_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  used_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recovery_codes_user ON mfa_recovery_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_recovery_codes_hash ON mfa_recovery_codes(code_hash);
