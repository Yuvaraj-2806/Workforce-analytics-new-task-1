# Role-Based Access Control (RBAC) Permission Matrix
## Workforce Analytics Platform (WFA) – Task 3

This document details the complete Role-Based Access Control (RBAC) architecture, permission mapping, data access boundaries, and IDOR prevention rules.

---

## 1. System Roles Overview

| Role Name | Display Name | Authority Scope | Description |
|---|---|---|---|
| **admin** | Administrator | Global / System-Wide | Complete platform control, user and role management, audit log inspection, and database administration. |
| **hr** | HR Specialist | Company-Wide Workforce | Full visibility into all employees and attendance trends across all departments; restricted from system role management and audit logs. |
| **manager** | Department Manager | Assigned Department Only | Scoped exclusively to the assigned department (e.g. Engineering). Cannot view or manage employees in other departments. |
| **team_lead** | Team Lead | Assigned Team Only | Scoped to assigned team attendance, daily performance, and activity logs. Restricted from company-wide data and financial analytics. |
| **employee** | Regular Employee | Personal Record Only | Can only view their own profile and attendance records. Strictly blocked from viewing other employees or departments. |

---

## 2. Granular Permission Definitions

The system implements 13 atomic permissions registered in the SQLite `permissions` table:

1. `view:dashboard` – Access overview dashboard and company health metrics.
2. `view:kpi` – Access core workforce Key Performance Indicators.
3. `view:charts` – View workforce trends, segmentation, and distribution charts.
4. `view:all_employees` – Access company-wide employee roster across all departments.
5. `view:team` – Access employee list scoped to user's assigned department or team.
6. `view:own_profile` – View personal employee profile information.
7. `view:attendance` – View attendance logs within authorized scope.
8. `view:audit_logs` – Access security audit logs and incident records.
9. `manage:users` – View registered accounts and authentication states.
10. `manage:roles` – Modify user roles and assign access tiers.
11. `manage:sessions` – View and revoke active authenticated sessions.
12. `export:reports` – Export analytical reports and workforce datasets.
13. `seed:database` – Trigger database seeding or test record initialization.

---

## 3. Role-to-Permission Matrix

| Permission | Admin | HR Specialist | Manager | Team Lead | Employee |
|---|:---:|:---:|:---:|:---:|:---:|
| `view:dashboard` | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | :x: |
| `view:kpi` | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: |
| `view:charts` | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | :x: |
| `view:all_employees` | :white_check_mark: | :white_check_mark: | :x: | :x: | :x: |
| `view:team` | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: |
| `view:own_profile` | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| `view:attendance` | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |
| `view:audit_logs` | :white_check_mark: | :x: | :x: | :x: | :x: |
| `manage:users` | :white_check_mark: | :x: | :x: | :x: | :x: |
| `manage:roles` | :white_check_mark: | :x: | :x: | :x: | :x: |
| `manage:sessions` | :white_check_mark: | :x: | :x: | :x: | :x: |
| `export:reports` | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | :x: |
| `seed:database` | :white_check_mark: | :x: | :x: | :x: | :x: |

---

## 4. Endpoint Authorization & Middleware Mapping

Every protected route verifies permissions and role requirements independently on the backend:

| HTTP Method & Route | Required Middleware Guard | Authorized Roles | Enforced Backend Data Scope |
|---|---|---|---|
| `GET /api/kpi` | `requirePermission('view:kpi')` | Admin, HR, Manager, Team Lead | Scoped to assigned department for Manager/Team Lead; company-wide for Admin/HR |
| `GET /api/charts/*` | `requirePermission('view:charts')` | Admin, HR, Manager | Scoped to department metrics for Manager; global for Admin/HR |
| `GET /api/employees` | `requirePermission('view:team')` | Admin, HR, Manager, Team Lead | Returns ONLY employees in assigned department for Manager & Team Lead |
| `GET /api/employees/:id` | `verifyEmployeeOwnership('id')` | Admin, HR, Manager (own dept), Lead (own dept), Employee (own ID only) | IDOR guard prevents cross-department or cross-employee access |
| `GET /api/my-profile` | `requirePermission('view:own_profile')` | All authenticated roles | Strictly returns authenticated user's own employee record |
| `GET /api/my-attendance`| `requirePermission('view:attendance')` | All authenticated roles | Strictly returns authenticated user's own attendance history |
| `GET /api/auth/audit-logs` | `requireRole('admin')` | Admin only | All system security audit logs |
| `GET /api/auth/users` | `requireRole('admin')` | Admin only | Registered user profiles and active roles |
| `PUT /api/auth/users/:id/role`| `requireRole('admin')` | Admin only | Prevents unauthorized role promotion / privilege escalation |
| `DELETE /api/auth/sessions/:id`| `authenticateJWT` | Admin (all) / Users (own sessions only)| Enforces ownership: users can only terminate their own device sessions |

---

## 5. Insecure Direct Object Reference (IDOR) Defense

The application implements defense against Insecure Direct Object Reference (IDOR) vulnerabilities via `verifyEmployeeOwnership`:

```typescript
// server/middleware/auth.ts
export function verifyEmployeeOwnership(paramName: string = 'id') {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const user = req.user!;
    const targetEmployeeId = parseInt(req.params[paramName], 10);

    // 1. Admin and HR have company-wide authority
    if (user.role === 'admin' || user.role === 'hr') return next();

    // 2. Fetch target employee's department
    const targetEmp = db.prepare(`SELECT id, department_id FROM employees WHERE id = ?`).get(targetEmployeeId);
    if (!targetEmp) return res.status(404).json({ success: false, error: 'Employee not found.' });

    // 3. Manager and Team Lead: Must match department
    if (user.role === 'manager' || user.role === 'team_lead') {
      if (user.departmentId && targetEmp.department_id === user.departmentId) return next();
      
      authService.logAuditEvent({
        userId: user.id,
        eventType: 'idor_attempt',
        status: 'BLOCKED',
        details: `Manager/Lead (Dept ${user.departmentId}) attempted access to employee ${targetEmployeeId} (Dept ${targetEmp.department_id})`
      });
      return res.status(403).json({ success: false, error: 'Forbidden: You can only access employees within your department.' });
    }

    // 4. Employee: Can only access their exact own employee ID
    if (user.role === 'employee') {
      if (user.employeeId && user.employeeId === targetEmployeeId) return next();

      authService.logAuditEvent({
        userId: user.id,
        eventType: 'idor_attempt',
        status: 'BLOCKED',
        details: `Employee (ID ${user.employeeId}) attempted access to employee ${targetEmployeeId}`
      });
      return res.status(403).json({ success: false, error: 'Forbidden: You can only access your own employee profile.' });
    }
  };
}
```

### Key Security Outcomes:
1. **No Data Leakage via URL parameter manipulation:** An employee changing `GET /api/employees/848` to `GET /api/employees/847` receives immediate HTTP `403 Forbidden` and creates an `idor_attempt` audit entry.
2. **Department Isolation:** A Manager in Engineering accessing an employee in Product & Design receives HTTP `403 Forbidden`.
3. **No Non-Existent ID Disclosure:** Non-existent employee IDs return HTTP `404 Not Found` rather than leaking structural presence.
