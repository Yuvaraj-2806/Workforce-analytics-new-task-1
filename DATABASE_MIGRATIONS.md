# SQLite Database Migration System Documentation
## Workforce Analytics Platform (WFA) – Task 3

This document details the SQLite database migration engine, version tracking, schema architecture, and preservation of legacy workforce data.

---

## 1. Migration System Design & Core Principles

The WFA SQLite Migration System (`server/db/migrator.ts`) provides a deterministic, version-controlled schema deployment mechanism:

1. **Strict Version Control:** Every schema modification is written as a sequentially numbered, idempotent `.sql` script inside the `server/migrations/` directory.
2. **Duplicate Execution Prevention:** A dedicated `schema_migrations` table records every applied migration by filename, version identifier, and timestamp. Before running any script, the runner checks whether that script has already been executed.
3. **Foreign Key Integrity:** SQLite disables foreign keys by default. The migration runner explicitly executes `PRAGMA foreign_keys = ON;` on every database connection, ensuring all referential integrity constraints are actively enforced.
4. **Preservation of Existing Tables:** Legacy tables (`departments`, `employees`, `attendance`, `activity_logs`) are strictly preserved. No legacy data was dropped, truncated, or migrated to an external database technology.
5. **Atomic Transactions:** Each migration file is wrapped in an atomic SQLite transaction. If any statement within a migration fails, the entire migration rolls back cleanly.

---

## 2. Migration Registry & Script Details

| # | Migration File | Created Tables & Indexes | Purpose |
|---|---|---|---|
| **001** | `001_create_users.sql` | `users`, `idx_users_email`, `idx_users_role` | Stores registered users, bcrypt password hashes, AES-256-GCM encrypted MFA secrets, active flags, and foreign key link to `employees(id)`. |
| **002** | `002_create_roles_permissions.sql` | `roles`, `permissions`, `role_permissions`, `idx_role_permissions_role` | Stores the 5 system roles (`admin`, `hr`, `manager`, `team_lead`, `employee`), 13 permissions, and role-to-permission mapping with cascade deletes. |
| **003** | `003_create_refresh_tokens.sql` | `refresh_tokens`, `idx_refresh_tokens_hash`, `idx_refresh_tokens_family` | Stores SHA-256 hashes of refresh tokens, `family_id` (UUID), `is_revoked` flag, and expiration timestamps for Token Rotation and Replay Detection. |
| **004** | `004_create_audit_logs.sql` | `auth_audit_logs`, `idx_audit_logs_event`, `idx_audit_logs_created` | Immutable security audit trail recording IP address, User-Agent, event type (`login`, `idor_attempt`, `token_reuse_detected`), and status. |
| **005** | `005_create_account_lockouts.sql` | `account_lockouts`, `idx_account_lockouts_locked` | Tracks consecutive failed login attempts and temporary lockouts (15-minute lock duration) to prevent brute-force password guessing. |
| **006** | `006_create_user_sessions.sql` | `user_sessions`, `idx_user_sessions_user`, `idx_user_sessions_active` | Tracks authenticated multi-device sessions with device fingerprints, creation/expiry timestamps, and revocation state. |
| **007** | `007_create_mfa_recovery_codes.sql` | `mfa_recovery_codes`, `idx_mfa_recovery_user_hash` | Stores SHA-256 hashed one-time backup recovery codes with `used` flag for single-use fallback authentication. |

---

## 3. Schema Tracking Table (`schema_migrations`)

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

When the runner evaluates migrations:
```typescript
// server/db/migrator.ts
export function runMigrations(): { executed: string[]; skipped: string[] } {
  db.pragma('foreign_keys = ON');

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  const executed: string[] = [];
  const skipped: string[] = [];

  for (const file of files) {
    const version = file.split('_')[0];
    const alreadyApplied = db.prepare('SELECT id FROM schema_migrations WHERE version = ?').get(version);

    if (alreadyApplied) {
      skipped.push(file);
      continue;
    }

    // Execute in atomic transaction
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    db.transaction(() => {
      db.exec(sql);
      db.prepare('INSERT INTO schema_migrations (version, name) VALUES (?, ?)').run(version, file);
    })();
    executed.push(file);
  }

  return { executed, skipped };
}
```

---

## 4. Preservation of Existing SQLite Tables

The platform database (`data/workforce.sqlite`) maintains complete continuity with existing tables:

1. `departments` (6 records): Engineering, Product & Design, Sales & Marketing, Operations, Human Resources, Finance & Legal.
2. `employees` (54 records): Realistic workforce records with employee codes, departments, roles, and status.
3. `attendance` (1,188+ records): 30-day realistic historical attendance, clock-in, clock-out, and hours worked.
4. `activity_logs` (54+ records): Historical activity events.

### Foreign Key Links between Legacy & Auth Tables:
- `users.employee_id` $\to$ `employees.id` (Enforces employee profile ownership and IDOR verification)
- `users.role` $\to$ `roles.name` (Enforces strict RBAC role referential integrity)
- `attendance.employee_id` $\to$ `employees.id` (Enforces attendance integrity)
- `employees.department_id` $\to$ `departments.id` (Enforces department organization)

---

## 5. CLI Execution & Status Commands

### Check Migration Status:
```bash
npm run migrate:status
# or
npx tsx server/db/migrator.ts status
```

**Output:**
```
Database Migration Status:
--------------------------------------------------------------------------------
[APPLIED] 001_create_users.sql (Applied at: 2026-11-17 05:14:22)
[APPLIED] 002_create_roles_permissions.sql (Applied at: 2026-11-17 05:14:22)
[APPLIED] 003_create_refresh_tokens.sql (Applied at: 2026-11-17 05:14:22)
[APPLIED] 004_create_audit_logs.sql (Applied at: 2026-11-17 05:14:22)
[APPLIED] 005_create_account_lockouts.sql (Applied at: 2026-11-17 05:14:22)
[APPLIED] 006_create_user_sessions.sql (Applied at: 2026-11-17 05:14:22)
[APPLIED] 007_create_mfa_recovery_codes.sql (Applied at: 2026-11-17 05:14:22)
--------------------------------------------------------------------------------
Total: 7 migrations | Applied: 7 | Pending: 0
```

### Run Migrations:
```bash
npm run migrate
# or
npx tsx server/db/migrator.ts up
```
