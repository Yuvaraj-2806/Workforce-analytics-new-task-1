import { Router } from 'express';
import { dashboardController } from '../controllers/dashboardController';
import { employeeController } from '../controllers/employeeController';
import { filterController } from '../controllers/filterController';
import { seedDatabase } from '../db/seed';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    platform: 'Stackly Workforce Analytics API',
    version: '2.0.0',
    database: 'SQLite (WAL mode)',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Dashboard Analytics & Charts
router.get('/kpi', (req, res) => dashboardController.getKpis(req, res));
router.get('/charts/attendance-trend', (req, res) => dashboardController.getAttendanceTrend(req, res));
router.get('/charts/department-distribution', (req, res) => dashboardController.getDepartmentDistribution(req, res));
router.get('/charts/workforce-segments', (req, res) => dashboardController.getWorkforceSegments(req, res));

// Employees with search, sort, filter, and pagination
router.get('/employees', (req, res) => employeeController.getEmployees(req, res));

// Filter options
router.get('/filters/options', (req, res) => filterController.getOptions(req, res));

// Database re-seed endpoint
router.post('/seed', (_req, res) => {
  try {
    seedDatabase();
    res.json({ success: true, message: 'Database successfully seeded with realistic workforce records.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
