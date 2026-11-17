import { Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db/database.js';
import { authService } from '../services/authService.js';
import { sessionService } from '../services/sessionService.js';
import { mfaService } from '../services/mfaService.js';
import type { AuthRequest } from '../middleware/auth.js';
import type {
  DbUser,
  LoginRequest,
  MFAVerifyRequest,
  ChangePasswordRequest,
} from '../types/auth.js';

// Cookie options for secure HttpOnly refresh token
const isProd = process.env.NODE_ENV === 'production';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd, // set to true in HTTPS production
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const authController = {
  // ─────────────────────────── POST /api/auth/login ───────────────────────────
  async login(req: Request, res: Response): Promise<void> {
    const { email, password }: LoginRequest = req.body;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    if (!email?.trim() || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required.' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Check account lockout
    try {
      authService.checkLockout(normalizedEmail);
    } catch (err: any) {
      authService.logAuditEvent({
        eventType: 'account_locked',
        resource: '/api/auth/login',
        action: 'LOGIN',
        ipAddress: ip,
        userAgent,
        status: 'BLOCKED',
        details: err.message,
      });
      res.status(429).json({ success: false, error: err.message, code: 'ACCOUNT_LOCKED' });
      return;
    }

    // 2. Fetch user
    const user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(normalizedEmail) as DbUser | undefined;

    if (!user || user.is_active !== 1) {
      authService.recordFailedAttempt(normalizedEmail);
      authService.logAuditEvent({
        eventType: 'login_failed',
        resource: '/api/auth/login',
        action: 'LOGIN',
        ipAddress: ip,
        userAgent,
        status: 'FAILURE',
        details: `Account not found or inactive: ${normalizedEmail}`,
      });
      res.status(401).json({ success: false, error: 'Invalid email or password.' });
      return;
    }

    // 3. Verify password
    const passwordValid = await authService.verifyPassword(password, user.password_hash);
    if (!passwordValid) {
      const { locked, attemptsLeft } = authService.recordFailedAttempt(normalizedEmail);
      authService.logAuditEvent({
        userId: user.id,
        eventType: 'login_failed',
        resource: '/api/auth/login',
        action: 'LOGIN',
        ipAddress: ip,
        userAgent,
        status: 'FAILURE',
        details: `Incorrect password. Attempts left: ${attemptsLeft}`,
      });

      if (locked) {
        authService.logAuditEvent({
          userId: user.id,
          eventType: 'account_locked',
          resource: '/api/auth/login',
          action: 'LOCKOUT',
          ipAddress: ip,
          userAgent,
          status: 'BLOCKED',
          details: 'Maximum failed attempts reached. Account locked for 15 minutes.',
        });
        res.status(429).json({
          success: false,
          error: 'Account locked due to too many failed attempts. Try again in 15 minutes.',
          code: 'ACCOUNT_LOCKED',
        });
      } else {
        res.status(401).json({
          success: false,
          error: `Invalid email or password. ${attemptsLeft} attempt(s) remaining.`,
          attemptsLeft,
        });
      }
      return;
    }

    // Successful password verification
    authService.clearFailedAttempts(normalizedEmail);

    // 4. Check if MFA is required
    if (user.mfa_enabled && user.mfa_verified) {
      res.json({
        success: true,
        requiresMFA: true,
        userId: user.id,
        email: user.email,
        message: 'Two-factor authentication required. Enter your Google Authenticator code or backup recovery code.',
      });
      return;
    }

    // 5. Complete login: create session & issue tokens
    const authUser = authService.getUserWithPermissions(user.email)!;
    const session = sessionService.createSession(authUser.id, ip, userAgent);
    const familyId = crypto.randomUUID();
    const accessToken = authService.generateAccessToken(authUser, session.session_id);
    const refreshToken = authService.generateRefreshToken(authUser.id, authUser.email, familyId);

    authService.storeRefreshToken(authUser.id, refreshToken, familyId);
    sessionService.linkRefreshTokenToSession(session.session_id, crypto.createHash('sha256').update(refreshToken).digest('hex'));

    // Set HttpOnly refresh token cookie & CSRF cookie
    const csrfToken = crypto.randomBytes(24).toString('hex');
    res.cookie('wfa_refresh_token', refreshToken, COOKIE_OPTIONS);
    res.cookie('wfa_csrf', csrfToken, { ...COOKIE_OPTIONS, httpOnly: false }); // readable by client JS for X-CSRF-Token

    authService.logAuditEvent({
      userId: authUser.id,
      eventType: 'login_success',
      resource: '/api/auth/login',
      action: 'LOGIN',
      ipAddress: ip,
      userAgent,
      status: 'SUCCESS',
      details: `Logged in with role [${authUser.role}]. Session: ${session.session_id}`,
    });

    res.json({
      success: true,
      requiresMFA: false,
      accessToken,
      refreshToken, // Also returned in body for non-browser / test clients
      csrfToken,
      session: {
        sessionId: session.session_id,
        device: session.device,
        expiresAt: session.expires_at,
      },
      user: {
        id: authUser.id,
        email: authUser.email,
        role: authUser.role,
        employeeId: authUser.employeeId,
        permissions: authUser.permissions,
        departmentId: authUser.departmentId,
        departmentName: authUser.departmentName,
      },
    });
  },

  // ─────────────────────────── POST /api/auth/mfa/verify ───────────────────────────
  async verifyMFA(req: Request, res: Response): Promise<void> {
    const { userId, token, recoveryCode }: MFAVerifyRequest = req.body;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    if (!userId || (!token && !recoveryCode)) {
      res.status(400).json({ success: false, error: 'User ID and verification code or recovery code are required.' });
      return;
    }

    const codeToVerify = (token || recoveryCode) as string;
    const verification = mfaService.verifyCode(userId, codeToVerify);

    if (!verification.valid) {
      authService.logAuditEvent({
        userId,
        eventType: 'mfa_failed',
        resource: '/api/auth/mfa/verify',
        action: 'MFA_VERIFY',
        ipAddress: ip,
        userAgent,
        status: 'FAILURE',
        details: 'Invalid TOTP code or recovery code presented.',
      });
      res.status(401).json({
        success: false,
        error: 'Invalid or expired MFA code. Please check your authenticator app or recovery codes.',
      });
      return;
    }

    // Success!
    const authUser = authService.getUserWithPermissions(userId)!;
    const session = sessionService.createSession(authUser.id, ip, userAgent);
    const familyId = crypto.randomUUID();
    const accessToken = authService.generateAccessToken(authUser, session.session_id);
    const refreshToken = authService.generateRefreshToken(authUser.id, authUser.email, familyId);

    authService.storeRefreshToken(authUser.id, refreshToken, familyId);
    sessionService.linkRefreshTokenToSession(session.session_id, crypto.createHash('sha256').update(refreshToken).digest('hex'));

    const csrfToken = crypto.randomBytes(24).toString('hex');
    res.cookie('wfa_refresh_token', refreshToken, COOKIE_OPTIONS);
    res.cookie('wfa_csrf', csrfToken, { ...COOKIE_OPTIONS, httpOnly: false });

    const auditEvent = verification.method === 'recovery_code' ? 'recovery_code_used' : 'mfa_verified';
    authService.logAuditEvent({
      userId: authUser.id,
      eventType: auditEvent,
      resource: '/api/auth/mfa/verify',
      action: 'MFA_VERIFY',
      ipAddress: ip,
      userAgent,
      status: 'SUCCESS',
      details: `MFA passed via ${verification.method}. New session: ${session.session_id}`,
    });

    res.json({
      success: true,
      accessToken,
      refreshToken,
      csrfToken,
      session: {
        sessionId: session.session_id,
        device: session.device,
        expiresAt: session.expires_at,
      },
      user: {
        id: authUser.id,
        email: authUser.email,
        role: authUser.role,
        employeeId: authUser.employeeId,
        permissions: authUser.permissions,
        departmentId: authUser.departmentId,
        departmentName: authUser.departmentName,
      },
    });
  },

  // ─────────────────────────── POST /api/auth/refresh ───────────────────────────
  async refresh(req: Request, res: Response): Promise<void> {
    // Check both cookie and JSON body
    const token = req.cookies?.wfa_refresh_token || req.body?.refreshToken;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    if (!token) {
      res.status(400).json({ success: false, error: 'Refresh token is required.' });
      return;
    }

    const result = authService.verifyAndRotateRefreshToken(token);

    if (result.reuseDetected) {
      // 🚨 CRITICAL: Refresh Token Reuse Detected!
      authService.logAuditEvent({
        userId: result.userId,
        eventType: 'token_reuse_detected',
        resource: '/api/auth/refresh',
        action: 'TOKEN_ROTATION',
        ipAddress: ip,
        userAgent,
        status: 'BLOCKED',
        details: `Token reuse detected for family ${result.familyId}. Entire family revoked.`,
      });

      // Clear cookie
      res.clearCookie('wfa_refresh_token', { path: '/' });
      res.clearCookie('wfa_csrf', { path: '/' });

      res.status(403).json({
        success: false,
        error: 'Security alert: Refresh token reuse detected. All active tokens have been revoked for your safety. Please log in again.',
        code: 'TOKEN_REUSE_DETECTED',
      });
      return;
    }

    if (!result.valid || !result.email || !result.newRefreshToken) {
      res.clearCookie('wfa_refresh_token', { path: '/' });
      res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token. Please log in again.',
        code: 'REFRESH_INVALID',
      });
      return;
    }

    const authUser = authService.getUserWithPermissions(result.email);
    if (!authUser) {
      res.status(401).json({ success: false, error: 'Account not found or deactivated.' });
      return;
    }

    const newAccessToken = authService.generateAccessToken(authUser);
    const csrfToken = crypto.randomBytes(24).toString('hex');

    res.cookie('wfa_refresh_token', result.newRefreshToken, COOKIE_OPTIONS);
    res.cookie('wfa_csrf', csrfToken, { ...COOKIE_OPTIONS, httpOnly: false });

    authService.logAuditEvent({
      userId: authUser.id,
      eventType: 'token_refresh',
      resource: '/api/auth/refresh',
      action: 'TOKEN_ROTATION',
      ipAddress: ip,
      userAgent,
      status: 'SUCCESS',
      details: 'Access token renewed with refresh token rotation.',
    });

    res.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: result.newRefreshToken,
      csrfToken,
    });
  },

  // ─────────────────────────── POST /api/auth/logout ───────────────────────────
  async logout(req: AuthRequest, res: Response): Promise<void> {
    const token = req.cookies?.wfa_refresh_token || req.body?.refreshToken;
    const user = req.user;

    if (token) {
      authService.revokeRefreshToken(token);
    }

    if (user?.sessionId) {
      sessionService.revokeSession(user.sessionId, user.id);
    }

    res.clearCookie('wfa_refresh_token', { path: '/' });
    res.clearCookie('wfa_csrf', { path: '/' });

    if (user) {
      authService.logAuditEvent({
        userId: user.id,
        eventType: 'logout',
        resource: '/api/auth/logout',
        action: 'LOGOUT',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string,
        status: 'SUCCESS',
        details: `Logged out session ${user.sessionId || 'current'}`,
      });
    }

    res.json({ success: true, message: 'Logged out successfully.' });
  },

  // ─────────────────────────── POST /api/auth/logout-all ───────────────────────────
  async logoutAll(req: AuthRequest, res: Response): Promise<void> {
    const user = req.user!;
    const revokedCount = sessionService.revokeAllUserSessions(user.id);
    authService.revokeAllUserTokens(user.id);

    res.clearCookie('wfa_refresh_token', { path: '/' });
    res.clearCookie('wfa_csrf', { path: '/' });

    authService.logAuditEvent({
      userId: user.id,
      eventType: 'logout_all',
      resource: '/api/auth/logout-all',
      action: 'LOGOUT_ALL',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
      status: 'SUCCESS',
      details: `Revoked all ${revokedCount} sessions and tokens across all devices.`,
    });

    res.json({
      success: true,
      message: `Successfully logged out from all devices (${revokedCount} active session(s) terminated).`,
    });
  },

  // ─────────────────────────── GET /api/auth/sessions ───────────────────────────
  getSessions(req: AuthRequest, res: Response): void {
    const user = req.user!;
    const sessions = sessionService.getUserSessions(user.id, user.sessionId);
    res.json({
      success: true,
      data: sessions,
    });
  },

  // ─────────────────────────── DELETE /api/auth/sessions/:sessionId ───────────────────────────
  revokeSession(req: AuthRequest, res: Response): void {
    const user = req.user!;
    const { sessionId } = req.params;

    if (!sessionId) {
      res.status(400).json({ success: false, error: 'Session ID is required.' });
      return;
    }

    // Admin can revoke any session; non-admin can only revoke their own session (IDOR protection!)
    const revoked = sessionService.revokeSession(
      sessionId,
      user.role === 'admin' ? undefined : user.id
    );

    if (!revoked) {
      res.status(404).json({ success: false, error: 'Session not found or already revoked.' });
      return;
    }

    authService.logAuditEvent({
      userId: user.id,
      eventType: 'session_revoked',
      resource: `/api/auth/sessions/${sessionId}`,
      action: 'REVOKE_SESSION',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
      status: 'SUCCESS',
      details: `Session ${sessionId} revoked by ${user.email}`,
    });

    res.json({ success: true, message: 'Session successfully revoked.' });
  },

  // ─────────────────────────── POST /api/auth/mfa/setup ───────────────────────────
  async setupMFA(req: AuthRequest, res: Response): Promise<void> {
    const user = req.user!;
    try {
      const result = await mfaService.setupMFA(user.id, user.email);

      authService.logAuditEvent({
        userId: user.id,
        eventType: 'mfa_setup',
        resource: '/api/auth/mfa/setup',
        action: 'MFA_SETUP',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string,
        status: 'SUCCESS',
        details: 'MFA secret generated and encrypted; recovery codes issued.',
      });

      // Secrets are NOT exposed in plain text in database or logs
      res.json({
        success: true,
        secret: result.secret,
        qrCodeDataUrl: result.qrCodeDataUrl,
        otpAuthUrl: result.otpAuthUrl,
        recoveryCodes: result.recoveryCodes,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // ─────────────────────────── POST /api/auth/mfa/enable ───────────────────────────
  async enableMFA(req: AuthRequest, res: Response): Promise<void> {
    const user = req.user!;
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ success: false, error: '6-digit TOTP code is required to confirm activation.' });
      return;
    }

    const enabled = mfaService.enableMFA(user.id, String(token));
    if (!enabled) {
      res.status(400).json({
        success: false,
        error: 'Invalid verification code. Please scan the QR code again and enter the current 6-digit code.',
      });
      return;
    }

    authService.logAuditEvent({
      userId: user.id,
      eventType: 'mfa_enabled',
      resource: '/api/auth/mfa/enable',
      action: 'MFA_ENABLE',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
      status: 'SUCCESS',
      details: 'Two-factor authentication activated successfully.',
    });

    res.json({
      success: true,
      message: 'MFA enabled successfully! Your account is now protected with Two-Factor Authentication.',
    });
  },

  // ─────────────────────────── POST /api/auth/mfa/disable ───────────────────────────
  async disableMFA(req: AuthRequest, res: Response): Promise<void> {
    const user = req.user!;
    const { password } = req.body;
    const code = req.body.code || req.body.token;

    if (!password || !code) {
      res.status(400).json({
        success: false,
        error: 'Current password and verification code (TOTP or recovery code) are required to disable MFA.',
      });
      return;
    }

    const result = await mfaService.disableMFA(user.id, password, code);
    if (!result.success) {
      authService.logAuditEvent({
        userId: user.id,
        eventType: 'mfa_failed',
        resource: '/api/auth/mfa/disable',
        action: 'MFA_DISABLE',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string,
        status: 'FAILURE',
        details: `Failed attempt to disable MFA: ${result.error}`,
      });
      res.status(401).json({ success: false, error: result.error });
      return;
    }

    authService.logAuditEvent({
      userId: user.id,
      eventType: 'mfa_disabled',
      resource: '/api/auth/mfa/disable',
      action: 'MFA_DISABLE',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
      status: 'SUCCESS',
      details: 'Two-factor authentication disabled and recovery codes purged.',
    });

    res.json({ success: true, message: 'Two-Factor Authentication has been disabled.' });
  },

  // ─────────────────────────── GET /api/auth/me ───────────────────────────
  getMe(req: AuthRequest, res: Response): void {
    const user = req.user!;
    const dbUser = db.prepare(`
      SELECT u.id, u.email, u.role, u.mfa_enabled, u.created_at,
             e.first_name, e.last_name, e.employee_code, e.department_id,
             d.name AS department_name
      FROM users u
      LEFT JOIN employees e ON u.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE u.id = ?
    `).get(user.id) as any;

    if (!dbUser) {
      res.status(404).json({ success: false, error: 'User not found.' });
      return;
    }

    const recoveryCodesLeft = mfaService.getRemainingRecoveryCodesCount(user.id);

    res.json({
      success: true,
      data: {
        ...dbUser,
        permissions: user.permissions,
        fullName: dbUser.first_name ? `${dbUser.first_name} ${dbUser.last_name}` : null,
        recoveryCodesRemaining: recoveryCodesLeft,
      },
    });
  },

  // ─────────────────────────── POST /api/auth/change-password ───────────────────────────
  async changePassword(req: AuthRequest, res: Response): Promise<void> {
    const user = req.user!;
    const { currentPassword, newPassword }: ChangePasswordRequest = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, error: 'Both currentPassword and newPassword are required.' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ success: false, error: 'New password must be at least 8 characters long.' });
      return;
    }

    const dbUser = db.prepare(`SELECT password_hash FROM users WHERE id = ?`).get(user.id) as { password_hash: string };
    const matches = await authService.verifyPassword(currentPassword, dbUser.password_hash);
    if (!matches) {
      res.status(401).json({ success: false, error: 'Current password is incorrect.' });
      return;
    }

    const newHash = await authService.hashPassword(newPassword);
    db.prepare(`UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(newHash, user.id);

    // Invalidate other sessions and tokens for security
    authService.revokeAllUserTokens(user.id);
    sessionService.revokeAllUserSessions(user.id, user.sessionId);

    authService.logAuditEvent({
      userId: user.id,
      eventType: 'password_changed',
      resource: '/api/auth/change-password',
      action: 'CHANGE_PASSWORD',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
      status: 'SUCCESS',
      details: 'Password updated. Other sessions invalidated.',
    });

    res.json({ success: true, message: 'Password changed successfully.' });
  },

  // ─────────────────────────── GET /api/auth/audit-logs (Admin only) ───────────────────────────
  getAuditLogs(req: AuthRequest, res: Response): void {
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limit = Math.min(100, parseInt((req.query.limit as string) || '50', 10));
    const offset = (page - 1) * limit;
    const eventType = req.query.eventType as string | undefined;

    let query = `
      SELECT a.*, u.email, u.role
      FROM auth_audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
    `;
    const params: any[] = [];
    if (eventType) {
      query += ` WHERE a.event_type = ?`;
      params.push(eventType);
    }
    query += ` ORDER BY a.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const logs = db.prepare(query).all(...params);
    const totalCount = (
      db.prepare(`SELECT COUNT(*) as count FROM auth_audit_logs${eventType ? ' WHERE event_type = ?' : ''}`).get(
        ...(eventType ? [eventType] : [])
      ) as any
    ).count;

    res.json({
      success: true,
      data: logs,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  },

  // ─────────────────────────── GET /api/auth/users (Admin only) ───────────────────────────
  getUsers(req: AuthRequest, res: Response): void {
    const users = db.prepare(`
      SELECT u.id, u.email, u.role, u.mfa_enabled, u.is_active, u.created_at,
             e.first_name, e.last_name, e.employee_code, d.name AS department_name
      FROM users u
      LEFT JOIN employees e ON u.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      ORDER BY u.created_at DESC
    `).all();
    res.json({ success: true, data: users });
  },

  // ─────────────────────────── PUT /api/auth/users/:id/role (Admin only) ───────────────────────────
  updateUserRole(req: AuthRequest, res: Response): void {
    const { id } = req.params;
    const { role } = req.body;
    const validRoles = ['admin', 'hr', 'manager', 'team_lead', 'employee'];

    if (!validRoles.includes(role)) {
      res.status(400).json({ success: false, error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
      return;
    }

    const targetUser = db.prepare(`SELECT id, email, role FROM users WHERE id = ?`).get(id) as any;
    if (!targetUser) {
      res.status(404).json({ success: false, error: 'User not found.' });
      return;
    }

    const oldRole = targetUser.role;
    db.prepare(`UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(role, id);

    // Invalidate their sessions to force re-authentication with new role
    authService.revokeAllUserTokens(Number(id));
    sessionService.revokeAllUserSessions(Number(id));

    authService.logAuditEvent({
      userId: req.user!.id,
      eventType: 'role_changed',
      resource: `/api/auth/users/${id}/role`,
      action: 'UPDATE_ROLE',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
      status: 'SUCCESS',
      details: `Role updated for ${targetUser.email}: [${oldRole}] → [${role}]`,
    });

    res.json({ success: true, message: `Role updated to '${role}' successfully.` });
  },
};
