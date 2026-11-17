import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.resolve(__dirname, '..', 'migrations');

export interface MigrationStatus {
  name: string;
  applied: boolean;
  executedAt?: string;
}

export function initMigrationTable(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      migration_name TEXT NOT NULL UNIQUE,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export function getMigrationFiles(): string[] {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    return [];
  }
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();
}

export function getExecutedMigrations(): Map<string, string> {
  initMigrationTable();
  const rows = db.prepare('SELECT migration_name, executed_at FROM schema_migrations').all() as {
    migration_name: string;
    executed_at: string;
  }[];
  const map = new Map<string, string>();
  for (const row of rows) {
    map.set(row.migration_name, row.executed_at);
  }
  return map;
}

export function getMigrationStatus(): MigrationStatus[] {
  const files = getMigrationFiles();
  const executed = getExecutedMigrations();
  return files.map((file) => ({
    name: file,
    applied: executed.has(file),
    executedAt: executed.get(file),
  }));
}

export function runMigrations(): { executed: string[]; skipped: string[] } {
  initMigrationTable();
  const files = getMigrationFiles();
  const executedMap = getExecutedMigrations();
  const executed: string[] = [];
  const skipped: string[] = [];

  console.log(`\n📦 Running database migrations from ${MIGRATIONS_DIR}...`);

  for (const file of files) {
    if (executedMap.has(file)) {
      skipped.push(file);
      continue;
    }

    const filePath = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(filePath, 'utf-8');

    // Run inside a transaction
    const executeTx = db.transaction(() => {
      db.exec(sql);
      db.prepare('INSERT INTO schema_migrations (migration_name) VALUES (?)').run(file);
    });

    try {
      executeTx();
      console.log(`  ✅ Applied migration: ${file}`);
      executed.push(file);
    } catch (err: any) {
      console.error(`  ❌ Failed to execute migration ${file}:`, err.message);
      throw err;
    }
  }

  if (executed.length === 0) {
    console.log('  ✨ All migrations up to date. No new migrations applied.');
  } else {
    console.log(`  🎉 Successfully applied ${executed.length} migration(s).`);
  }

  return { executed, skipped };
}

// Allow direct execution: tsx server/db/migrator.ts
if (process.argv[1] && process.argv[1].endsWith('migrator.ts')) {
  const cmd = process.argv[2] || 'up';
  if (cmd === 'status') {
    const statuses = getMigrationStatus();
    console.log('\n📋 Migration Status:');
    console.table(statuses);
  } else {
    runMigrations();
  }
}
