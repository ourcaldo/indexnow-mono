import crypto from 'crypto';
import { AppConfig } from '@indexnow/shared';

/**
 * Encryption utility for securing sensitive data
 * Uses AES-256-GCM (authenticated encryption with integrity verification)
 * 
 * Format: IV:AuthTag:EncryptedData (hex-encoded, colon-separated)
 * Backward-compatible: can decrypt legacy AES-256-CBC data (IV:EncryptedData)
 */
export class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly IV_LENGTH = 12; // 96-bit nonce recommended for GCM
  private static readonly AUTH_TAG_LENGTH = 16; // 128-bit auth tag

  // Legacy constants for backward compatibility
  private static readonly LEGACY_ALGORITHM = 'aes-256-cbc';
  private static readonly LEGACY_IV_LENGTH = 16;

  /**
   * Get the 256-bit encryption key from AppConfig.
   * ⚠ NOTE (#29): Currently uses raw UTF-8 bytes of the key string.
   * For enhanced security, consider deriving the key via HKDF or PBKDF2:
   *   const keyMaterial = await crypto.subtle.importKey('raw', Buffer.from(key), 'HKDF', false, ['deriveKey']);
   * This is acceptable if the key is a cryptographically random 32-byte string.
   */
  private static getEncryptionKey(): Buffer {
    const key = AppConfig.security.encryptionKey;
    if (!key) {
      throw new Error('ENCRYPTION_KEY must be configured in AppConfig.security.encryptionKey');
    }
    if (key.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be exactly 32 characters long');
    }
    return Buffer.from(key, 'utf8');
  }

  /**
   * Encrypt sensitive data using AES-256-GCM
   * Format: IV:AuthTag:EncryptedData (all hex-encoded)
   */
  static encrypt(text: string): string {
    try {
      const key = this.getEncryptionKey();
      const iv = crypto.randomBytes(this.IV_LENGTH);
      const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv, {
        authTagLength: this.AUTH_TAG_LENGTH,
      });

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag();

      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown encryption error';
      throw new Error(`Failed to encrypt data: ${errorMessage}`);
    }
  }

  /**
   * Decrypt sensitive data
   * Supports both GCM format (IV:AuthTag:EncryptedData) and legacy CBC format (IV:EncryptedData)
   */
  static decrypt(encryptedText: string): string {
    try {
      const key = this.getEncryptionKey();
      const parts = encryptedText.split(':');

      // GCM format: IV:AuthTag:EncryptedData (3 parts)
      if (parts.length === 3) {
        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encryptedData = parts[2];

        const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv, {
          authTagLength: this.AUTH_TAG_LENGTH,
        });
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
      }

      // Legacy CBC format: IV:EncryptedData (2 parts) — backward compatibility
      if (parts.length === 2) {
        const iv = Buffer.from(parts[0], 'hex');
        const encryptedData = parts[1];

        const decipher = crypto.createDecipheriv(this.LEGACY_ALGORITHM, key, iv);
        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
      }

      throw new Error('Invalid encrypted data format — expected IV:AuthTag:EncryptedData or legacy IV:EncryptedData');
    } catch (error) {
      // (#30) Preserve original error for diagnostics while keeping generic user-facing message
      const originalMsg = error instanceof Error ? error.message : 'Unknown error';
      const wrappedError = new Error(`Failed to decrypt data: ${originalMsg}`);
      (wrappedError as any).cause = error;
      throw wrappedError;
    }
  }

  /**
   * Test if encrypted data can be decrypted with current key
   */
  static testDecryption(encryptedText: string): boolean {
    try {
      this.decrypt(encryptedText);
      return true;
    } catch (error) {
      return false;
    }
  }
}