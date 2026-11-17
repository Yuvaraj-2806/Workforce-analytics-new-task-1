# 🚀 Stackly — Enterprise Workforce Analytics Platform (WFA)
## Task 3: Authentication, Authorization & Role-Based Access Control (RBAC)

[![React](https://img.shields.io/badge/React-19.3.1-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Material UI](https://img.shields.io/badge/Material--UI-v9-007FFF?logo=mui&logoColor=white)](https://mui.com/)
[![Express.js](https://img.shields.io/badge/Express-5.3-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-WAL--Mode-003B57?logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Security](https://img.shields.io/badge/Security-AES--256--GCM%20%7C%20TOTP%20MFA-10b981?logo=shield&logoColor=white)](#-security-architecture)
[![Test Suite](https://img.shields.io/badge/Tests-27%2F27%20Passed%20(100%25)-brightgreen)](#-automated-testing-suite)

An enterprise-grade, highly secure Workforce Analytics Platform engineered for **Stackly**. Built with a decoupled frontend architecture, a hardened Express REST API adhering to the **Repository Pattern**, and a persistent, version-controlled **SQLite** database operating with Write-Ahead Logging (WAL) and `PRAGMA foreign_keys = ON`.

---

## 📑 Table of Contents
1. [Executive Summary & Task 3 Deliverables](#-executive-summary--task-3-deliverables)
2. [Demo Credentials & Quick Start](#-demo-credentials--quick-start)
3. [Architecture Overview](#-architecture-overview)
4. [SQLite Database Migration Engine](#-sqlite-database-migration-engine)
5. [Authentication & MFA Implementation](#-authentication--mfa-implementation)
6. [Role-Based Access Control (RBAC) & IDOR Defense](#-role-based-access-control-rbac--idor-defense)
7. [Multi-Device Session Management](#-multi-device-session-management)
8. [Automated Testing Suite (Unit, Integration, Security, E2E)](#-automated-testing-suite)
9. [Screenshots Gallery](#-screenshots-gallery)
10. [Technical Documentation Index](#-technical-documentation-index)
11. [Installation & Execution Guide](#-installation--execution-guide)

---

## 🌟 Executive Summary & Task 3 Deliverables

All mandatory Task 3 requirements have been implemented and verified:

- ✅ **Version-Controlled SQLite Migration System:** 7 numbered SQL migration files managed by an atomic runner that tracks versions in `schema_migrations`, prevents duplicate executions, and strictly preserves existing legacy tables (`departments`, `employees`, `attendance`, `activity_logs`).
- ✅ **Secure JWT Authentication & Token Rotation:** In-memory short-lived access tokens (15m) paired with secure HttpOnly, SameSite cookies for refresh tokens (7d). Implements **Token Family Rotation** with automatic **Token Reuse Detection** to neutralize stolen token replays.
- ✅ **Google Authenticator (TOTP) MFA:** RFC 6238-compliant Two-Factor Authentication. TOTP secrets are encrypted at rest in SQLite using **AES-256-GCM** with unique 12-byte IVs. Includes 8 hashed, single-use backup recovery codes.
- ✅ **Role-Based Access Control (5 Roles & 13 Permissions):** Enforces separate data access boundaries for **Admin**, **HR Specialist**, **Department Manager**, **Team Lead**, and **Regular Employee**. Data filtering is enforced at the database level on the backend.
- ✅ **Insecure Direct Object Reference (IDOR) Defense:** API-level resource authorization guards prevent users from accessing or modifying other employees' data by altering URL identifiers.
- ✅ **Multi-Device Session Management:** SQLite-backed session tracking with device fingerprinting, active session inspection, remote single-session revocation, and global logout across all devices (`/api/auth/logout-all`).
- ✅ **API Security Hardening:** Helmet CSP directives, strict CORS origin whitelisting with credential support, IP-based rate limiting, 15-minute brute-force account lockout after 5 failed attempts, and CSRF protection.
- ✅ **Security Audit Logging:** Synchronous event logging across all authentication, session, token rotation, IDOR attempts, and administrative actions stored in `auth_audit_logs`.
- ✅ **Comprehensive Automated Testing:** 4 test suites (Unit, Integration, Security, E2E) executing 27 assertions against real SQLite data with **100% pass rate**.

---

## 🔑 Demo Credentials & Quick Start

The platform seeds 5 demo users with distinct roles and linked employee records:

| Role | Email Address | Password | Department Scope | MFA Status | Access Capabilities |
|---|---|---|---|---|---|
| **Admin** | `admin@wfa.com` | `Admin@123!` | Global (All) | Optional | Full platform administration, audit logs, user management, database re-seeding |
| **HR Specialist** | `hr@wfa.com` | `Hr@123456!` | Company-Wide | Optional | Company-wide employee directory, attendance trends, workforce KPIs |
| **Department Manager**| `manager@wfa.com` | `Manager@1!` | Engineering Only | Optional | Department-scoped KPIs and team member analytics for Engineering |
| **Team Lead** | `teamlead@wfa.com` | `Tlead@123!` | Product & Design Only | Optional | Scoped team attendance, sprint monitoring, and activity tracking |
| **Employee** | `employee@wfa.com`| `Emp@123456!` | Own Profile Only | Optional | Personal profile, attendance calendar, and individual timesheet |

---

## 🏛 Architecture Overview

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT PRESENTATION LAYER (React 19)                    │
│                                                                                   │
│   ┌────────────────────┐   ┌───────────────────────────┐   ┌──────────────────┐   │
│   │   Role Navigation  │   │   Role-Based Dashboards   │   │  MFA Modal / TOTP│   │
│   │   Sidebar & TopNav │   │   • Admin Control Center  │   │  QR Code + Codes │   │
│   │   Active Role Pill │   │   • Overview (HR/Exec)    │   └──────────────────┘   │
│   └────────────────────┘   │   • Manager (Dept Scoped) │   ┌──────────────────┐   │
│                            │   • Team Lead (Sprint Log)│   │  Sessions Modal  │   │
│                            │   • Employee (My Profile) │   │  Multi-Device UI │   │
│                            └───────────────────────────┘   └──────────────────┘   │
│                                           │                                       │
│                           ┌───────────────▼──────────────┐                        │
│                           │      AuthContext Provider    │                        │
│                           │   (Access Token in Memory)   │                        │
│                           └───────────────┬──────────────┘                        │
└───────────────────────────────────────────┼───────────────────────────────────────┘
                                            │ HTTP (Bearer JWT + Cookie + CSRF)
                                            ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                        GATEWAY & MIDDLEWARE LAYER (Express 5)                     │
│                                                                                   │
│   • Helmet CSP Security Headers       • Strict CORS Whitelist with Credentials    │
│   • IP Rate Limiter & Account Lockout • authenticateJWT & Session Verification    │
│   • requireRole / requirePermission   • verifyEmployeeOwnership (IDOR Guard)      │
└───────────────────────────────────────────┬───────────────────────────────────────┘
                                            │
                                            ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                    RELATIONAL PERSISTENCE ENGINE (SQLite 3.45 WAL)                │
│                                                                                   │
│   ┌───────────────────────────────┐       ┌───────────────────────────────────┐   │
│   │     Authentication Tables     │       │    Legacy Workforce Analytics     │   │
│   │  • users (Bcrypt, AES-256 MFA)│       │  • departments (6 departments)    │   │
│   │  • roles & permissions (RBAC) │◄──────┤  • employees (54 records)         │   │
│   │  • refresh_tokens (Families)  │       │  • attendance (1,188+ records)    │   │
│   │  • user_sessions (Devices)    │       │  • activity_logs (54 events)      │   │
│   │  • mfa_recovery_codes (Hashed)│       └───────────────────────────────────┘   │
│   │  • auth_audit_logs (Immutable)│       ┌───────────────────────────────────┐   │
│   │  • account_lockouts           │       │  • schema_migrations (001..007)   │   │
│   └───────────────────────────────┘       └───────────────────────────────────┘   │
│                                                                                   │
│   PRAGMA foreign_keys = ON  |  PRAGMA journal_mode = WAL                          │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 SQLite Database Migration Engine

Migrations are located in `server/migrations/` and run automatically on server launch or via CLI:

1. `001_create_users.sql` – Users, bcrypt password hash, AES-256 encrypted MFA secret, employee foreign key.
2. `002_create_roles_permissions.sql` – Roles (`admin`, `hr`, `manager`, `team_lead`, `employee`), 13 permissions, mapping table.
3. `003_create_refresh_tokens.sql` – Refresh token hashes, UUID token families, revocation status.
4. `004_create_audit_logs.sql` – Security audit logs tracking events, status, IP, and User-Agent.
5. `005_create_account_lockouts.sql` – Brute-force account lockout state and failed attempt counters.
6. `006_create_user_sessions.sql` – Multi-device active session tracking.
7. `007_create_mfa_recovery_codes.sql` – SHA-256 hashed one-time backup recovery codes.

### Migration Commands:
```bash
# Check migration status
npm run migrate:status

# Run pending migrations
npm run migrate
```

---

## 🔐 Authentication & MFA Implementation

- **Password Security:** 12 rounds of bcrypt.
- **Short-Lived Access Tokens:** 15-minute expiration, held exclusively in React state memory.
- **Refresh Token Rotation:** HttpOnly, SameSite cookie rotated on every refresh. Replaying an already rotated token triggers immediate revocation of the **entire token family**.
- **TOTP MFA (Google Authenticator):** RFC 6238 standard. Secrets are encrypted with **AES-256-GCM** before database storage.
- **Backup Recovery Codes:** 8 single-use codes (format: `XXXX-XXXX`), stored as SHA-256 hashes and consumed on verification.

---

## 🛡️ Role-Based Access Control (RBAC) & IDOR Defense

The platform enforces data boundaries on the backend:
- **Admin:** Global visibility, user management, audit logs, and database re-seeding.
- **HR:** Company-wide visibility across all departments and employees.
- **Manager:** Restricted to employees and metrics belonging to their assigned department.
- **Team Lead:** Restricted to team members and attendance monitoring in their assigned team.
- **Employee:** Can only access their own profile and attendance records.

### IDOR (Insecure Direct Object Reference) Protection:
`verifyEmployeeOwnership` intercepts attempts to view employee records by ID:
- An employee requesting `/api/employees/847` (another employee) is blocked with **403 Forbidden**.
- An `idor_attempt` entry is logged in `auth_audit_logs`.

---

## 💻 Multi-Device Session Management

- Track authenticated devices with browser / OS parsing.
- View all active sessions in the UI with a distinct "Current Device" badge.
- Revoke individual sessions remotely.
- "Logout from all devices" revokes all active sessions and refresh token families.

---

## 🧪 Automated Testing Suite

All tests execute against real SQLite data without mock authentication.

```bash
# Run full automated test suite with executive summary
npm test
```

### Test Results Summary:
```
================================================================
📊 Test Execution Summary Report
================================================================
| Suite Type   | Name                                                  | Status  | Time (s) |
|--------------|-------------------------------------------------------|---------|----------|
| Unit         | Unit Tests (Crypto, MFA, Sessions, Token Family)      | ✅ PASS  |     4.39 |
| Integration  | Integration Tests (API, RBAC & Department Scoping)    | ✅ PASS  |     5.96 |
| Security     | Security Tests (IDOR, SQLi, Lockout, Replay, Escalation) | ✅ PASS  |     7.61 |
| E2E          | E2E Tests (5 Roles, MFA Flow, Multi-Device Sessions)  | ✅ PASS  |     7.57 |
================================================================
Total Suites:   4 | Suites Passed: 4 | Suites Failed: 0
Total Run Time: 25.54s
Final Verdict:  🎉 ALL TESTS PASSED (100%)
================================================================
```

---

## 📸 Screenshots Gallery

All screenshots are captured at 1200x800 resolution and located in `screenshots/`:

| # | View | File Path | Key Highlights |
|---|---|---|---|
| 01 | **Login Page** | `screenshots/01_login_page.png` | Email & password form, security badges, demo credentials box |
| 02 | **Admin Dashboard** | `screenshots/02_admin_dashboard.png` | User management table, role assignment, active status toggle |
| 03 | **HR Dashboard** | `screenshots/03_hr_dashboard.png` | Company-wide KPIs, 30-day attendance velocity, department allocation |
| 04 | **Manager Dashboard** | `screenshots/04_manager_dashboard.png` | Scoped exclusively to Engineering department data and team members |
| 05 | **Team Lead Dashboard** | `screenshots/05_team_lead_dashboard.png` | Product & Design team attendance and sprint monitoring |
| 06 | **Employee Dashboard** | `screenshots/06_employee_dashboard.png` | Personal profile card, attendance summary, timesheet history |
| 07 | **MFA Setup Modal** | `screenshots/07_mfa_setup.png` | Google Authenticator QR code, manual secret key, 8 backup recovery codes |
| 08 | **MFA Verification** | `screenshots/08_mfa_verify.png` | 6-digit TOTP input, backup recovery code option |
| 09 | **Access Denied (403)** | `screenshots/09_access_denied.png` | Shield alert icon, violation explanation, return link |
| 10 | **Session Management** | `screenshots/10_session_management.png` | Multi-device tracking, current session pill, revoke button, logout-all button |
| 11 | **Security Audit Logs** | `screenshots/11_audit_log_viewer.png` | Real-time audit trail with event types, IPs, timestamps, and status badges |
| 12 | **Responsive View** | `screenshots/12_responsive_dashboard.png` | Dual viewport view of tablet (768px) and mobile (375px) responsive layouts |
| 13 | **SQLite Architecture** | `screenshots/12_sqlite_schema.png` | Visual schema diagram with all 12 tables and foreign key constraints |

---

## 📚 Technical Documentation Index

For in-depth architectural and operational specifications, consult:

1. [Authentication Documentation (`AUTHENTICATION_DOCUMENTATION.md`)](AUTHENTICATION_DOCUMENTATION.md) – JWT architecture, token rotation, TOTP MFA, session tracking, API reference.
2. [RBAC Permission Matrix (`RBAC_PERMISSION_MATRIX.md`)](RBAC_PERMISSION_MATRIX.md) – Role definitions, 13 granular permissions, endpoint mapping, IDOR defense.
3. [Database Migrations (`DATABASE_MIGRATIONS.md`)](DATABASE_MIGRATIONS.md) – Migration runner, 7 migration scripts, schema design, legacy table preservation.
4. [Security Implementation (`SECURITY_IMPLEMENTATION.md`)](SECURITY_IMPLEMENTATION.md) – OWASP Top 10 alignment, AES-256-GCM encryption, rate limiting, lockout, CSP, CORS.
5. [Testing Report (`TESTING_REPORT.md`)](TESTING_REPORT.md) – Test coverage, methodology, individual test results table, security validation findings.

---

## 🛠 Installation & Execution Guide

### 1. Prerequisites
- **Node.js** v18+ (tested on v22.x)
- **npm** or **pnpm**
- **SQLite 3** (embedded via `better-sqlite3`)

### 2. Setup Environment
```bash
# Clone the repository
git clone <repository-url>
cd uiux

# Install dependencies
npm install

# Configure environment variables (a pre-configured .env is included)
# Verify .env has:
# PORT=5000
# JWT_ACCESS_SECRET=<secret>
# JWT_REFRESH_SECRET=<secret>
# MFA_ENCRYPTION_KEY=<32-char-key>
```

### 3. Initialize Database & Run Migrations
```bash
# Apply SQLite migrations
npm run migrate

# Seed authentication demo users and legacy workforce data
npm run auth:seed
```

### 4. Run the Full Test Suite
```bash
npm test
```

### 5. Launch Development Servers
```bash
# Run both Backend API (port 5000) and Frontend (port 5173) concurrently:
npm run dev:all

# Alternatively, run separately:
# Terminal 1 (Backend API):
npm run server

# Terminal 2 (Vite Frontend):
npm run dev
```

Visit **http://localhost:5173** and log in with any of the demo accounts!
