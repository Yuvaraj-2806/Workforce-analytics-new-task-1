import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128-bit IV for AES-GCM

function getEncryptionKey(): Buffer {
  const keyHex = process.env.MFA_ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) {
    // Fallback deterministic 32-byte key for safety if unset
    console.warn('⚠️ Warning: MFA_ENCRYPTION_KEY not set or invalid (must be 64-char hex string). Using fallback key.');
    return crypto.scryptSync('wfa-mfa-default-key-secret-salt-2026', 'salt', 32);
  }
  return Buffer.from(keyHex, 'hex');
}

/**
 * Encrypts sensitive data (e.g. MFA secret) using AES-256-GCM with authentication tag.
 * Returns string formatted as: `iv:authTag:ciphertext` (all in hex).
 */
export function encryptData(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts data that was encrypted with AES-256-GCM.
 * Validates the auth tag to ensure integrity before returning plaintext.
 */
export function decryptData(encryptedString: string): string {
  if (!encryptedString || !encryptedString.includes(':')) {
    // If not encrypted in new format, return as is (for backwards compatibility)
    return encryptedString;
  }

  const parts = encryptedString.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }

  const [ivHex, authTagHex, ciphertext] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * SHA-256 hash helper for tokens and recovery codes.
 */
export function hashString(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/**
 * Generates cryptographically secure random token (hex).
 */
export function generateRandomToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Generates one-time backup recovery codes.
 * Returns an array of human-readable codes, e.g. ["A3F8-9BC2", ...]
 */
export function generateBackupRecoveryCodes(count: number = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const raw = crypto.randomBytes(4).toString('hex').toUpperCase();
    const formatted = `${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
    codes.push(formatted);
  }
  return codes;
}
