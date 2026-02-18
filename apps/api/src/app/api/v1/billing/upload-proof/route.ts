import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  authenticatedApiWrapper,
  formatSuccess,
  formatError,
} from '@/lib/core/api-response-middleware';
import { SecureServiceRoleWrapper, asTypedClient } from '@indexnow/database';
import { ErrorHandlingService } from '@/lib/monitoring/error-handling';
import { ErrorType, ErrorSeverity, type Database, getClientIP } from '@indexnow/shared';

// UUID validation for transaction_id from FormData
const transactionIdSchema = z.string().uuid('Invalid transaction ID format');

// Derived types from Database schema
type PaymentTransactionRow = Database['public']['Tables']['indb_payment_transactions']['Row'];

// Allowed file types for payment proof
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * POST /api/v1/billing/upload-proof
 * Upload payment proof for a transaction
 */
export const POST = authenticatedApiWrapper(async (request, auth) => {
  try {
    const formData = await request.formData();
    const proofFile = formData.get('proof_file');
    const transactionId = formData.get('transaction_id');

    // Validate required fields
    if (!proofFile || !(proofFile instanceof File)) {
      const error = await ErrorHandlingService.createError(
        ErrorType.VALIDATION,
        'Missing required field: proof_file must be a file',
        { severity: ErrorSeverity.MEDIUM, statusCode: 400, userId: auth.userId }
      );
      return formatError(error);
    }

    if (!transactionId || typeof transactionId !== 'string') {
      const error = await ErrorHandlingService.createError(
        ErrorType.VALIDATION,
        'Missing required field: transaction_id',
        { severity: ErrorSeverity.MEDIUM, statusCode: 400, userId: auth.userId }
      );
      return formatError(error);
    }

    // Validate transaction_id is a valid UUID
    const uuidValidation = transactionIdSchema.safeParse(transactionId);
    if (!uuidValidation.success) {
      const error = await ErrorHandlingService.createError(
        ErrorType.VALIDATION,
        'Invalid transaction_id: must be a valid UUID',
        { severity: ErrorSeverity.MEDIUM, statusCode: 400, userId: auth.userId }
      );
      return formatError(error);
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(proofFile.type)) {
      const error = await ErrorHandlingService.createError(
        ErrorType.VALIDATION,
        'Invalid file type. Allowed: JPG, PNG, WebP, PDF',
        { severity: ErrorSeverity.MEDIUM, statusCode: 400, userId: auth.userId }
      );
      return formatError(error);
    }

    // Validate file size
    if (proofFile.size > MAX_FILE_SIZE) {
      const error = await ErrorHandlingService.createError(
        ErrorType.VALIDATION,
        'File size exceeds 5MB limit',
        { severity: ErrorSeverity.MEDIUM, statusCode: 400, userId: auth.userId }
      );
      return formatError(error);
    }

    // Verify transaction ownership
    const transaction =
      await SecureServiceRoleWrapper.executeWithUserSession<PaymentTransactionRow | null>(
        asTypedClient(auth.supabase),
        {
          userId: auth.userId,
          operation: 'verify_transaction_ownership',
          source: 'billing/upload-proof',
          reason: 'User verifying transaction ownership before uploading payment proof',
          metadata: { transactionId, endpoint: '/api/v1/billing/upload-proof' },
          ipAddress: getClientIP(request),
          userAgent: request.headers.get('user-agent') ?? undefined,
        },
        { table: 'indb_payment_transactions', operationType: 'select' },
        async (db) => {
          const { data, error } = await db
            .from('indb_payment_transactions')
            .select('*')
            .eq('id', transactionId)
            .eq('user_id', auth.userId)
            .single();

          if (error && error.code !== 'PGRST116') throw error;
          return data;
        }
      );

    if (!transaction) {
      const error = await ErrorHandlingService.createError(
        ErrorType.NOT_FOUND,
        'Transaction not found or access denied',
        { severity: ErrorSeverity.MEDIUM, statusCode: 404, userId: auth.userId }
      );
      return formatError(error);
    }

    // Check transaction status
    if (transaction.status === 'completed' || transaction.status === 'refunded') {
      const error = await ErrorHandlingService.createError(
        ErrorType.BUSINESS_LOGIC,
        'Cannot upload proof for a completed or refunded transaction',
        { severity: ErrorSeverity.MEDIUM, statusCode: 400, userId: auth.userId }
      );
      return formatError(error);
    }

    // Generate unique filename
    const fileExtension = proofFile.name.split('.').pop() ?? 'jpg';
    const fileName = `payment-proof-${transactionId}-${Date.now()}.${fileExtension}`;
    const filePath = `payment-proofs/${auth.userId}/${fileName}`;

    // Upload file to storage and update transaction
    const publicUrl = await SecureServiceRoleWrapper.executeWithUserSession<string>(
      asTypedClient(auth.supabase),
      {
        userId: auth.userId,
        operation: 'upload_payment_proof',
        source: 'billing/upload-proof',
        reason: 'User uploading payment proof and updating transaction status',
        metadata: { transactionId, fileName, fileSize: proofFile.size, fileType: proofFile.type },
        ipAddress: getClientIP(request),
        userAgent: request.headers.get('user-agent') ?? undefined,
      },
      { table: 'indb_payment_transactions', operationType: 'update' },
      async (db) => {
        // Upload file to Supabase Storage
        const { error: uploadError } = await db.storage
          .from('indexnow-public')
          .upload(filePath, proofFile, { cacheControl: '3600', upsert: false });

        if (uploadError) {
          throw new Error(`Failed to upload file: ${uploadError.message}`);
        }

        // Get public URL
        const { data: urlData } = db.storage.from('indexnow-public').getPublicUrl(filePath);

        // Update transaction with proof URL and status
        // Note: Using correct schema columns: proof_url and status (not payment_proof_url and transaction_status)
        const { error: updateError } = await db
          .from('indb_payment_transactions')
          .update({
            proof_url: urlData.publicUrl,
            status: 'proof_uploaded',
            updated_at: new Date().toISOString(),
          })
          .eq('id', transactionId)
          .eq('user_id', auth.userId);

        if (updateError) {
          throw new Error(`Failed to update transaction: ${updateError.message}`);
        }

        return urlData.publicUrl;
      }
    );

    return formatSuccess({
      message: 'Payment proof uploaded successfully',
      file_url: publicUrl,
    });
  } catch (error) {
    const structuredError = await ErrorHandlingService.createError(
      ErrorType.DATABASE,
      error instanceof Error ? error : new Error(String(error)),
      {
        severity: ErrorSeverity.HIGH,
        userId: auth.userId,
        endpoint: '/api/v1/billing/upload-proof',
        method: 'POST',
        statusCode: 500,
      }
    );
    return formatError(structuredError);
  }
});
