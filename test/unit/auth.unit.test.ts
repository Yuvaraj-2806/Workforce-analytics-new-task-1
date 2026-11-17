import test from 'node:test';
import assert from 'node:assert/strict';
import { authService } from '../../server/services/authService.js';
import { sessionService } from '../../server/services/sessionService.js';
import { mfaService } from '../../server/services/mfaService.js';
import { encryptData, decryptData } from '../../server/utils/crypto.js';
import { db } from '../../server/db/database.js';

test('🔐 Unit Tests - Authentication, Authorization & RBAC', async (t) => {
  // Test User fixture
  const testEmail = `unit-test-${Date.now()}@wfa.com`;
  const plainPassword = 'Password@123!';
  const hashedPassword = await authService.hashPassword(plainPassword);

  const insertUser = db.prepare(`
    INSERT INTO users (email, password_hash, role, is_active)
    VALUES (?, ?, 'manager', 1)
  `).run(testEmail, hashedPassword);
  const userId = Number(insertUser.lastInsertRowid);

  await t.test('1. Session creation and expiration tracking', () => {
    const session = sessionService.createSession(userId, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    assert.ok(session.session_id, 'Session ID must be generated');
    assert.strictEqual(session.user_id, userId, 'Session must be linked to user ID');
    assert.strictEqual(session.device, 'Windows PC', 'Device must be parsed from user-agent');
    assert.strictEqual(session.is_revoked, 0, 'New session must not be revoked');

    const isValid = sessionService.isSessionValid(session.session_id);
    assert.strictEqual(isValid, true, 'Active session must be valid');
  });

  await t.test('2. Session revocation', () => {
    const session = sessionService.createSession(userId, '192.168.1.1', 'iPhone');
    const revoked = sessionService.revokeSession(session.session_id, userId);
    assert.strictEqual(revoked, true, 'Revocation must return true');

    const isValid = sessionService.isSessionValid(session.session_id);
    assert.strictEqual(isValid, false, 'Revoked session must not be valid');
  });

  await t.test('3. MFA secret encryption and decryption (AES-256-GCM)', () => {
    const plainSecret = 'JBSWY3DPEHPK3PXP';
    const encrypted = encryptData(plainSecret);
    assert.notStrictEqual(encrypted, plainSecret, 'Encrypted secret must not be plaintext');
    assert.ok(encrypted.includes(':'), 'Encrypted secret must contain iv:authTag:ciphertext format');

    const decrypted = decryptData(encrypted);
    assert.strictEqual(decrypted, plainSecret, 'Decrypted secret must match original secret');
  });

  await t.test('4. MFA recovery code generation, hashing, and single-use consumption', async () => {
    const setup = await mfaService.setupMFA(userId, testEmail);
    assert.strictEqual(setup.recoveryCodes.length, 8, 'Must generate exactly 8 recovery codes');

    const firstCode = setup.recoveryCodes[0];

    // First use must succeed
    const firstVerify = mfaService.verifyCode(userId, firstCode);
    assert.strictEqual(firstVerify.valid, true, 'Valid recovery code must verify');
    assert.strictEqual(firstVerify.method, 'recovery_code', 'Method must be recovery_code');

    // Second use of the same code must FAIL (prevent replay)
    const secondVerify = mfaService.verifyCode(userId, firstCode);
    assert.strictEqual(secondVerify.valid, false, 'Used recovery code must not be reusable');
  });

  await t.test('5. Permission checking across roles', () => {
    const adminUser = authService.getUserWithPermissions('admin@wfa.com');
    assert.ok(adminUser, 'Admin demo user must exist');
    assert.ok(adminUser.permissions.includes('manage:users'), 'Admin must have manage:users');
    assert.ok(adminUser.permissions.includes('view:audit_logs'), 'Admin must have view:audit_logs');

    const empUser = authService.getUserWithPermissions('employee@wfa.com');
    assert.ok(empUser, 'Employee demo user must exist');
    assert.ok(empUser.permissions.includes('view:own_profile'), 'Employee must have view:own_profile');
    assert.strictEqual(empUser.permissions.includes('manage:users'), false, 'Employee must NOT have manage:users');
    assert.strictEqual(empUser.permissions.includes('view:all_employees'), false, 'Employee must NOT have view:all_employees');
  });

  await t.test('6. Refresh-token rotation and reuse detection (token family revocation)', () => {
    const familyId = `family-${Date.now()}`;
    const initialRefreshToken = authService.generateRefreshToken(userId, testEmail, familyId);
    authService.storeRefreshToken(userId, initialRefreshToken, familyId);

    // Normal rotation: Rotate first time
    const rotate1 = authService.verifyAndRotateRefreshToken(initialRefreshToken);
    assert.strictEqual(rotate1.valid, true, 'First rotation must succeed');
    assert.ok(rotate1.newRefreshToken, 'Must return new rotated refresh token');

    // ATTACK SIMULATION: Attacker replays initialRefreshToken (already rotated)
    const replayAttack = authService.verifyAndRotateRefreshToken(initialRefreshToken);
    assert.strictEqual(replayAttack.valid, false, 'Replaying rotated token must fail');
    assert.strictEqual(replayAttack.reuseDetected, true, 'Reuse detection must trigger');

    // Check that family was revoked: subsequent rotation of new token also fails
    const newRotated = rotate1.newRefreshToken!;
    const afterCompromise = authService.verifyAndRotateRefreshToken(newRotated);
    assert.strictEqual(afterCompromise.valid, false, 'Entire family must be revoked after reuse');
  });

  // Cleanup test user
  db.prepare(`DELETE FROM users WHERE id = ?`).run(userId);
});
