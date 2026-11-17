import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService.js';
import { sessionService } from '../services/sessionService.js';
import { db } from '../db/database.js';
import type { AuthUser } from '../types/auth.js';

export interface AuthRequest extends Request {
  user?: AuthUser;
}

/**
 * Validates JWT access token from Authorization header (Bearer <token>).
 * Validates issuer, audience, expiration, session validity, and user active status.
 */
export function authenticateJWT(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Authorization token required.', code: 'UNAUTHORIZED' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = authService.verifyAccessToken(token);

    // If session ID is present in token, ensure session has not been revoked
    if (payload.sessionId) {
      const isValid = sessionService.isSessionValid(payload.sessionId);
      if (!isValid) {
        res.status(401).json({
          success: false,
          error: 'Session has been revoked or expired. Please log in again.',
          code: 'SESSION_REVOKED',
        });
        return;
      }
      sessionService.touchSession(payload.sessionId);
    }

    // Check user is still active in database
    const dbUser = db.prepare('SELECT is_active FROM users WHERE id = ?').get(payload.id) as { is_active: number } | undefined;
    if (!dbUser || dbUser.is_active !== 1) {
      res.status(401).json({
        success: false,
        error: 'Account has been deactivated.',
        code: 'ACCOUNT_DEACTIVATED',
      });
      return;
    }

    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      employeeId: payload.employeeId,
      permissions: payload.permissions,
      departmentId: payload.departmentId,
      departmentName: payload.departmentName,
      sessionId: payload.sessionId,
    };

    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ success: false, error: 'Access token expired.', code: 'TOKEN_EXPIRED' });
    } else {
      res.status(401).json({ success: false, error: 'Invalid or malformed access token.', code: 'TOKEN_INVALID' });
    }
  }
}

/**
 * Enforces Role-Based Access Control (RBAC).
 */
export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, error: 'Not authenticated.' });
      return;
    }

    if (!roles.includes(user.role)) {
      authService.logAuditEvent({
        userId: user.id,
        eventType: 'access_denied',
        resource: req.path,
        action: req.method,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string,
        status: 'BLOCKED',
        details: `Required roles: [${roles.join(', ')}]. User role: ${user.role}.`,
      });

      res.status(403).json({
        success: false,
        error: 'Forbidden: You do not have permission to access this resource.',
        requiredRoles: roles,
        yourRole: user.role,
      });
      return;
    }

    next();
  };
}

/**
 * Enforces Permission-Based Access Control.
 */
export function requirePermission(permission: string) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, error: 'Not authenticated.' });
      return;
    }

    if (!user.permissions.includes(permission)) {
      authService.logAuditEvent({
        userId: user.id,
        eventType: 'access_denied',
        resource: req.path,
        action: req.method,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string,
        status: 'BLOCKED',
        details: `Required permission: ${permission}. User role: ${user.role}.`,
      });

      res.status(403).json({
        success: false,
        error: 'Forbidden: Insufficient permissions for this action.',
        requiredPermission: permission,
      });
      return;
    }

    next();
  };
}

/**
 * Strict IDOR (Insecure Direct Object Reference) Protection:
 * Verifies that the authenticated user owns or has legitimate managerial jurisdiction
 * over the specified employee ID in `req.params[paramName]`.
 */
export function verifyEmployeeOwnership(paramName: string = 'id') {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, error: 'Not authenticated.' });
      return;
    }

    const targetEmployeeId = parseInt(req.params[paramName], 10);
    if (isNaN(targetEmployeeId)) {
      res.status(400).json({ success: false, error: 'Invalid employee ID format.' });
      return;
    }

    // Admin and HR have company-wide authority
    if (user.role === 'admin' || user.role === 'hr') {
      next();
      return;
    }

    // Find the target employee's department
    const targetEmp = db.prepare(`SELECT id, department_id FROM employees WHERE id = ?`).get(targetEmployeeId) as
      | { id: number; department_id: number }
      | undefined;

    if (!targetEmp) {
      // Return 404 to avoid exposing whether ID exists
      res.status(404).json({ success: false, error: 'Employee not found.' });
      return;
    }

    // Managers and Team Leads: only access within their assigned department
    if (user.role === 'manager' || user.role === 'team_lead') {
      if (user.departmentId && targetEmp.department_id === user.departmentId) {
        next();
        return;
      }

      // IDOR Attempt Detected!
      authService.logAuditEvent({
        userId: user.id,
        eventType: 'idor_attempt',
        resource: req.path,
        action: req.method,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string,
        status: 'BLOCKED',
        details: `Manager/Lead (Dept ${user.departmentId}) attempted unauthorized access to employee ${targetEmployeeId} (Dept ${targetEmp.department_id})`,
      });

      res.status(403).json({
        success: false,
        error: 'Forbidden: You can only access employees within your department.',
      });
      return;
    }

    // Regular Employee: can ONLY access their own employee record
    if (user.role === 'employee') {
      if (user.employeeId && user.employeeId === targetEmployeeId) {
        next();
        return;
      }

      // IDOR Attempt Detected!
      authService.logAuditEvent({
        userId: user.id,
        eventType: 'idor_attempt',
        resource: req.path,
        action: req.method,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] as string,
        status: 'BLOCKED',
        details: `Employee ${user.employeeId} attempted unauthorized access to employee record ${targetEmployeeId}`,
      });

      res.status(403).json({
        success: false,
        error: 'Forbidden: You are only authorized to access your own employee profile.',
      });
      return;
    }

    res.status(403).json({ success: false, error: 'Access denied.' });
  };
}

/**
 * CSRF Protection for state-changing requests using cookie authentication.
 * Checks for either `X-CSRF-Token` header matching the csrf cookie,
 * or standard custom header `X-Requested-With` to protect against cross-origin form submission.
 */
export function verifyCsrf(req: Request, res: Response, next: NextFunction): void {
  // Safe HTTP methods do not require CSRF tokens
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next();
    return;
  }

  const csrfHeader = req.headers['x-csrf-token'];
  const requestedWith = req.headers['x-requested-with'];
  const csrfCookie = req.cookies?.['wfa_csrf'];

  // Accept either matching double-submit cookie or legitimate client header
  if (csrfHeader && csrfCookie && csrfHeader === csrfCookie) {
    next();
    return;
  }

  if (requestedWith === 'XMLHttpRequest' || req.headers.authorization) {
    // Standard API clients / Bearer token requests are naturally CSRF-safe
    next();
    return;
  }

  res.status(403).json({
    success: false,
    error: 'CSRF token missing or invalid.',
    code: 'CSRF_INVALID',
  });
}
