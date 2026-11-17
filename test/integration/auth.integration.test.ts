import test from 'node:test';
import assert from 'node:assert/strict';
import { request } from '../utils/testClient.js';
import { runMigrations, getMigrationStatus } from '../../server/db/migrator.js';

test('🚀 Integration Tests - API & RBAC Authorization Flow', async (t) => {
  let adminToken: string;
  let adminSessionId: string;
  let managerToken: string;
  let employeeToken: string;

  await t.test('1. Database migration runner executes and prevents duplicate execution', () => {
    const statusBefore = getMigrationStatus();
    assert.ok(statusBefore.length >= 7, 'All 7 migrations must be recognized');
    assert.ok(statusBefore.every((m) => m.applied), 'All migrations must be marked applied');

    const result = runMigrations();
    assert.strictEqual(result.executed.length, 0, 'No duplicate migrations should run');
    assert.ok(result.skipped.length >= 7, 'Existing migrations should be safely skipped');
  });

  await t.test('2. Admin login receives tokens and creates session', async () => {
    const res = await request({
      method: 'POST',
      url: '/api/auth/login',
      body: { email: 'admin@wfa.com', password: 'Admin@123!' },
    });

    assert.strictEqual(res.status, 200, 'Admin login should succeed');
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.user.role, 'admin');
    assert.ok(res.body.accessToken, 'Access token must be returned');
    assert.ok(res.body.session.sessionId, 'Session ID must be created');

    adminToken = res.body.accessToken;
    adminSessionId = res.body.session.sessionId;
  });

  await t.test('3. Manager login receives department-scoped access', async () => {
    const res = await request({
      method: 'POST',
      url: '/api/auth/login',
      body: { email: 'manager@wfa.com', password: 'Manager@1!' },
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.user.role, 'manager');
    assert.strictEqual(res.body.user.departmentName, 'Engineering');
    managerToken = res.body.accessToken;
  });

  await t.test('4. Employee login receives own profile permissions only', async () => {
    const res = await request({
      method: 'POST',
      url: '/api/auth/login',
      body: { email: 'employee@wfa.com', password: 'Emp@123456!' },
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.user.role, 'employee');
    employeeToken = res.body.accessToken;
  });

  await t.test('5. Role-based API access: Admin accesses audit logs (200), Manager blocked (403)', async () => {
    // Admin access
    const adminRes = await request({
      url: '/api/auth/audit-logs',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(adminRes.status, 200, 'Admin must access audit logs');

    // Manager access -> must be 403 Forbidden
    const mgrRes = await request({
      url: '/api/auth/audit-logs',
      headers: { Authorization: `Bearer ${managerToken}` },
    });
    assert.strictEqual(mgrRes.status, 403, 'Manager must be forbidden from audit logs');
  });

  await t.test('6. Department-level data filtering: Manager receives only Engineering data', async () => {
    const res = await request({
      url: '/api/employees',
      headers: { Authorization: `Bearer ${managerToken}` },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.scope.type, 'department');
    assert.strictEqual(res.body.scope.name, 'Engineering');
    assert.ok(res.body.data.every((e: any) => e.department === 'Engineering'), 'All items must belong to Engineering');
  });

  await t.test('7. Employee accessing /employees blocked by RBAC permission (403)', async () => {
    const res = await request({
      url: '/api/employees',
      headers: { Authorization: `Bearer ${employeeToken}` },
    });
    assert.strictEqual(res.status, 403, 'Employee without view:team must be rejected');
  });

  await t.test('8. Employee accessing own profile /my-profile succeeds (200)', async () => {
    const res = await request({
      url: '/api/my-profile',
      headers: { Authorization: `Bearer ${employeeToken}` },
    });
    assert.strictEqual(res.status, 200, 'Employee should access own profile');
    assert.ok(res.body.data.first_name, 'Profile data should be returned');
  });

  await t.test('9. Active sessions listing and single session revocation', async () => {
    const listRes = await request({
      url: '/api/auth/sessions',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(listRes.status, 200);
    assert.ok(Array.isArray(listRes.body.data));

    // Revoke current session
    const delRes = await request({
      method: 'DELETE',
      url: `/api/auth/sessions/${adminSessionId}`,
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(delRes.status, 200);

    // Using the revoked session's token now yields 401 SESSION_REVOKED
    const testRevokedRes = await request({
      url: '/api/auth/me',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(testRevokedRes.status, 401, 'Revoked session token must be rejected');
    assert.strictEqual(testRevokedRes.body.code, 'SESSION_REVOKED');
  });

  await t.test('10. Logout-all terminates all sessions across devices', async () => {
    // Re-login as manager
    const loginRes = await request({
      method: 'POST',
      url: '/api/auth/login',
      body: { email: 'manager@wfa.com', password: 'Manager@1!' },
    });
    const { accessToken } = loginRes.body;

    const logoutAllRes = await request({
      method: 'POST',
      url: '/api/auth/logout-all',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    assert.strictEqual(logoutAllRes.status, 200);

    // Check that manager token is now rejected
    const checkRes = await request({
      url: '/api/auth/me',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    assert.strictEqual(checkRes.status, 401, 'All sessions revoked should reject prior token');
  });
});
