import express from 'express';
import cors from 'cors';
import apiRouter from './routes/api';
import { initDatabase, db } from './db/database';
import { seedDatabase } from './db/seed';

const app = express();
const PORT = process.env.PORT || 5000;

// Enable Cross-Origin Resource Sharing
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Request logger middleware
app.use((req, _res, next) => {
  console.log(`[API] ${req.method} ${req.url}`);
  next();
});

// Initialize database schema
initDatabase();

// Auto-seed if database is empty
const employeeCount = (db.prepare('SELECT COUNT(*) as count FROM employees').get() as { count: number }).count;
if (employeeCount === 0) {
  console.log('Database empty. Running initial seed...');
  seedDatabase();
}

// Mount REST API routes
app.use('/api', apiRouter);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Stackly Workforce Analytics Backend running at http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📈 KPI API: http://localhost:${PORT}/api/kpi`);
});

export default app;
