import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';
import { config } from '../config.js';

/**
 * Load and validate the AES-256 master key. Throws a clear error if it is
 * missing or the wrong length instead of failing cryptically inside the cipher.
 */
function getMasterKey(): Buffer {
  const key = Buffer.from(config.encryption.masterKey || '', 'hex');
  if (key.length !== 32) {
    throw new Error(
      'ENCRYPTION_MASTER_KEY must be a 32-byte hex string (64 hex chars). ' +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  return key;
}

export function encryptPrivateKey(privateKey: string): { encrypted: string; iv: string } {
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-gcm', getMasterKey(), iv);
  let encrypted = cipher.update(privateKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return {
    encrypted: encrypted + ':' + authTag,
    iv: iv.toString('hex'),
  };
}

export function decryptPrivateKey(encrypted: string, iv: string): string {
  const [data, authTag] = encrypted.split(':');
  const decipher = createDecipheriv('aes-256-gcm', getMasterKey(), Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  let decrypted = decipher.update(data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function generateAccessToken(): string {
  return `castle_${randomBytes(32).toString('hex')}`;
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
