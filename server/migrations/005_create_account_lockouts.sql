-- Migration: 005_create_account_lockouts
-- Description: Creates account lockout tracking for brute-force protection

CREATE TABLE IF NOT EXISTS account_lockouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until DATETIME,
  last_attempt_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lockouts_email ON account_lockouts(email);
