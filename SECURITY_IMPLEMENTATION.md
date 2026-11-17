# Security Architecture & Implementation Report
## Workforce Analytics Platform (WFA) – Task 3

This document details the security architecture, threat model, cryptographic mechanisms, OWASP Top 10 alignment, and defensive countermeasures implemented in the platform.

---

## 1. Cryptographic Standards & Secret Management

| Security Asset | Cryptographic Algorithm | Key Derivation & Configuration | Storage Location |
|---|---|---|---|
| **User Passwords** | **Bcrypt** | 12 Salt Rounds (PBKDF2 derivative) | `users.password_hash` |
| **MFA TOTP Secrets** | **AES-256-GCM** | 32-Byte Secret Key + Random 12-Byte IV + 16-Byte Auth Tag | `users.mfa_secret` |
| **Refresh Tokens** | **HMAC-SHA-256** (JWT) + **SHA-256** (Storage) | 256-Bit Secret (`JWT_REFRESH_SECRET`) | Token sent in HttpOnly cookie; SHA-256 hash stored in `refresh_tokens.token_hash` |
| **Access Tokens** | **HMAC-SHA-256** (JWT) | 256-Bit Secret (`JWT_ACCESS_SECRET`), 15m Expiry | Kept exclusively in client React memory |
| **MFA Recovery Codes** | **Cryptographic RNG** + **SHA-256** | 8 Characters (`crypto.randomBytes`) | Plaintext shown once; SHA-256 hash stored in `mfa_recovery_codes.code_hash` |
| **CSRF Protection** | **CSPRNG Token** | 24-Byte Hex string (`crypto.randomBytes`) | Transmitted via `wfa_csrf` cookie & `X-CSRF-Token` header |

---

## 2. OWASP Top 10 (2021/2026) Defensive Countermeasures

### A01: Broken Access Control
- **Backend-Enforced Authorization:** Route protection does **not** rely on frontend state. Every protected API endpoint verifies credentials through `authenticateJWT` and permissions through `requirePermission` or `requireRole`.
- **Insecure Direct Object Reference (IDOR) Defense:** Handled by `verifyEmployeeOwnership`. A user cannot access another employee's records simply by altering numeric IDs in URL paths.
- **Department Boundary Enforcement:** Managers and Team Leads receive department-scoped query results only (`WHERE department_id = ?`).

### A02: Cryptographic Failures
- **Encrypted MFA Secrets:** TOTP seeds are encrypted with authenticated encryption (AES-256-GCM). Even with direct physical database access, TOTP secrets cannot be decrypted without the host environment key.
- **Non-Reversible Hashes:** Passwords use 12 rounds of bcrypt. Refresh tokens and recovery codes are irreversibly hashed with SHA-256 prior to storage.
- **Secure Secret Storage:** JWT secrets, encryption keys, and environment variables are externalized into `.env` and strictly excluded from Git tracking via `.gitignore`.

### A03: Injection (SQL Injection Defense)
- **100% Parameterized Queries:** All database interactions utilize `better-sqlite3` prepared statements (`db.prepare('...').run(param)`). Zero query string concatenation exists.
- **Input Sanitization:** Email normalization (`.toLowerCase().trim()`) and typed parameter parsing prevent malformed inputs.
- **Automated Security Verification:** Automated tests pass classic SQL injection vectors (`' OR '1'='1`, `'; DROP TABLE users; --`, `' UNION SELECT...`) verifying that payloads return `401 Unauthorized` without database alteration.

### A04: Insecure Design & Token Replay Guard
- **Token Family Rotation:** Refresh tokens cannot be reused. Replaying an already-consumed refresh token triggers immediate **Token Family Revocation**, terminating all sessions associated with that token lineage.
- **Single-Use Recovery Codes:** Backup recovery codes are marked `used = 1` immediately upon successful verification and cannot be reused.

### A05: Security Misconfiguration
- **HTTP Security Headers (Helmet):** Configures strict `Content-Security-Policy` (CSP), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`, and disabled `X-Powered-By`.
- **Strict CORS Policy:** Restricts allowed origins strictly to authorized client domains (`http://localhost:5173`, `http://127.0.0.1:5173`), prohibiting wildcards (`*`) when credentials are enabled.
- **SQLite Database Pragma:** `PRAGMA foreign_keys = ON;` is enforced on every connection to prevent orphaned records.

### A07: Identification and Authentication Failures
- **Multi-Factor Authentication (MFA):** Google Authenticator (TOTP) requires out-of-band 6-digit confirmation before access is granted.
- **Account Lockout:** 5 failed login attempts trigger an automatic 15-minute account lockout, mitigating online brute-force credential stuffing.
- **Multi-Device Tracking:** Complete visibility into active sessions with user-agent device parsing and one-click remote session termination.

### A08: Software and Data Integrity Failures
- **Tampered Token Rejection:** JWT signatures are verified against HMAC-SHA-256 keys. Tokens modified in transit or with altered payloads are rejected with `401 Unauthorized`.

### A09: Security Logging and Monitoring Failures
- **Comprehensive Audit Trail:** All security events are logged synchronously in `auth_audit_logs`.
- **Logged Event Types:**
  - `login_success` / `login_failed`
  - `account_locked`
  - `mfa_setup` / `mfa_enabled` / `mfa_verified` / `mfa_failed` / `recovery_code_used`
  - `session_revoked` / `logout_all`
  - `token_reuse_detected`
  - `access_denied` / `idor_attempt`
  - `role_updated` / `password_changed`
- **Admin Visibility:** Administrators can review audit logs in the Admin Control Center (`GET /api/auth/audit-logs`) with filtering by event type, status, and IP address.
