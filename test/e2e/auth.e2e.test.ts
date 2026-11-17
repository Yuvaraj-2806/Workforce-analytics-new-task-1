process.env.NODE_ENV = 'test';
import test from 'node:test';
import assert from 'node:assert/strict';
import { request } from '../utils/testClient.js';
import { mfaService } from '../../server/services/mfaService.js';
import { db } from '../../server/db/database.js';

test('🌐 End-to-End (E2E) Authentication, RBAC & MFA Flow Test Suite', { concurrency: false }, async (t) => {
  // ── 1. Full 5-Role Lifecycle & Scope Verification ───────────
  await t.test('1. Multi-Role RBAC: Admin, HR, Manager, Team Lead, and Employee flows', async () => {
    // 1a. Admin Flow
    const adminRes = await request({
      method: 'POST',
      url: '/api/auth/login',
      body: { email: 'admin@wfa.com', password: 'Admin@123!' },
    });
    assert.strictEqual(adminRes.status, 200);
    assert.strictEqual(adminRes.body.user.role, 'admin');
    const adminToken = adminRes.body.accessToken;

    const auditRes = await request({
      url: '/api/auth/audit-logs',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(auditRes.status, 200, 'Admin can view audit logs');
    assert.ok(Array.isArray(auditRes.body.data));

    const usersRes = await request({
      url: '/api/auth/users',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(usersRes.status, 200, 'Admin can view users list');

    // 1b. HR Flow
    const hrRes = await request({
      method: 'POST',
      url: '/api/auth/login',
      body: { email: 'hr@wfa.com', password: 'Hr@123456!' },
    });
    assert.strictEqual(hrRes.status, 200);
    assert.strictEqual(hrRes.body.user.role, 'hr');
    const hrToken = hrRes.body.accessToken;

    const hrEmpRes = await request({
      url: '/api/employees',
      headers: { Authorization: `Bearer ${hrToken}` },
    });
    assert.strictEqual(hrEmpRes.status, 200, 'HR can view company-wide employees');
    assert.strictEqual(hrEmpRes.body.scope.type, 'company_wide');

    // HR blocked from admin user role updates
    const hrAdminBlock = await request({
      method: 'PUT',
      url: `/api/auth/users/1/role`,
      headers: { Authorization: `Bearer ${hrToken}` },
      body: { role: 'employee' },
    });
    assert.strictEqual(hrAdminBlock.status, 403, 'HR cannot manage user roles');

    // 1c. Manager Flow (Scoped to Engineering)
    const mgrRes = await request({
      method: 'POST',
      url: '/api/auth/login',
      body: { email: 'manager@wfa.com', password: 'Manager@1!' },
    });
    assert.strictEqual(mgrRes.status, 200);
    const mgrToken = mgrRes.body.accessToken;

    const mgrEmpRes = await request({
      url: '/api/employees',
      headers: { Authorization: `Bearer ${mgrToken}` },
    });
    assert.strictEqual(mgrEmpRes.status, 200);
    assert.strictEqual(mgrEmpRes.body.scope.type, 'department');
    assert.strictEqual(mgrEmpRes.body.scope.name, 'Engineering');

    // 1d. Team Lead Flow (Scoped to Product & Design)
    const leadRes = await request({
      method: 'POST',
      url: '/api/auth/login',
      body: { email: 'teamlead@wfa.com', password: 'Tlead@123!' },
    });
    assert.strictEqual(leadRes.status, 200);
    assert.strictEqual(leadRes.body.user.role, 'team_lead');

    // 1e. Employee Flow
    const empRes = await request({
      method: 'POST',
      url: '/api/auth/login',
      body: { email: 'employee@wfa.com', password: 'Emp@123456!' },
    });
    assert.strictEqual(empRes.status, 200);
    const empToken = empRes.body.accessToken;

    const ownProfileRes = await request({
      url: '/api/my-profile',
      headers: { Authorization: `Bearer ${empToken}` },
    });
    assert.strictEqual(ownProfileRes.status, 200);
    assert.ok(ownProfileRes.body.data.email, 'Employee profile must be returned');

    // Employee blocked from team/company endpoints
    const empBlock = await request({
      url: '/api/employees',
      headers: { Authorization: `Bearer ${empToken}` },
    });
    assert.strictEqual(empBlock.status, 403, 'Employee must be blocked from /api/employees');
  });

  // ── 2. Complete MFA Lifecycle (Setup, Verify, Login, Recovery)
  await t.test('2. Complete MFA Lifecycle: Setup, Activation, TOTP Challenge & Recovery Code', async () => {
    // We create a fresh user for MFA E2E testing
    const mfaEmail = 'mfa_flow@wfa.com';
    const mfaPassword = 'MfaPassword@123!';
    // Direct insertion of clean test user
    db.prepare(`DELETE FROM users WHERE email = ?`).run(mfaEmail);
    const hash = (await import('bcryptjs')).default.hashSync(mfaPassword, 10);
    db.prepare(`
      INSERT INTO users (email, password_hash, role, is_active)
      VALUES (?, ?, 'employee', 1)
    `).run(mfaEmail, hash);

    const testUser = db.prepare(`SELECT id FROM users WHERE email = ?`).get(mfaEmail) as { id: number };

    // Step 1: Initial Login before MFA
    const login1 = await request({
      method: 'POST',
      url: '/api/auth/login',
      body: { email: mfaEmail, password: mfaPassword },
    });
    assert.strictEqual(login1.status, 200);
    assert.strictEqual(login1.body.requiresMFA, false);
    const userToken = login1.body.accessToken;

    // Step 2: Setup MFA -> generates secret, qrCodeURI, and 8 backup recovery codes
    const setupRes = await request({
      method: 'POST',
      url: '/api/auth/mfa/setup',
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert.strictEqual(setupRes.status, 200);
    assert.ok(setupRes.body.secret, 'Secret must be returned for setup');
    assert.ok(setupRes.body.qrCodeDataUrl, 'QR code Data URL must be returned');
    assert.ok(setupRes.body.otpAuthUrl, 'OTP Auth URL must be returned');
    assert.strictEqual(setupRes.body.recoveryCodes.length, 8, '8 one-time backup recovery codes must be generated');
    const secret = setupRes.body.secret;
    const recoveryCodeToUse = setupRes.body.recoveryCodes[0];

    // Step 3: Enable MFA using valid TOTP token
    const totpToken = mfaService.generateTOTPToken(secret);
    const enableRes = await request({
      method: 'POST',
      url: '/api/auth/mfa/enable',
      headers: { Authorization: `Bearer ${userToken}` },
      body: { token: totpToken },
    });
    assert.strictEqual(enableRes.status, 200, 'MFA enable should succeed with valid TOTP code');

    // Step 4: Login again -> Now requires MFA challenge
    const login2 = await request({
      method: 'POST',
      url: '/api/auth/login',
      body: { email: mfaEmail, password: mfaPassword },
    });
    assert.strictEqual(login2.status, 200);
    assert.strictEqual(login2.body.requiresMFA, true, 'User with MFA enabled must be challenged');
    assert.strictEqual(login2.body.userId, testUser.id);
    assert.strictEqual(login2.body.accessToken, undefined, 'No access token should be issued before MFA verification');

    // Step 5: Verify MFA challenge with TOTP code -> issues tokens & session
    const freshTotp = mfaService.generateTOTPToken(secret);
    const verifyTotpRes = await request({
      method: 'POST',
      url: '/api/auth/mfa/verify',
      body: { userId: testUser.id, token: freshTotp },
    });
    assert.strictEqual(verifyTotpRes.status, 200, 'MFA TOTP verification must succeed');
    assert.ok(verifyTotpRes.body.accessToken, 'Access token must be granted upon passing MFA');
    assert.ok(verifyTotpRes.body.session.sessionId);

    // Step 6: Backup Recovery Code Login Flow
    // Challenge again
    const login3 = await request({
      method: 'POST',
      url: '/api/auth/login',
      body: { email: mfaEmail, password: mfaPassword },
    });
    assert.strictEqual(login3.body.requiresMFA, true);

    // Complete login using one-time recovery code
    const recoveryRes = await request({
      method: 'POST',
      url: '/api/auth/mfa/verify',
      body: { userId: testUser.id, recoveryCode: recoveryCodeToUse },
    });
    assert.strictEqual(recoveryRes.status, 200, 'Recovery code login must succeed');
    assert.ok(recoveryRes.body.accessToken, 'Token must be granted on recovery code login');

    // Verify recovery code CANNOT be reused
    const reuseRecoveryRes = await request({
      method: 'POST',
      url: '/api/auth/mfa/verify',
      body: { userId: testUser.id, recoveryCode: recoveryCodeToUse },
    });
    assert.strictEqual(reuseRecoveryRes.status, 401, 'Used recovery code must be rejected (single use only)');

    // Step 7: Disable MFA with password and current TOTP
    const tokenForDisable = recoveryRes.body.accessToken;
    const disableTotp = mfaService.generateTOTPToken(secret);
    const disableRes = await request({
      method: 'POST',
      url: '/api/auth/mfa/disable',
      headers: { Authorization: `Bearer ${tokenForDisable}` },
      body: { password: mfaPassword, token: disableTotp },
    });
    assert.strictEqual(disableRes.status, 200, 'MFA disable should succeed');

    // Clean up
    db.prepare(`DELETE FROM users WHERE email = ?`).run(mfaEmail);
  });

  // ── 3. Multi-Device Sessions & Logout-All Flow ───────────────
  await t.test('3. Multi-Device Sessions: Tracking, Revocation, and Logout-All', async () => {
    // Login from Device 1 (Chrome / Desktop)
    const dev1Login = await request({
      method: 'POST',
      url: '/api/auth/login',
      headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0' },
      body: { email: 'admin@wfa.com', password: 'Admin@123!' },
    });
    assert.strictEqual(dev1Login.status, 200);
    const dev1Token = dev1Login.body.accessToken;
    const dev1SessionId = dev1Login.body.session.sessionId;

    // Login from Device 2 (Safari / iPhone)
    const dev2Login = await request({
      method: 'POST',
      url: '/api/auth/login',
      headers: { 'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15' },
      body: { email: 'admin@wfa.com', password: 'Admin@123!' },
    });
    assert.strictEqual(dev2Login.status, 200);
    const dev2Token = dev2Login.body.accessToken;
    const dev2SessionId = dev2Login.body.session.sessionId;
    assert.notStrictEqual(dev1SessionId, dev2SessionId, 'Different sessions must have unique IDs');

    // List active sessions
    const sessionsRes = await request({
      url: '/api/auth/sessions',
      headers: { Authorization: `Bearer ${dev2Token}` },
    });
    assert.strictEqual(sessionsRes.status, 200);
    const activeSessions = sessionsRes.body.data;
    assert.ok(activeSessions.length >= 2, 'Should list both active sessions');

    // Revoke Device 1 session from Device 2
    const revokeRes = await request({
      method: 'DELETE',
      url: `/api/auth/sessions/${dev1SessionId}`,
      headers: { Authorization: `Bearer ${dev2Token}` },
    });
    assert.strictEqual(revokeRes.status, 200, 'Revocation of Device 1 must succeed');

    // Verify Device 1 token is now rejected (session is revoked)
    const dev1Check = await request({
      url: '/api/auth/me',
      headers: { Authorization: `Bearer ${dev1Token}` },
    });
    assert.strictEqual(dev1Check.status, 401, 'Device 1 must be rejected after revocation');

    // Verify Device 2 remains active
    const dev2Check = await request({
      url: '/api/auth/me',
      headers: { Authorization: `Bearer ${dev2Token}` },
    });
    assert.strictEqual(dev2Check.status, 200, 'Device 2 must remain authenticated');

    // Perform Logout-All from Device 2
    const logoutAllRes = await request({
      method: 'POST',
      url: '/api/auth/logout-all',
      headers: { Authorization: `Bearer ${dev2Token}` },
    });
    assert.strictEqual(logoutAllRes.status, 200, 'Logout all devices must succeed');

    // Verify Device 2 is now also terminated
    const dev2AfterLogout = await request({
      url: '/api/auth/me',
      headers: { Authorization: `Bearer ${dev2Token}` },
    });
    assert.strictEqual(dev2AfterLogout.status, 401, 'Device 2 must be revoked after logout-all');
  });

  // ── 4. Unauthenticated & Access Denied Schema ────────────────
  await t.test('4. Security & Error Handling Schema on Protected Endpoints', async () => {
    // 4a. Anonymous access
    const anonRes = await request({ url: '/api/kpi' });
    assert.strictEqual(anonRes.status, 401);
    assert.strictEqual(anonRes.body.success, false);
    assert.ok(anonRes.body.error);

    // 4b. Expired / Malformed Authorization header
    const badAuthRes = await request({
      url: '/api/kpi',
      headers: { Authorization: 'Bearer totally-invalid-token' },
    });
    assert.strictEqual(badAuthRes.status, 401);
    assert.strictEqual(badAuthRes.body.code, 'TOKEN_INVALID');
  });
});
