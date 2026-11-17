import { Router } from 'express';
import { dashboardController } from '../controllers/dashboardController.js';
import { employeeController } from '../controllers/employeeController.js';
import { filterController } from '../controllers/filterController.js';
import { authenticateJWT, requireRole, requirePermission, verifyEmployeeOwnership } from '../middleware/auth.js';
import { apiRateLimiter } from '../middleware/rateLimiter.js';
import { seedDatabase } from '../db/seed.js';

const router = Router();

// Apply rate limiting to all API routes
router.use(apiRateLimiter);

// ── Public Health Check ────────────────────────────────────
router.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    platform: 'Stackly Workforce Analytics Platform',
    version: '3.0.0',
    database: 'SQLite (WAL mode + PRAGMA foreign_keys=ON)',
    security: 'JWT + Refresh Token Rotation + AES-256 TOTP MFA + RBAC',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ── Protected Dashboard Analytics & Charts ─────────────────
router.get('/kpi',
  authenticateJWT,
  requirePermission('view:kpi'),
  (req, res) => dashboardController.getKpis(req, res)
);

router.get('/charts/attendance-trend',
  authenticateJWT,
  requirePermission('view:charts'),
  (req, res) => dashboardController.getAttendanceTrend(req, res)
);

router.get('/charts/department-distribution',
  authenticateJWT,
  requirePermission('view:charts'),
  (req, res) => dashboardController.getDepartmentDistribution(req, res)
);

router.get('/charts/workforce-segments',
  authenticateJWT,
  requirePermission('view:charts'),
  (req, res) => dashboardController.getWorkforceSegments(req, res)
);

// ── Employees (with Team / Company-wide RBAC & IDOR guard) ──
router.get('/employees',
  authenticateJWT,
  requirePermission('view:team'),
  (req, res) => employeeController.getEmployees(req, res)
);

router.get('/employees/:id',
  authenticateJWT,
  verifyEmployeeOwnership('id'),
  (req, res) => employeeController.getEmployeeById(req, res)
);

// ── Personal Employee Profile & Attendance ─────────────────
router.get('/my-profile',
  authenticateJWT,
  requirePermission('view:own_profile'),
  (req, res) => employeeController.getMyProfile(req, res)
);

router.get('/my-attendance',
  authenticateJWT,
  requirePermission('view:attendance'),
  (req, res) => employeeController.getMyAttendance(req, res)
);

// ── Filter Options ──────────────────────────────────────────
router.get('/filters/options',
  authenticateJWT,
  (req, res) => filterController.getOptions(req, res)
);

// ── Admin: Database Re-seed ─────────────────────────────────
router.post('/seed',
  authenticateJWT,
  requireRole('admin'),
  requirePermission('seed:database'),
  (_req, res) => {
    try {
      seedDatabase();
      res.json({ success: true, message: 'Database successfully seeded with realistic workforce records.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

export default router;
