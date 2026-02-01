/**
 * Response Encryptor
 * Encrypts sensitive API response data for enhanced security
 * 
 * Part of Enhancement #6: API Security Middleware
 */

import { type Json } from '@indexnow/shared';
import crypto from 'crypto';
import { keyManager, EncryptionKeyInfo } from './key-manager';

export interface EncryptionOptions {
  enabled: boolean;
  encryptionLevel: 'basic' | 'enhanced' | 'maximum';
  forceEncryption?: boolean;
  customFieldSelectors?: string[];
}

export interface EncryptedResponse {
  data: Json;
  encrypted: Record<string, string>;
  keyId: string;
  algorithm: string;
  timestamp: number;
}

export interface EncryptionResult {
  shouldEncrypt: boolean;
  encrypted?: EncryptedResponse;
  original: Json;
  metadata: {
    encryptionLevel: string;
    fieldsEncrypted: string[];
    responseSize: number;
    encryptedSize?: number;
    error?: string;
  };
}

/**
 * Response Encryptor Service
 * Encrypts sensitive fields in API responses
 */
export class ResponseEncryptor {
  private static instance: ResponseEncryptor;
  private readonly algorithm = 'aes-256-gcm';

  static getInstance(): ResponseEncryptor {
    if (!ResponseEncryptor.instance) {
      ResponseEncryptor.instance = new ResponseEncryptor();
    }
    return ResponseEncryptor.instance;
  }

  /**
   * Encrypt response data based on sensitivity and configuration
   */
  async encryptResponse(
    responseData: Json,
    endpoint: string,
    userRole: string = 'user',
    options: EncryptionOptions
  ): Promise<EncryptionResult> {
    try {
      if (!options.enabled) {
        return this.createResult(false, responseData, options.encryptionLevel, []);
      }

      // Determine fields to encrypt based on endpoint and level
      const fieldsToEncrypt = this.getFieldsToEncrypt(endpoint, options.encryptionLevel);

      if (fieldsToEncrypt.length === 0 && !options.forceEncryption) {
        return this.createResult(false, responseData, options.encryptionLevel, []);
      }

      // Get encryption key
      const keyInfo = await keyManager.getCurrentKey();

      // Clone response data for processing
      const processedData = JSON.parse(JSON.stringify(responseData));
      const encryptedFields: Record<string, string> = {};
      const actualFieldsEncrypted: string[] = [];

      // Encrypt specified fields
      for (const fieldPath of fieldsToEncrypt) {
        const fieldValue = this.getNestedValue(processedData, fieldPath);

        if (fieldValue !== undefined && fieldValue !== null) {
          const encrypted = await this.encryptField(fieldValue, keyInfo);
          encryptedFields[fieldPath] = encrypted;
          actualFieldsEncrypted.push(fieldPath);

          // Remove or mask original field
          this.setNestedValue(processedData, fieldPath, '[ENCRYPTED]');
        }
      }

      if (actualFieldsEncrypted.length === 0 && !options.forceEncryption) {
        return this.createResult(false, responseData, options.encryptionLevel, []);
      }

      // Create encrypted response
      const encryptedResponse: EncryptedResponse = {
        data: processedData as Json,
        encrypted: encryptedFields,
        keyId: keyInfo.keyId,
        algorithm: this.algorithm,
        timestamp: Date.now()
      };

      const originalSize = JSON.stringify(responseData).length;
      const encryptedSize = JSON.stringify(encryptedResponse).length;

      return {
        shouldEncrypt: true,
        encrypted: encryptedResponse,
        original: responseData,
        metadata: {
          encryptionLevel: options.encryptionLevel,
          fieldsEncrypted: actualFieldsEncrypted,
          responseSize: originalSize,
          encryptedSize
        }
      };

    } catch (error) {
      console.error('Response encryption error:', error);
      return this.createResult(false, responseData, options.encryptionLevel, [], `Encryption failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Decrypt response data (for client-side use)
   */
  async decryptResponse(encryptedResponse: EncryptedResponse): Promise<Json> {
    try {
      const keyInfo = await keyManager.getKey(encryptedResponse.keyId);
      if (!keyInfo) {
        throw new Error(`Encryption key not found: ${encryptedResponse.keyId}`);
      }

      const decryptedData = JSON.parse(JSON.stringify(encryptedResponse.data));

      // Decrypt each encrypted field
      for (const [fieldPath, encryptedValue] of Object.entries(encryptedResponse.encrypted)) {
        const decryptedValue = await this.decryptField(encryptedValue, keyInfo);
        this.setNestedValue(decryptedData, fieldPath, decryptedValue);
      }

      return decryptedData as Json;

    } catch (error) {
      console.error('Response decryption error:', error);
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get fields to encrypt based on endpoint and security level
   */
  private getFieldsToEncrypt(endpoint: string, level: string): string[] {
    const fieldMaps = {
      basic: this.getBasicEncryptionFields(endpoint),
      enhanced: this.getEnhancedEncryptionFields(endpoint),
      maximum: this.getMaximumEncryptionFields(endpoint)
    };

    return fieldMaps[level as keyof typeof fieldMaps] || [];
  }

  /**
   * Basic encryption fields (most sensitive data only)
   */
  private getBasicEncryptionFields(endpoint: string): string[] {
    const patterns = [
      { pattern: /\/api\/v1\/billing\//, fields: ['paymentMethod.cardNumber', 'billingAddress'] },
      { pattern: /\/api\/v1\/payments\//, fields: ['cardDetails', 'bankAccount'] },
      { pattern: /\/api\/v1\/admin\/users\//, fields: ['password', 'apiKey'] },
      { pattern: /\/api\/v1\/auth\/user\/profile/, fields: ['apiKeys', 'serviceAccounts.credentials'] }
    ];

    for (const { pattern, fields } of patterns) {
      if (pattern.test(endpoint)) {
        return fields;
      }
    }

    return [];
  }

  /**
   * Enhanced encryption fields (includes PII)
   */
  private getEnhancedEncryptionFields(endpoint: string): string[] {
    const basicFields = this.getBasicEncryptionFields(endpoint);

    const enhancedPatterns = [
      { pattern: /\/api\/v1\/billing\//, fields: [...basicFields, 'email', 'phone', 'fullName'] },
      { pattern: /\/api\/v1\/admin\/users\//, fields: [...basicFields, 'personalInfo', 'contactDetails'] },
      { pattern: /\/api\/v1\/auth\/user\/profile/, fields: [...basicFields, 'profile.email', 'profile.phone'] }
    ];

    for (const { pattern, fields } of enhancedPatterns) {
      if (pattern.test(endpoint)) {
        return fields;
      }
    }

    return basicFields;
  }

  /**
   * Maximum encryption fields (everything sensitive)
   */
  private getMaximumEncryptionFields(endpoint: string): string[] {
    const enhancedFields = this.getEnhancedEncryptionFields(endpoint);

    const maximumPatterns = [
      { pattern: /\/api\/v1\/billing\//, fields: [...enhancedFields, 'transactionHistory', 'subscriptionDetails', 'usage'] },
      { pattern: /\/api\/v1\/admin\//, fields: [...enhancedFields, 'systemInfo', 'auditLogs', 'settingsData'] },
      { pattern: /\/api\/v1\/indexing\//, fields: [...enhancedFields, 'urls', 'jobResults'] }
    ];

    for (const { pattern, fields } of maximumPatterns) {
      if (pattern.test(endpoint)) {
        return fields;
      }
    }

    return enhancedFields;
  }

  /**
   * Encrypt a single field value
   */
  private async encryptField(value: Json, keyInfo: EncryptionKeyInfo): Promise<string> {
    const data = typeof value === 'string' ? value : JSON.stringify(value);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, keyInfo.key);

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag ? cipher.getAuthTag().toString('hex') : '';

    return `${iv.toString('hex')}:${encrypted}:${authTag}`;
  }

  /**
   * Decrypt a single field value
   */
  private async decryptField(encryptedValue: string, keyInfo: EncryptionKeyInfo): Promise<Json> {
    const [ivHex, encrypted, authTagHex] = encryptedValue.split(':');

    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipher(this.algorithm, keyInfo.key);

    if (authTagHex && decipher.setAuthTag) {
      decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    }

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    // Try to parse as JSON, fallback to string
    try {
      return JSON.parse(decrypted);
    } catch {
      return decrypted;
    }
  }

  /**
   * Get nested value from object using dot notation path
   */
  private getNestedValue(obj: unknown, path: string): Json | undefined {
    const keys = path.split('.');
    let current: any = obj; // Internal utility still needs to traverse dynamic structure
    
    for (const key of keys) {
      if (current === null || typeof current !== 'object' || !(key in current)) {
        return undefined;
      }
      current = current[key];
    }
    
    return current as Json;
  }

  /**
   * Set nested value in object using dot notation path
   */
  private setNestedValue(obj: unknown, path: string, value: Json): void {
    if (obj === null || typeof obj !== 'object') return;
    
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    let current: any = obj;

    for (const key of keys) {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }

    current[lastKey] = value;
  }

  /**
   * Create standardized result object
   */
  private createResult(
    shouldEncrypt: boolean,
    original: Json,
    encryptionLevel: string,
    fieldsEncrypted: string[],
    error?: string
  ): EncryptionResult {
    return {
      shouldEncrypt,
      original,
      metadata: {
        encryptionLevel,
        fieldsEncrypted,
        responseSize: JSON.stringify(original).length,
        ...(error && { error })
      }
    };
  }
}

// Export singleton instance
export const responseEncryptor = ResponseEncryptor.getInstance();