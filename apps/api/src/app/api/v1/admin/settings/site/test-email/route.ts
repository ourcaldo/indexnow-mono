/**
 * Admin API - Test SMTP Email Configuration
 * Allows admin to test email settings before saving
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { type AdminUser } from '@indexnow/auth';
import * as nodemailer from 'nodemailer';
import { ErrorType, ErrorSeverity } from '@indexnow/shared';
import {
    adminApiWrapper,
    formatSuccess,
    formatError,
    createStandardError
} from '@/lib/core/api-response-middleware';
import { logger } from '@/lib/monitoring/error-handling';
import { ActivityLogger, ActivityEventTypes } from '@/lib/monitoring/activity-logger';

const smtpTestSchema = z.object({
    smtp_host: z.string().min(1, 'SMTP host is required'),
    smtp_port: z.coerce.number().int().min(1).max(65535).default(465),
    smtp_user: z.string().min(1, 'SMTP user is required'),
    smtp_pass: z.string().min(1, 'SMTP password is required'),
    smtp_from_name: z.string().max(100).optional(),
    smtp_from_email: z.string().email('Invalid from email address'),
    smtp_secure: z.boolean().optional().default(true),
}).strict();

export const POST = adminApiWrapper(async (request: NextRequest, adminUser: AdminUser) => {
    const rawBody = await request.json();

    const validation = smtpTestSchema.safeParse(rawBody);
    if (!validation.success) {
        return formatError(await createStandardError(
            ErrorType.VALIDATION,
            validation.error.issues[0]?.message || 'Invalid SMTP configuration',
            { statusCode: 400, severity: ErrorSeverity.LOW }
        ));
    }

    const {
        smtp_host,
        smtp_port,
        smtp_user,
        smtp_pass,
        smtp_from_name,
        smtp_from_email,
        smtp_secure
    } = validation.data;

    // Create transporter with provided settings
    const transporter = nodemailer.createTransport({
        host: smtp_host,
        port: smtp_port,
        secure: smtp_secure,
        auth: {
            user: smtp_user,
            pass: smtp_pass
        },
        tls: {
            rejectUnauthorized: true
        }
    });

    // Test the connection
    try {
        await transporter.verify();
    } catch (verifyError) {
        logger.error({ error: verifyError instanceof Error ? verifyError.message : String(verifyError) }, 'SMTP verification failed:');
        return formatError(await createStandardError(
            ErrorType.EXTERNAL_API,
            `SMTP connection failed: ${verifyError instanceof Error ? verifyError.message : 'Unknown error'}`,
            { statusCode: 400, severity: ErrorSeverity.MEDIUM }
        ));
    }

    const emailColors = {
        brandPrimary: '#1A1A1A',
        brandAccent: '#3D8BFF',
        brandText: '#6C757D',
        secondary: '#F7F9FC',
        background: '#FFFFFF',
        border: '#E0E6ED',
        lightBlueBg: '#F0F9FF'
    };

    // Send test email
    const testEmailOptions = {
        from: `${smtp_from_name || 'IndexNow Studio'} <${smtp_from_email}>`,
        to: adminUser?.email || smtp_from_email,
        subject: 'IndexNow Studio - SMTP Test Email',
        html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SMTP Test Email</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: ${emailColors.brandPrimary}; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: ${emailColors.secondary}; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
          <h1 style="color: ${emailColors.brandAccent}; margin: 0 0 10px 0; font-size: 24px;">✅ SMTP Test Successful</h1>
          <p style="margin: 0; color: ${emailColors.brandText};">Your email configuration is working correctly!</p>
        </div>
        
        <div style="background: ${emailColors.background}; border: 1px solid ${emailColors.border}; border-radius: 8px; padding: 20px;">
          <h2 style="color: ${emailColors.brandPrimary}; margin: 0 0 15px 0; font-size: 18px;">Configuration Details</h2>
          <ul style="margin: 0; padding-left: 20px; color: ${emailColors.brandText};">
            <li><strong>SMTP Host:</strong> ${smtp_host}</li>
            <li><strong>SMTP Port:</strong> ${smtp_port}</li>
            <li><strong>Username:</strong> ${smtp_user}</li>
            <li><strong>Security:</strong> ${smtp_secure ? 'TLS/SSL Enabled' : 'No encryption'}</li>
            <li><strong>From Address:</strong> ${smtp_from_email}</li>
          </ul>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: ${emailColors.lightBlueBg}; border-radius: 8px; border-left: 4px solid ${emailColors.brandAccent};">
          <p style="margin: 0; color: ${emailColors.brandPrimary}; font-size: 14px;">
            <strong>Test completed at:</strong> ${new Date().toLocaleString()}<br>
            <strong>Tested by:</strong> ${adminUser?.email || 'Admin'}
          </p>
        </div>
        
        <div style="margin-top: 30px; text-align: center; color: ${emailColors.brandText}; font-size: 12px;">
          <p>IndexNow Studio - Professional URL Indexing Platform</p>
        </div>
      </body>
      </html>
    `
    };

    try {
        await transporter.sendMail(testEmailOptions);
    } catch (sendError) {
        logger.error({ error: sendError instanceof Error ? sendError.message : String(sendError) }, 'Failed to send test email:');
        return formatError(await createStandardError(
            ErrorType.EXTERNAL_API,
            `Failed to send test email: ${sendError instanceof Error ? sendError.message : 'Unknown error'}`,
            { statusCode: 400, severity: ErrorSeverity.MEDIUM }
        ));
    }

    // Log email test activity
    if (adminUser?.id) {
        try {
            await ActivityLogger.logAdminAction(
                adminUser.id,
                'test_smtp',
                undefined,
                'Tested SMTP email configuration',
                undefined,
                {
                    section: 'site_settings',
                    action: 'test_smtp',
                    adminEmail: adminUser.email,
                    smtpHost: smtp_host,
                    testRecipient: adminUser.email
                }
            );
        } catch (logError) {
            logger.error({ error: logError instanceof Error ? logError.message : String(logError) }, 'Failed to log email test activity:');
        }
    }

    return formatSuccess({
        message: `Test email sent successfully to ${adminUser?.email || smtp_from_email}`
    });
});
