import { generateSecret, generateURI, generateSync, verifySync } from 'otplib';
import QRCode from 'qrcode';
import bcrypt from 'bcryptjs';
import { db } from '../db/database.js';
import {
  encryptData,
  decryptData,
  generateBackupRecoveryCodes,
  hashString,
} from '../utils/crypto.js';

const MFA_ISSUER = process.env.MFA_ISSUER || 'WFA Platform';

export const mfaService = {
  /**
   * Initializes MFA setup for a user:
   * - Generates new TOTP secret and encrypts it with AES-256-GCM before DB write
   * - Generates 8 one-time backup recovery codes, hashes them, and stores in SQLite
   * - Generates QR code for Google Authenticator / Authy
   * - Does NOT activate MFA until confirmed with a valid token
   */
  async setupMFA(
    userId: number,
    email: string
  ): Promise<{ qrCodeDataUrl: string; otpAuthUrl: string; recoveryCodes: string[] }> {
    const plainSecret = generateSecret();
    const encryptedSecret = encryptData(plainSecret);
    const otpAuthUrl = generateURI({
      secret: plainSecret,
      label: email,
      issuer: MFA_ISSUER,
    });
    const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl);

    // Generate 8 one-time backup recovery codes
    const plainRecoveryCodes = generateBackupRecoveryCodes(8);

    // Save in transaction: update secret (unverified) and store hashed recovery codes
    const setupTx = db.transaction(() => {
      db.prepare(`
        UPDATE users
        SET mfa_secret = ?, mfa_verified = 0
        WHERE id = ?
      `).run(encryptedSecret, userId);

      // Invalidate any older unused recovery codes
      db.prepare(`DELETE FROM mfa_recovery_codes WHERE user_id = ?`).run(userId);

      // Store hashed recovery codes
      const insertStmt = db.prepare(`
        INSERT INTO mfa_recovery_codes (user_id, code_hash, used)
        VALUES (?, ?, 0)
      `);
      for (const code of plainRecoveryCodes) {
        const hashed = hashString(code.toUpperCase().replace(/\s+/g, ''));
        insertStmt.run(userId, hashed);
      }
    });

    setupTx();

    return {
      secret: plainSecret,
      qrCodeDataUrl,
      otpAuthUrl,
      recoveryCodes: plainRecoveryCodes,
    };
  },

  /**
   * Helper to generate a live TOTP code for testing / client simulations
   */
  generateTOTPToken(secret: string): string {
    return generateSync({ secret });
  },

  /**
   * Confirms MFA setup using a valid TOTP code to activate MFA on the account.
   */
  enableMFA(userId: number, token: string): boolean {
    const user = db.prepare(`SELECT mfa_secret FROM users WHERE id = ?`).get(userId) as
      | { mfa_secret: string | null }
      | undefined;

    if (!user || !user.mfa_secret) {
      return false;
    }

    try {
      const plainSecret = decryptData(user.mfa_secret);
      const res = verifySync({ token: token.trim(), secret: plainSecret });
      if (res && res.valid) {
        db.prepare(`
          UPDATE users
          SET mfa_enabled = 1, mfa_verified = 1, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(userId);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error during MFA enablement:', err);
      return false;
    }
  },

  /**
   * Verifies either a 6-digit TOTP code or an 8-character recovery code.
   * If a recovery code is used, it is atomically marked as used (one-time use).
   */
  verifyCode(
    userId: number,
    code: string
  ): { valid: boolean; method?: 'totp' | 'recovery_code' } {
    const user = db.prepare(`SELECT mfa_secret, mfa_enabled FROM users WHERE id = ?`).get(userId) as
      | { mfa_secret: string | null; mfa_enabled: number }
      | undefined;

    if (!user || !user.mfa_secret) {
      return { valid: false };
    }

    const cleanCode = code.trim().replace(/\s+/g, '');

    // 1. Check if it's a 6-digit TOTP token
    if (/^\d{6}$/.test(cleanCode)) {
      try {
        const plainSecret = decryptData(user.mfa_secret);
        const res = verifySync({ token: cleanCode, secret: plainSecret });
        if (res && res.valid) {
          return { valid: true, method: 'totp' };
        }
      } catch (err) {
        console.error('TOTP verification error:', err);
      }
    }

    // 2. Check if it's a backup recovery code
    const hashedInput = hashString(cleanCode.toUpperCase());
    const recoveryRecord = db.prepare(`
      SELECT id FROM mfa_recovery_codes
      WHERE user_id = ? AND code_hash = ? AND used = 0
    `).get(userId, hashedInput) as { id: number } | undefined;

    if (recoveryRecord) {
      // Mark code as used
      db.prepare(`
        UPDATE mfa_recovery_codes
        SET used = 1, used_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(recoveryRecord.id);

      return { valid: true, method: 'recovery_code' };
    }

    return { valid: false };
  },

  /**
   * Disables MFA for an account. Requires:
   * 1. Re-verifying account password
   * 2. Re-verifying valid TOTP or unused recovery code
   */
  async disableMFA(
    userId: number,
    passwordPlain: string,
    verificationCode: string
  ): Promise<{ success: boolean; error?: string }> {
    const user = db.prepare(`SELECT password_hash, mfa_secret, mfa_enabled FROM users WHERE id = ?`).get(userId) as
      | { password_hash: string; mfa_secret: string | null; mfa_enabled: number }
      | undefined;

    if (!user) {
      return { success: false, error: 'User not found.' };
    }

    if (!user.mfa_enabled) {
      return { success: false, error: 'MFA is not enabled on this account.' };
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(passwordPlain, user.password_hash);
    if (!passwordMatch) {
      return { success: false, error: 'Incorrect account password.' };
    }

    // Verify MFA token or recovery code
    const codeCheck = this.verifyCode(userId, verificationCode);
    if (!codeCheck.valid) {
      return { success: false, error: 'Invalid MFA verification or recovery code.' };
    }

    // Deactivate MFA and purge secrets & recovery codes
    const disableTx = db.transaction(() => {
      db.prepare(`
        UPDATE users
        SET mfa_enabled = 0, mfa_verified = 0, mfa_secret = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(userId);

      db.prepare(`DELETE FROM mfa_recovery_codes WHERE user_id = ?`).run(userId);
    });

    disableTx();
    return { success: true };
  },

  /**
   * Retrieves remaining unused recovery codes count.
   */
  getRemainingRecoveryCodesCount(userId: number): number {
    const row = db.prepare(`
      SELECT COUNT(*) as count FROM mfa_recovery_codes
      WHERE user_id = ? AND used = 0
    `).get(userId) as { count: number };
    return row?.count || 0;
  },
};
