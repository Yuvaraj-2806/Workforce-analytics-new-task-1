process.env.NODE_ENV = 'test';
import test from 'node:test';
import assert from 'node:assert/strict';
import { request } from '../utils/testClient.js';
import { authService } from '../../server/services/authService.js';
import { db } from '../../server/db/database.js';

test('🛡️ Security & Vulnerability Defense Test Suite', { concurrency: false }, async (t) => {
  // ── 1. IDOR Defense (Insecure Direct Object Reference) ────────
  await t.test('1. IDOR Prevention: Employee cannot access another employee records', async () => {
    // Login as employee
    const loginRes = await request({
      method: 'POST',
      url: '/api/auth/login',
      body: { email: 'employee@wfa.com', password: 'Emp@123456!' },
    });
    assert.strictEqual(loginRes.status, 200, 'Employee login should succeed');
    const empToken = loginRes.body.accessToken;
    const ownEmpId = loginRes.body.user.employeeId;
    assert.ok(ownEmpId, 'Employee must be linked to an employeeId');

    // 1a. Access own employee record -> succeeds (200)
    const ownRes = await request({
      url: `/api/employees/${ownEmpId}`,
      headers: { Authorization: `Bearer ${empToken}` },
    });
    assert.strictEqual(ownRes.status, 200, 'Employee must be allowed to access own record');
    assert.strictEqual(ownRes.body.data.id, ownEmpId);

    // 1b. Attempt to access another employee's record (IDOR attack)
    const otherEmp = db.prepare(`SELECT id FROM employees WHERE id != ? LIMIT 1`).get(ownEmpId) as { id: number };
    const attackRes = await request({
      url: `/api/employees/${otherEmp.id}`,
      headers: { Authorization: `Bearer ${empToken}` },
    });
    assert.strictEqual(attackRes.status, 403, 'Access to another employee record must be strictly forbidden (403)');
    assert.ok(attackRes.body.error.includes('Forbidden'));

    // 1c. Verify audit log captured the IDOR attempt
    const auditRecord = db.prepare(`
      SELECT * FROM auth_audit_logs 
      WHERE event_type = 'idor_attempt' AND user_id = ?
      ORDER BY id DESC LIMIT 1
    `).get(loginRes.body.user.id) as any;
    assert.ok(auditRecord, 'IDOR attempt must be logged in security audit logs');
  });

  // ── 2. SQL Injection Resistance ─────────────────────────────
  await t.test('2. SQL Injection Resistance on Login & Endpoints', async () => {
    const sqliPayloads = [
      "' OR '1'='1",
      "admin@wfa.com' --",
      "' UNION SELECT 1, 'admin', 'pass', 1 --",
      "'; DROP TABLE users; --",
    ];

    for (const payload of sqliPayloads) {
      authService.clearFailedAttempts(payload.toLowerCase().trim());
    }

    for (const payload of sqliPayloads) {
      const res = await request({
        method: 'POST',
        url: '/api/auth/login',
        body: { email: payload, password: 'password123' },
      });
      // Must reject invalid credentials cleanly without SQL syntax error (never 500)
      assert.strictEqual(res.status, 401, `SQLi payload [${payload}] should result in 401 Unauthorized`);
      assert.strictEqual(res.body.success, false);
    }

    // Verify database tables are intact
    const userCount = db.prepare('SELECT count(*) as count FROM users').get() as { count: number };
    assert.ok(userCount.count >= 5, 'User table must remain intact after SQL injection attempts');
  });

  // ── 3. Brute Force & Account Lockout ─────────────────────────
  await t.test('3. Brute-Force Account Lockout triggers after 5 failed attempts', async () => {
    const targetEmail = 'lockout_test@wfa.com';
    // Ensure test user exists for this test
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(targetEmail) as any;
    if (!existing) {
      const hash = authService.hashPasswordSync('CorrectPassword123!');
      db.prepare(`
        INSERT INTO users (email, password_hash, role, is_active)
        VALUES (?, ?, 'employee', 1)
      `).run(targetEmail, hash);
    }
    authService.clearFailedAttempts(targetEmail);

    // Attempts 1 to 4: should return 401 with attemptsLeft
    for (let i = 1; i <= 4; i++) {
      const res = await request({
        method: 'POST',
        url: '/api/auth/login',
        body: { email: targetEmail, password: 'WrongPassword!' },
      });
      assert.strictEqual(res.status, 401, `Attempt ${i} should return 401`);
      assert.strictEqual(res.body.attemptsLeft, 5 - i);
    }

    // Attempt 5: triggers lockout (429)
    const fifthRes = await request({
      method: 'POST',
      url: '/api/auth/login',
      body: { email: targetEmail, password: 'WrongPassword!' },
    });
    assert.strictEqual(fifthRes.status, 429, '5th failed attempt must trigger 429 Account Locked');
    assert.strictEqual(fifthRes.body.code, 'ACCOUNT_LOCKED');

    // Attempt 6 (while locked)
    const sixthRes = await request({
      method: 'POST',
      url: '/api/auth/login',
      body: { email: targetEmail, password: 'WrongPassword!' },
    });
    assert.strictEqual(sixthRes.status, 429, 'Subsequent attempts while locked must return 429');
    assert.strictEqual(sixthRes.body.code, 'ACCOUNT_LOCKED');

    // Clean up
    authService.clearFailedAttempts(targetEmail);
  });

  // ── 4. Refresh Token Replay & Family Revocation ──────────────
  await t.test('4. Refresh Token Replay Detection revokes entire token family', async () => {
    // 1. Initial login to obtain token family
    const loginRes = await request({
      method: 'POST',
      url: '/api/auth/login',
      body: { email: 'hr@wfa.com', password: 'Hr@123456!' },
    });
    assert.strictEqual(loginRes.status, 200, 'HR login should succeed');
    const token1 = loginRes.body.refreshToken;
    assert.ok(token1, 'Refresh token must be returned');

    // 2. Legitimate rotation: use token1 to get token2
    const rotateRes1 = await request({
      method: 'POST',
      url: '/api/auth/refresh',
      body: { refreshToken: token1 },
    });
    assert.strictEqual(rotateRes1.status, 200, 'First token rotation must succeed');
    const token2 = rotateRes1.body.refreshToken;
    assert.notStrictEqual(token1, token2, 'New rotated token must be generated');

    // 3. ATTACK: Attacker tries to replay token1 (which was already rotated & revoked)
    const attackRes = await request({
      method: 'POST',
      url: '/api/auth/refresh',
      body: { refreshToken: token1 },
    });
    assert.strictEqual(attackRes.status, 403, 'Reused refresh token must be rejected with 403');
    assert.strictEqual(attackRes.body.code, 'TOKEN_REUSE_DETECTED');

    // 4. Verification: Entire token family must now be revoked, including legitimate token2!
    const subsequentRes = await request({
      method: 'POST',
      url: '/api/auth/refresh',
      body: { refreshToken: token2 },
    });
    assert.strictEqual(subsequentRes.status, 403, 'Token belonging to compromised family must also trigger 403 reuse detected');
    assert.strictEqual(subsequentRes.body.code, 'TOKEN_REUSE_DETECTED');
  });

  // ── 5. Privilege Escalation Prevention ───────────────────────
  await t.test('5. Privilege Escalation Defense: Non-admin cannot alter roles', async () => {
    // Login as Manager
    const mgrLogin = await request({
      method: 'POST',
      url: '/api/auth/login',
      body: { email: 'manager@wfa.com', password: 'Manager@1!' },
    });
    assert.strictEqual(mgrLogin.status, 200);
    const mgrToken = mgrLogin.body.accessToken;

    // Manager attempts to promote employee to Admin
    const targetUser = db.prepare(`SELECT id FROM users WHERE email = 'employee@wfa.com'`).get() as { id: number };
    const escalateRes = await request({
      method: 'PUT',
      url: `/api/auth/users/${targetUser.id}/role`,
      headers: { Authorization: `Bearer ${mgrToken}` },
      body: { role: 'admin' },
    });
    assert.strictEqual(escalateRes.status, 403, 'Manager role promotion must be forbidden (403)');

    // Verify employee role remains 'employee'
    const userInDb = db.prepare(`SELECT role FROM users WHERE id = ?`).get(targetUser.id) as { role: string };
    assert.strictEqual(userInDb.role, 'employee', 'User role must not have changed');
  });

  // ── 6. Tampered JWT Rejection ───────────────────────────────
  await t.test('6. Tampered JWT Signature Rejection', async () => {
    const adminLogin = await request({
      method: 'POST',
      url: '/api/auth/login',
      body: { email: 'admin@wfa.com', password: 'Admin@123!' },
    });
    assert.strictEqual(adminLogin.status, 200);
    const token = adminLogin.body.accessToken;

    // Tamper with payload (middle segment)
    const parts = token.split('.');
    const tamperedToken = `${parts[0]}.eyJyZXF1ZXN0ZWRSb2xlIjoiYWRtaW4ifQ.${parts[2]}`;

    const res = await request({
      url: '/api/auth/me',
      headers: { Authorization: `Bearer ${tamperedToken}` },
    });
    assert.strictEqual(res.status, 401, 'Tampered token must be rejected with 401 Unauthorized');
  });
});
