-- Migration: 006_create_user_sessions
-- Description: Creates user_sessions table for advanced multi-device session management

CREATE TABLE IF NOT EXISTS user_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL UNIQUE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device TEXT,
  user_agent TEXT,
  ip_address TEXT,
  refresh_token_hash TEXT,
  is_revoked INTEGER NOT NULL DEFAULT 0,
  last_active_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  revoked_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_revoked, expires_at);
