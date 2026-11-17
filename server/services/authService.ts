import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { db } from '../db/database.js';
import { hashString } from '../utils/crypto.js';
import type { AuthUser, AuditLogParams, DbUser, JwtPayload } from '../types/auth.js';

dotenv.config();

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const ACCESS_TOKEN_EXPIRY = (process.env.JWT_ACCESS_EXPIRY || '15m') as string;
const REFRESH_TOKEN_EXPIRY = (process.env.JWT_REFRESH_EXPIRY || '7d') as string;
const JWT_ISSUER = process.env.JWT_ISSUER || 'WFA-Auth';
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'WFA-Client';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
const MAX_FAILED_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10);
const LOCKOUT_DURATION_MS = parseInt(process.env.LOCKOUT_DURATION_MINUTES || '15', 10) * 60 * 1000;

export const authService = {
  // ─────────────────────────── Password ───────────────────────────

  async hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, BCRYPT_ROUNDS);
  },

  hashPasswordSync(plain: string): string {
    return bcrypt.hashSync(plain, BCRYPT_ROUNDS);
  },

  async verifyPassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  },

  // ─────────────────────────── JWT Tokens ───────────────────────────

  generateAccessToken(user: AuthUser, sessionId?: string): string {
    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
      permissions: user.permissions,
      departmentId: user.departmentId,
      departmentName: user.departmentName,
      sessionId: sessionId || user.sessionId,
    };
    return jwt.sign(payload, JWT_ACCESS_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRY as any,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
  },

  verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, JWT_ACCESS_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }) as JwtPayload;
  },

  generateRefreshToken(userId: number, email: string, familyId: string): string {
    return jwt.sign({ id: userId, email, familyId, jti: crypto.randomUUID() }, JWT_REFRESH_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRY as any,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
  },

  storeRefreshToken(userId: number, token: string, familyId: string): void {
    const tokenHash = hashString(token);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    db.prepare(`
      INSERT INTO refresh_tokens (user_id, token_hash, family_id, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(userId, tokenHash, familyId, expiresAt);
  },

  revokeRefreshToken(token: string): void {
    const tokenHash = hashString(token);
    db.prepare(`
      UPDATE refresh_tokens
      SET is_revoked = 1, revoked_at = CURRENT_TIMESTAMP
      WHERE token_hash = ?
    `).run(tokenHash);
  },

  revokeTokenFamily(familyId: string): void {
    db.prepare(`
      UPDATE refresh_tokens
      SET is_revoked = 1, revoked_at = CURRENT_TIMESTAMP
      WHERE family_id = ? AND is_revoked = 0
    `).run(familyId);
  },

  revokeAllUserTokens(userId: number): void {
    db.prepare(`
      UPDATE refresh_tokens
      SET is_revoked = 1, revoked_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND is_revoked = 0
    `).run(userId);
  },

  /**
   * Verifies a refresh token and handles Token Rotation & Reuse Detection.
   * If reuse of an already-revoked token is detected, revokes the ENTIRE token family.
   */
  verifyAndRotateRefreshToken(token: string): {
    valid: boolean;
    reuseDetected?: boolean;
    userId?: number;
    email?: string;
    newRefreshToken?: string;
    familyId?: string;
  } {
    try {
      const payload = jwt.verify(token, JWT_REFRESH_SECRET, {
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
      }) as { id: number; email: string; familyId?: string };

      const tokenHash = hashString(token);
      const stored = db.prepare(`SELECT * FROM refresh_tokens WHERE token_hash = ?`).get(tokenHash) as any;

      if (!stored) {
        return { valid: false };
      }

      // 🚨 CRITICAL: TOKEN REUSE DETECTION
      if (stored.is_revoked === 1) {
        console.warn(`🚨 REUSE DETECTED for refresh token! Revoking entire family: ${stored.family_id}`);
        // Revoke the entire family
        this.revokeTokenFamily(stored.family_id);
        return {
          valid: false,
          reuseDetected: true,
          userId: payload.id,
          email: payload.email,
          familyId: stored.family_id,
        };
      }

      // Check expiration
      if (new Date(stored.expires_at).getTime() < Date.now()) {
        this.revokeRefreshToken(token);
        return { valid: false };
      }

      // Normal rotation: invalidate used token, issue new one with same familyId
      this.revokeRefreshToken(token);
      const familyId = stored.family_id || crypto.randomUUID();
      const newRefreshToken = this.generateRefreshToken(payload.id, payload.email, familyId);
      this.storeRefreshToken(payload.id, newRefreshToken, familyId);

      return {
        valid: true,
        userId: payload.id,
        email: payload.email,
        newRefreshToken,
        familyId,
      };
    } catch (err: any) {
      console.error('verifyAndRotateRefreshToken error:', err?.message || err);
      return { valid: false };
    }
  },

  // ─────────────────────────── Account Lockout ───────────────────────────

  checkLockout(email: string): void {
    const lockout = db.prepare(`SELECT * FROM account_lockouts WHERE email = ?`).get(email) as any;
    if (!lockout) return;
    if (lockout.failed_attempts >= MAX_FAILED_ATTEMPTS && lockout.locked_until) {
      const lockedUntil = new Date(lockout.locked_until).getTime();
      if (Date.now() < lockedUntil) {
        const remainingMin = Math.ceil((lockedUntil - Date.now()) / 60000);
        throw new Error(`Account locked due to too many failed attempts. Try again in ${remainingMin} minute(s).`);
      }
      db.prepare(`
        UPDATE account_lockouts
        SET failed_attempts = 0, locked_until = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE email = ?
      `).run(email);
    }
  },

  recordFailedAttempt(email: string): { locked: boolean; attemptsLeft: number } {
    const existing = db.prepare(`SELECT * FROM account_lockouts WHERE email = ?`).get(email) as any;
    if (!existing) {
      db.prepare(`
        INSERT INTO account_lockouts (email, failed_attempts, last_attempt_at)
        VALUES (?, 1, CURRENT_TIMESTAMP)
      `).run(email);
      return { locked: false, attemptsLeft: MAX_FAILED_ATTEMPTS - 1 };
    }
    const newCount = existing.failed_attempts + 1;
    const locked = newCount >= MAX_FAILED_ATTEMPTS;
    const lockedUntil = locked ? new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString() : null;
    db.prepare(`
      UPDATE account_lockouts
      SET failed_attempts = ?, locked_until = ?, last_attempt_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE email = ?
    `).run(newCount, lockedUntil, email);
    return { locked, attemptsLeft: Math.max(0, MAX_FAILED_ATTEMPTS - newCount) };
  },

  clearFailedAttempts(email: string): void {
    db.prepare(`
      UPDATE account_lockouts
      SET failed_attempts = 0, locked_until = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE email = ?
    `).run(email);
  },

  // ─────────────────────────── Audit Logging ───────────────────────────

  logAuditEvent(params: AuditLogParams): void {
    try {
      db.prepare(`
        INSERT INTO auth_audit_logs (
          user_id, event_type, resource, action, ip_address, user_agent, status, details
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        params.userId ?? null,
        params.eventType,
        params.resource ?? null,
        params.action ?? null,
        params.ipAddress ?? null,
        params.userAgent ?? null,
        params.status ?? 'SUCCESS',
        params.details ?? null
      );
    } catch (err: any) {
      console.error('Failed to write audit log:', err.message);
    }
  },

  // ─────────────────────────── User Helpers ───────────────────────────

  getUserWithPermissions(emailOrId: string | number): AuthUser | null {
    const clause = typeof emailOrId === 'string' ? 'u.email = ?' : 'u.id = ?';
    const user = db.prepare(`
      SELECT u.id, u.email, u.role, u.employee_id, u.mfa_enabled,
             e.department_id, d.name AS department_name
      FROM users u
      LEFT JOIN employees e ON u.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE ${clause} AND u.is_active = 1
    `).get(emailOrId) as any;
    if (!user) return null;

    const permissions = (
      db.prepare(`
        SELECT permission_name FROM role_permissions WHERE role_name = ?
      `).all(user.role) as any[]
    ).map((r) => r.permission_name);

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employee_id,
      permissions,
      departmentId: user.department_id ?? null,
      departmentName: user.department_name ?? null,
    };
  },
};
