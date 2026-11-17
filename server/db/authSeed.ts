import { db } from './database.js';
import { authService } from '../services/authService.js';
import { runMigrations } from './migrator.js';

export function seedAuthData(): void {
  // Ensure migrations have run first
  runMigrations();

  console.log('🔐 Seeding authentication & RBAC roles, permissions, and demo users...');

  // ── Roles ──────────────────────────────────────────────────
  const roles = [
    { name: 'admin', display_name: 'Administrator', description: 'Full system access and configuration' },
    { name: 'hr', display_name: 'HR Specialist', description: 'Company-wide workforce and attendance management' },
    { name: 'manager', display_name: 'Department Manager', description: 'Department-level analytics and team management' },
    { name: 'team_lead', display_name: 'Team Lead', description: 'Team attendance, performance, and monitoring' },
    { name: 'employee', display_name: 'Employee', description: 'Personal profile and attendance history only' },
  ];

  for (const role of roles) {
    db.prepare(`
      INSERT OR IGNORE INTO roles (name, display_name, description)
      VALUES (?, ?, ?)
    `).run(role.name, role.display_name, role.description);
  }

  // ── Permissions ────────────────────────────────────────────
  const permissions = [
    { name: 'view:dashboard',     resource: 'dashboard', action: 'view',     description: 'View overview dashboard metrics' },
    { name: 'view:kpi',           resource: 'kpi',       action: 'view',     description: 'View KPI metrics' },
    { name: 'view:charts',        resource: 'charts',    action: 'view',     description: 'View workforce distribution & trend charts' },
    { name: 'view:all_employees', resource: 'employees', action: 'view_all', description: 'View all employees across all departments' },
    { name: 'view:team',          resource: 'employees', action: 'view_team',description: 'View department or team members' },
    { name: 'view:own_profile',   resource: 'employees', action: 'view_own', description: 'View own personal employee profile' },
    { name: 'view:attendance',    resource: 'attendance',action: 'view',     description: 'View attendance records' },
    { name: 'view:audit_logs',    resource: 'audit_logs',action: 'view',     description: 'View security audit logs' },
    { name: 'manage:users',       resource: 'users',     action: 'manage',   description: 'Manage users and credentials' },
    { name: 'manage:roles',       resource: 'roles',     action: 'manage',   description: 'Modify user roles' },
    { name: 'manage:sessions',    resource: 'sessions',  action: 'manage',   description: 'View and revoke active user sessions' },
    { name: 'export:reports',     resource: 'reports',   action: 'export',   description: 'Export analytics data' },
    { name: 'seed:database',      resource: 'database',  action: 'seed',     description: 'Seed or reset database' },
  ];

  for (const perm of permissions) {
    db.prepare(`
      INSERT OR IGNORE INTO permissions (name, resource, action, description)
      VALUES (?, ?, ?, ?)
    `).run(perm.name, perm.resource, perm.action, perm.description);
  }

  // ── Role-Permission Mapping ────────────────────────────────
  const rolePermissions: Record<string, string[]> = {
    admin: [
      'view:dashboard', 'view:kpi', 'view:charts', 'view:all_employees', 'view:team',
      'view:own_profile', 'view:attendance', 'view:audit_logs', 'manage:users',
      'manage:roles', 'manage:sessions', 'export:reports', 'seed:database'
    ],
    hr: [
      'view:dashboard', 'view:kpi', 'view:charts', 'view:all_employees', 'view:team',
      'view:own_profile', 'view:attendance', 'export:reports'
    ],
    manager: [
      'view:dashboard', 'view:kpi', 'view:charts', 'view:team', 'view:own_profile',
      'view:attendance', 'export:reports'
    ],
    team_lead: [
      'view:kpi', 'view:team', 'view:own_profile', 'view:attendance'
    ],
    employee: [
      'view:own_profile', 'view:attendance'
    ],
  };

  for (const [roleName, perms] of Object.entries(rolePermissions)) {
    for (const perm of perms) {
      db.prepare(`
        INSERT OR IGNORE INTO role_permissions (role_name, permission_name)
        VALUES (?, ?)
      `).run(roleName, perm);
    }
  }

  // ── Demo Users (Development and Testing only) ──────────────
  if (process.env.NODE_ENV === 'production') {
    console.log('🔒 Production mode active: demo seed accounts are suppressed.');
    console.log('✅ Auth seeding complete (production roles and permissions verified)!');
    return;
  }

  // Dynamic lookup of departments and employees to link accurately
  const engDept = db.prepare(`SELECT id FROM departments WHERE name = 'Engineering'`).get() as any;
  const prodDept = db.prepare(`SELECT id FROM departments WHERE name LIKE '%Product%'`).get() as any;

  const mgrEmp = engDept ? db.prepare(`SELECT id FROM employees WHERE department_id = ? LIMIT 1`).get(engDept.id) as any : null;
  const leadEmp = prodDept ? db.prepare(`SELECT id FROM employees WHERE department_id = ? LIMIT 1`).get(prodDept.id) as any : null;
  const regularEmp = engDept ? db.prepare(`SELECT id FROM employees WHERE department_id = ? LIMIT 1 OFFSET 1`).get(engDept.id) as any : null;

  const defaultUsers = [
    { email: 'admin@wfa.com',    password: 'Admin@123!',  role: 'admin',     employeeId: null },
    { email: 'hr@wfa.com',       password: 'Hr@123456!',  role: 'hr',        employeeId: null },
    { email: 'manager@wfa.com',  password: 'Manager@1!',  role: 'manager',   employeeId: mgrEmp?.id ?? null },
    { email: 'teamlead@wfa.com', password: 'Tlead@123!',  role: 'team_lead', employeeId: leadEmp?.id ?? null },
    { email: 'employee@wfa.com', password: 'Emp@123456!', role: 'employee',  employeeId: regularEmp?.id ?? null },
  ];

  for (const u of defaultUsers) {
    const existing = db.prepare(`SELECT id FROM users WHERE email = ?`).get(u.email) as { id: number } | undefined;
    if (!existing) {
      const hash = authService.hashPasswordSync(u.password);
      db.prepare(`
        INSERT INTO users (email, password_hash, role, employee_id, is_active)
        VALUES (?, ?, ?, ?, 1)
      `).run(u.email, hash, u.role, u.employeeId);
      console.log(`  👤 Created demo user [${u.role.padEnd(9)}] ${u.email}`);
    } else {
      // Ensure employee_id is properly linked
      if (u.employeeId) {
        db.prepare(`UPDATE users SET employee_id = ? WHERE email = ?`).run(u.employeeId, u.email);
      }
      console.log(`  ℹ️  Demo user ${u.email} already exists (employeeId: ${u.employeeId})`);
    }
  }

  console.log('✅ Auth seeding complete!');
}

// Allow standalone execution
if (process.argv[1] && process.argv[1].endsWith('authSeed.ts')) {
  try {
    seedAuthData();
  } catch (err) {
    console.error('Failed to seed auth data:', err);
    process.exit(1);
  }
}
