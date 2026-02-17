/**
 * User-related API request types for IndexNow Studio
 */

import { z } from 'zod';
import { 
  LoginRequest, RegisterRequest, ChangePasswordRequest, UpdateUserSettingsRequest, ResetPasswordRequest,
  loginSchema, registerSchema, changePasswordSchema, updateUserSettingsSchema
} from '../../../schema';

// Proper API key creation schema (distinct from job creation)
export const createApiKeySchema = z.object({
  name: z.string().min(1, 'API key name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  scopes: z.array(z.string()).min(1, 'At least one scope is required'),
  expiresAt: z.date().optional(),
});

// Authentication requests
export type { LoginRequest, RegisterRequest, ChangePasswordRequest, UpdateUserSettingsRequest, ResetPasswordRequest };

export interface ResetPasswordEmailRequest {
  email: string;
  redirectUrl?: string;
}

export interface ConfirmPasswordResetRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

// Authentication requests
// (LoginRequest and RegisterRequest are imported from schema)

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  everywhere?: boolean;
}

// Email verification
export interface SendVerificationEmailRequest {
  email?: string; // If not provided, use current user's email
}

export interface VerifyEmailRequest {
  token: string;
  email: string;
}

// Two-factor authentication
export interface Enable2FARequest {
  password: string;
}

export interface Confirm2FARequest {
  secret: string;
  code: string;
}

export interface Disable2FARequest {
  password: string;
  code: string;
}

export interface Verify2FARequest {
  code: string;
}

// User settings and preferences
// (UpdateUserSettingsRequest is imported from schema)

// API key management
export interface CreateApiKeyRequest {
  name: string;
  description?: string;
  scopes: string[];
  expiresAt?: Date;
}

export interface UpdateApiKeyRequest {
  name?: string;
  description?: string;
  scopes?: string[];
  isActive?: boolean;
}

export interface RevokeApiKeyRequest {
  keyId: string;
}

// User invitation and team management
export interface InviteUserRequest {
  email: string;
  role: string;
  message?: string;
  expiresIn?: number; // hours
}

export interface AcceptInvitationRequest {
  token: string;
  password?: string; // If user doesn't exist yet
  name?: string; // If user doesn't exist yet
}

export interface UpdateUserRoleRequest {
  userId: string;
  role: string;
  reason?: string;
}

// Account management
export interface DeleteAccountRequest {
  password: string;
  reason?: string;
  feedback?: string;
}

export interface SuspendAccountRequest {
  userId: string;
  reason: string;
  duration?: number; // days
  notifyUser?: boolean;
}

export interface ReactivateAccountRequest {
  userId: string;
  reason?: string;
}

// Export user data
export interface ExportUserDataRequest {
  format: 'json' | 'csv' | 'pdf';
  includePersonalData?: boolean;
  includeActivityData?: boolean;
  includeJobData?: boolean;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

// Zod validation schemas
// (Schemas are imported from schema.ts)

// Type inference from schemas
export type LoginRequestBody = z.infer<typeof loginSchema>;
export type RegisterRequestBody = z.infer<typeof registerSchema>;
export type ChangePasswordRequestBody = z.infer<typeof changePasswordSchema>;
export type UpdateUserSettingsRequestBody = z.infer<typeof updateUserSettingsSchema>;
export type CreateApiKeyRequestBody = z.infer<typeof createApiKeySchema>;