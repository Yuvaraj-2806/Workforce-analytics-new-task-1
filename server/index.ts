import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRouter from './routes/auth.js';
import apiRouter from './routes/api.js';
import { initDatabase, db } from './db/database.js';
import { runMigrations } from './db/migrator.js';
import { seedAuthData } from './db/authSeed.js';
import { seedDatabase } from './db/seed.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// ── Security Headers (Helmet) ───────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'", CORS_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// ── Strict CORS with credentials support for HttpOnly cookies
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      const allowedOrigins = [
        CORS_ORIGIN,
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5000',
      ];
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked request from origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With'],
  })
);

// ── Parsers ────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// ── Request Logger ─────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[API] ${req.method} ${req.url}`);
  next();
});

// ── Initialize Database & Run Migrations ───────────────────
initDatabase();
runMigrations();

// Initialize workforce analytics and auth seeding
const employeeCount = (db.prepare('SELECT COUNT(*) as count FROM employees').get() as { count: number }).count;
if (employeeCount === 0) {
  console.log('Database empty. Running initial workforce seed...');
  seedDatabase();
}

// Seed or update authentication roles, permissions, and demo users
seedAuthData();

// ── Mount Routes ───────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api', apiRouter);

// ── Centralized Error Handler ──────────────────────────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: err.message || 'Internal server error',
    code: err.code || 'SERVER_ERROR',
  });
});

// ── Server Listen ──────────────────────────────────────────
const isDirectRun = process.argv[1] && (process.argv[1].endsWith('server/index.ts') || process.argv[1].endsWith('server\\index.ts'));
if (process.env.NODE_ENV !== 'test' && isDirectRun) {
  app.listen(PORT, () => {
    console.log(`\n🚀 Stackly Workforce Analytics Backend running at http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔐 Auth API:     http://localhost:${PORT}/api/auth`);
    console.log(`📈 Analytics API: http://localhost:${PORT}/api/kpi\n`);
  });
}

export default app;
