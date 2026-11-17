-- Migration: 004_create_audit_logs
-- Description: Creates security audit logging table

CREATE TABLE IF NOT EXISTS auth_audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  resource TEXT,
  action TEXT,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'SUCCESS',
  details TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON auth_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event ON auth_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON auth_audit_logs(created_at);
