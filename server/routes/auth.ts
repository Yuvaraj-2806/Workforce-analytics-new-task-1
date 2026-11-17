import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { authenticateJWT, requireRole, verifyCsrf } from '../middleware/auth.js';
import { loginRateLimiter, refreshRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// ── Public Authentication Endpoints ────────────────────────
router.post('/login', loginRateLimiter, (req, res) => authController.login(req, res));
router.post('/refresh', refreshRateLimiter, (req, res) => authController.refresh(req, res));
router.post('/mfa/verify', loginRateLimiter, (req, res) => authController.verifyMFA(req, res));

// ── Authenticated User Endpoints ───────────────────────────
router.post('/logout', authenticateJWT, (req, res) => authController.logout(req as any, res));
router.post('/logout-all', authenticateJWT, (req, res) => authController.logoutAll(req as any, res));
router.get('/me', authenticateJWT, (req, res) => authController.getMe(req as any, res));
router.post('/change-password', authenticateJWT, (req, res) => authController.changePassword(req as any, res));

// ── Session Management Endpoints ───────────────────────────
router.get('/sessions', authenticateJWT, (req, res) => authController.getSessions(req as any, res));
router.delete('/sessions/:sessionId', authenticateJWT, (req, res) => authController.revokeSession(req as any, res));

// ── Multi-Factor Authentication (MFA) ──────────────────────
router.post('/mfa/setup', authenticateJWT, (req, res) => authController.setupMFA(req as any, res));
router.post('/mfa/enable', authenticateJWT, (req, res) => authController.enableMFA(req as any, res));
router.post('/mfa/disable', authenticateJWT, (req, res) => authController.disableMFA(req as any, res));

// ── Administrative Endpoints ───────────────────────────────
router.get('/audit-logs', authenticateJWT, requireRole('admin'), (req, res) => authController.getAuditLogs(req as any, res));
router.get('/users', authenticateJWT, requireRole('admin'), (req, res) => authController.getUsers(req as any, res));
router.put('/users/:id/role', authenticateJWT, requireRole('admin'), (req, res) => authController.updateUserRole(req as any, res));

export default router;
