import crypto from 'crypto';
import { db } from '../db/database.js';
import type { UserSession } from '../types/auth.js';

const SESSION_EXPIRY_DAYS = parseInt(process.env.SESSION_EXPIRY_DAYS || '7', 10);

function parseDeviceInfo(userAgent?: string): string {
  if (!userAgent) return 'Unknown Device';
  if (/mobile/i.test(userAgent)) return 'Mobile Browser';
  if (/macintosh|mac os x/i.test(userAgent)) return 'macOS Workstation';
  if (/windows/i.test(userAgent)) return 'Windows PC';
  if (/linux/i.test(userAgent)) return 'Linux Workstation';
  if (/postman/i.test(userAgent)) return 'API Client (Postman)';
  if (/curl/i.test(userAgent)) return 'CLI (curl)';
  return 'Web Browser';
}

export const sessionService = {
  createSession(
    userId: number,
    ipAddress?: string,
    userAgent?: string,
    refreshTokenHash?: string
  ): UserSession {
    const sessionId = crypto.randomUUID();
    const device = parseDeviceInfo(userAgent);
    const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();

    db.prepare(`
      INSERT INTO user_sessions (
        session_id, user_id, device, user_agent, ip_address,
        refresh_token_hash, is_revoked, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    `).run(
      sessionId,
      userId,
      device,
      userAgent || null,
      ipAddress || null,
      refreshTokenHash || null,
      expiresAt
    );

    const session = db.prepare(`SELECT * FROM user_sessions WHERE session_id = ?`).get(sessionId) as UserSession;
    return session;
  },

  getUserSessions(userId: number, currentSessionId?: string): UserSession[] {
    const sessions = db.prepare(`
      SELECT * FROM user_sessions
      WHERE user_id = ? AND is_revoked = 0 AND expires_at > CURRENT_TIMESTAMP
      ORDER BY last_active_at DESC
    `).all(userId) as UserSession[];

    return sessions.map((s) => ({
      ...s,
      is_current: s.session_id === currentSessionId,
    }));
  },

  isSessionValid(sessionId: string): boolean {
    const session = db.prepare(`
      SELECT id FROM user_sessions
      WHERE session_id = ? AND is_revoked = 0 AND expires_at > CURRENT_TIMESTAMP
    `).get(sessionId);

    return Boolean(session);
  },

  touchSession(sessionId: string): void {
    db.prepare(`
      UPDATE user_sessions
      SET last_active_at = CURRENT_TIMESTAMP
      WHERE session_id = ? AND is_revoked = 0
    `).run(sessionId);
  },

  revokeSession(sessionId: string, userId?: number): boolean {
    let query = `UPDATE user_sessions SET is_revoked = 1, revoked_at = CURRENT_TIMESTAMP WHERE session_id = ?`;
    const params: any[] = [sessionId];

    if (userId !== undefined) {
      query += ` AND user_id = ?`;
      params.push(userId);
    }

    const result = db.prepare(query).run(...params);
    if (result.changes > 0) {
      // Also revoke any refresh token linked to this session
      db.prepare(`
        UPDATE refresh_tokens
        SET is_revoked = 1, revoked_at = CURRENT_TIMESTAMP
        WHERE token_hash IN (
          SELECT refresh_token_hash FROM user_sessions WHERE session_id = ? AND refresh_token_hash IS NOT NULL
        )
      `).run(sessionId);
      return true;
    }
    return false;
  },

  revokeAllUserSessions(userId: number, exceptSessionId?: string): number {
    let query = `UPDATE user_sessions SET is_revoked = 1, revoked_at = CURRENT_TIMESTAMP WHERE user_id = ? AND is_revoked = 0`;
    const params: any[] = [userId];

    if (exceptSessionId) {
      query += ` AND session_id != ?`;
      params.push(exceptSessionId);
    }

    const result = db.prepare(query).run(...params);

    // Also revoke all refresh tokens for this user
    db.prepare(`
      UPDATE refresh_tokens
      SET is_revoked = 1, revoked_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND is_revoked = 0
    `).run(userId);

    return result.changes;
  },

  linkRefreshTokenToSession(sessionId: string, tokenHash: string): void {
    db.prepare(`
      UPDATE user_sessions
      SET refresh_token_hash = ?
      WHERE session_id = ?
    `).run(tokenHash, sessionId);
  },
};
