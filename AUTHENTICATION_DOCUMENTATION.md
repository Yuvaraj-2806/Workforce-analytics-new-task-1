# Authentication Architecture & Implementation Documentation
## Workforce Analytics Platform (WFA) – Task 3

This document details the complete authentication, multi-factor authentication (MFA), and session management architecture implemented in the Workforce Analytics Platform.

---

## 1. Authentication Architecture Overview

The WFA platform implements an enterprise-grade, defense-in-depth authentication framework built upon **JSON Web Tokens (JWT)**, **HttpOnly / SameSite secure cookies**, **Refresh Token Rotation with Token Family tracking**, **Google Authenticator (TOTP) Multi-Factor Authentication with AES-256-GCM encrypted secrets**, and **Multi-Device SQLite Session Management**.

```
+----------------------------------------------------------------------------------------------------+
|                                           CLIENT (Vite React)                                      |
|  - In-memory Access Token                                                                          |
|  - HttpOnly Cookie (Refresh Token) [Cross-Site Scripting Immune]                                   |
|  - X-CSRF-Token Request Header Verification                                                        |
+--------------------------------------------------+-------------------------------------------------+
                                                   | HTTP Request (Bearer JWT + Cookie + CSRF)
                                                   v
+--------------------------------------------------+-------------------------------------------------+
|                                        EXPRESS BACKEND GATEWAY                                     |
|  - Helmet CSP & Strict CORS (Origin Verification & Credentials)                                    |
|  - Rate Limiter (IP-based brute-force defense)                                                     |
|  - CookieParser & CSRF Middleware                                                                  |
+--------------------------------------------------+-------------------------------------------------+
                                                   |
                         +-------------------------+-------------------------+
                         |                                                   |
                         v                                                   v
+------------------------+-------------------+     +-------------------------+-----------------------+
|            AUTHENTICATION MIDDLEWARE        |     |              SESSION CONTROLLER               |
|  - verifyAccessToken(token, JWT_SECRET)    |     |  - sessionService.getUserSessions(userId)       |
|  - checks is_revoked status on session     |     |  - sessionService.revokeSession(sessionId)      |
|  - attaches AuthUser payload to req.user   |     |  - sessionService.revokeAllUserSessions(userId) |
+------------------------+-------------------+     +-------------------------+-----------------------+
                         |                                                   |
                         v                                                   v
+------------------------+---------------------------------------------------+-----------------------+
|                                           SQLITE STORAGE ENGINE                                    |
|  - PRAGMA foreign_keys = ON | WAL Journal Mode                                                     |
|  - users: PBKDF2/Bcrypt Password Hash (12 rounds), AES-256-GCM Encrypted TOTP secret               |
|  - refresh_tokens: SHA-256 Token Hashes, Family UUID, Revocation Tracking, Replay Guard            |
|  - user_sessions: Active device footprint, User-Agent, IP, Expiration, Revocation Status           |
|  - mfa_recovery_codes: 8 Hashed One-Time Recovery Keys (Single-Use, Consumed on Verification)      |
|  - auth_audit_logs: Immutable Audit Trail (IP, Agent, Action, Status, Timestamp)                   |
|  - account_lockouts: Email lockout state, Failed attempt counters, 15-minute lock window          |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Token Lifecycle & Security

### 2.1 Token Types & Configuration
| Token Type | Storage Mechanism | Expiration | Purpose & Security Attributes |
|---|---|---|---|
| **Access Token** | Client in-memory state only (`AuthContext`) | 15 Minutes | Stateless API authentication; contains user ID, email, role, department ID, employee ID, permissions list, and session ID. Immune to localStorage XSS token theft. |
| **Refresh Token** | Secure HttpOnly Cookie + SQLite Hash | 7 Days | State-verified token issuance; protected by `httpOnly: true`, `sameSite: 'lax'`, `path: '/'`. Rotates on every single refresh request. |
| **CSRF Token** | Non-httpOnly Cookie (`wfa_csrf`) | 7 Days | Read by frontend client code and transmitted via `X-CSRF-Token` header on state-changing requests. |

### 2.2 Refresh Token Rotation & Replay Attack Detection
To prevent compromised refresh tokens from generating infinite credentials, WFA implements **Token Family Rotation**:
1. When a user authenticates, a unique `familyId` (UUID v4) is created and embedded into the refresh token along with a unique `jti`.
2. When the frontend requests `/api/auth/refresh`, the server:
   - Validates the token signature and expiration.
   - Finds the stored SHA-256 hash in `refresh_tokens`.
   - **Replay Check:** If `is_revoked === 1`, **TOKEN REUSE IS DETECTED**. The server immediately invalidates **ALL** tokens belonging to that `family_id` via `authService.revokeTokenFamily()`, logs a security incident (`token_reuse_detected`) in `auth_audit_logs`, and responds with `403 Forbidden`.
   - If valid, the current refresh token is marked `is_revoked = 1`, and a new refresh token is issued under the **same** `familyId`.

---

## 3. Multi-Factor Authentication (MFA / TOTP)

### 3.1 Encryption Architecture
- **Secret Generation:** Uses `otplib` (RFC 6238 Time-Based One-Time Password algorithm, 6 digits, 30-second step).
- **At-Rest Secret Encryption:** Plaintext TOTP secrets are **never** stored in SQLite. Before insertion into `users.mfa_secret`, secrets are encrypted using **AES-256-GCM** with a cryptographically secure random 12-byte IV and a 16-byte authentication tag:
  $$\text{Storage Format: } \text{iv}.\text{tag}.\text{ciphertext} \quad (\text{hex encoded})$$
- **Verification:** On validation, the secret is decrypted in-memory, checked against `verifySync({ token, secret })`, and immediately discarded from memory.

### 3.2 MFA Activation Lifecycle
1. **Initiation (`POST /api/auth/mfa/setup`):**
   - User requests setup. The server generates a Base32 TOTP secret, encrypts it, and saves it with `mfa_verified = 0`.
   - Generates an `otpauth://` URI and a data URL QR code.
   - Generates 8 one-time backup recovery codes (format: `XXXX-XXXX`).
   - Hashes each recovery code with SHA-256 and stores them in `mfa_recovery_codes`.
2. **Confirmation (`POST /api/auth/mfa/enable`):**
   - User scans the QR code in Google Authenticator or enters the manual key.
   - User inputs their initial 6-digit TOTP code.
   - Server verifies the code. Only upon successful verification is `mfa_verified` set to `1` and `mfa_enabled` set to `1`.
3. **Challenge at Login (`POST /api/auth/login`):**
   - If `mfa_enabled === 1 && mfa_verified === 1`, the login endpoint returns `{ success: true, requiresMFA: true, userId }` **without** issuing tokens.
   - Client redirects to `/mfa-challenge`.
4. **Challenge Completion (`POST /api/auth/mfa/verify`):**
   - User enters their 6-digit TOTP code or an 8-character backup recovery code.
   - If using a recovery code, the code is hashed with SHA-256, verified against `mfa_recovery_codes WHERE user_id = ? AND used = 0`, and marked `used = 1` (single-use only).
   - Once validated, full session and JWT access/refresh tokens are granted.

---

## 4. Multi-Device Session Management

All authenticated sessions are tracked in SQLite in the `user_sessions` table:
- **Session Attributes:** Unique `session_id` (UUID), `user_id`, `refresh_token_hash`, `device` (parsed from User-Agent), `ip_address`, `expires_at`, `is_revoked`.
- **Active Sessions API (`GET /api/auth/sessions`):**
  - Users can view all their active devices. Current device is tagged via session comparison.
- **Session Revocation (`DELETE /api/auth/sessions/:sessionId`):**
  - Revokes an individual session and its linked refresh token.
  - Ownership is strictly enforced: regular users cannot revoke other users' sessions (IDOR protection). Admins can revoke any session.
- **Logout from All Devices (`POST /api/auth/logout-all`):**
  - Marks all active sessions for the user as `is_revoked = 1`.
  - Marks all user refresh tokens as `is_revoked = 1`.
  - Clears refresh cookies and forces re-authentication across all devices.

---

## 5. Brute Force Protection & Account Lockout

- **Rate Limiting:** `express-rate-limit` throttles brute force attempts per IP address.
- **Account Lockout:** Managed per email address in `account_lockouts`:
  - 5 consecutive failed login attempts trigger an immediate **15-minute account lockout**.
  - During the lockout window, `POST /api/auth/login` immediately rejects attempts with HTTP `429 Too Many Requests` (`code: 'ACCOUNT_LOCKED'`).
  - An `account_locked` event is registered in `auth_audit_logs`.
  - Successful authentication clears the failed attempts counter.

---

## 6. Authentication API Endpoint Reference

| Method | Endpoint | Protection | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Rate Limited | Authenticates user; returns JWT or prompts for MFA challenge |
| `POST` | `/api/auth/mfa/verify` | Rate Limited | Validates TOTP code or backup recovery code |
| `POST` | `/api/auth/refresh` | Rate Limited, Cookie | Rotates refresh token and issues new access token |
| `POST` | `/api/auth/logout` | Authenticated | Revokes current session and clears refresh cookies |
| `POST` | `/api/auth/logout-all`| Authenticated | Revokes all active user sessions across all devices |
| `GET`  | `/api/auth/me` | Authenticated | Returns authenticated user profile, permissions & role |
| `POST` | `/api/auth/change-password` | Authenticated | Validates old password and updates hash; invalidates other sessions |
| `GET`  | `/api/auth/sessions` | Authenticated | Lists active devices and sessions for user |
| `DELETE`| `/api/auth/sessions/:sessionId` | Authenticated | Terminates an active session |
| `POST` | `/api/auth/mfa/setup` | Authenticated | Generates secret, QR data URL, and backup codes |
| `POST` | `/api/auth/mfa/enable`| Authenticated | Confirms TOTP token and activates MFA |
| `POST` | `/api/auth/mfa/disable`| Authenticated | Disables MFA with password and current TOTP code |
| `GET`  | `/api/auth/audit-logs`| Admin Only | Retrieves paginated system audit logs |
| `GET`  | `/api/auth/users` | Admin Only | Lists registered users for administration |
| `PUT`  | `/api/auth/users/:id/role` | Admin Only | Updates a user's assigned RBAC role |
