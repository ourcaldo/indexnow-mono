/**
 * Login Notification Email Service
 * Sends security notifications when users log into their accounts
 */

import { supabaseAdmin, SecureServiceRoleWrapper } from '@indexnow/database';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';

import { DeviceInfo, LocationData } from '../utils/ip-device-utils';

interface LoginNotificationData {
  userId: string;
  userEmail: string;
  userName: string;
  ipAddress: string;
  userAgent: string;
  deviceInfo?: DeviceInfo | null;
  locationData?: LocationData | null;
  loginTime: string;
}

export class LoginNotificationService {
  private static instance: LoginNotificationService;
  
  private constructor() {}
  
  public static getInstance(): LoginNotificationService {
    if (!LoginNotificationService.instance) {
      LoginNotificationService.instance = new LoginNotificationService();
    }
    return LoginNotificationService.instance;
  }

  /**
   * Send login notification email
   */
  async sendLoginNotification(data: LoginNotificationData): Promise<boolean> {
    try {
      console.log('🔐 Preparing to send login notification email to:', data.userEmail);

      // Get SMTP configuration from site settings
      const smtpConfig = await this.getEmailConfiguration();
      
      if (!smtpConfig.enabled) {
        console.log('📧 Email notifications disabled, skipping login notification');
        return false;
      }

      // Load and process email template
      const emailHtml = await this.prepareEmailTemplate(data);
      if (!emailHtml) {
        console.error('❌ Failed to prepare email template, using fallback');
        const fallbackHtml = this.createFallbackEmailContent(data);
        return this.sendEmailWithContent(smtpConfig, data, fallbackHtml);
      }

      return await this.sendEmailWithContent(smtpConfig, data, emailHtml);

    } catch (error) {
      console.error('❌ Failed to send login notification email:', error);
      return false;
    }
  }

  /**
   * Send email with prepared content
   */
  private async sendEmailWithContent(smtpConfig: any, data: LoginNotificationData, emailHtml: string): Promise<boolean> {
    try {
      const transporter = await this.createTransporter(smtpConfig);
      if (!transporter) {
        console.error('❌ Failed to create email transporter');
        return false;
      }

      const mailOptions = {
        from: `${smtpConfig.fromName} <${smtpConfig.fromEmail}>`,
        to: data.userEmail,
        subject: 'Security Alert: New Login to Your IndexNow Studio Account',
        html: emailHtml
      };

      await transporter.sendMail(mailOptions);
      console.log('✅ Login notification email sent successfully to:', data.userEmail);
      return true;

    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return false;
    }
  }

  /**
   * Create simple fallback email content
   */
  private createFallbackEmailContent(data: LoginNotificationData): string {
    const loginTime = new Date(data.loginTime).toLocaleString();
    
    return `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee;">
            <h1 style="color: #0070f3;">IndexNow Studio</h1>
            <p>Hi ${data.userName},</p>
            <div style="background: #f0f7ff; padding: 15px; margin: 20px 0; border-left: 4px solid #0070f3;">
              <strong>🔐 New login detected on your account</strong>
            </div>
            <p>We detected a new login to your IndexNow Studio account:</p>
            <ul>
              <li><strong>Time:</strong> ${loginTime}</li>
              <li><strong>IP Address:</strong> ${data.ipAddress}</li>
              <li><strong>Email:</strong> ${data.userEmail}</li>
            </ul>
            <p>If this wasn't you, please secure your account immediately by resetting your password.</p>
            <p>Best regards,<br>The IndexNow Studio Security Team</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Get email configuration from site settings
   */
  private async getEmailConfiguration() {
    try {
      const settings = await SecureServiceRoleWrapper.executeSecureOperation(
        {
          userId: 'system',
          operation: 'get_smtp_settings_for_login_notification',
          reason: 'Retrieving SMTP configuration for sending login security notification emails',
          source: 'email/login-notification-service',
          metadata: {
            operation_type: 'smtp_config_lookup',
            email_type: 'login_notification'
          }
        },
        {
          table: 'indb_site_settings',
          operationType: 'select',
          columns: ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from_name', 'smtp_from_email', 'smtp_secure', 'smtp_enabled']
        },
        async () => {
          const { data: settings, error } = await supabaseAdmin
            .from('indb_site_settings')
            .select('smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from_name, smtp_from_email, smtp_secure, smtp_enabled')
            .single();

          if (error) return null;
          return settings;
        }
      );

      if (!settings || !settings.smtp_enabled) {
        return this.getFallbackEmailConfiguration();
      }

      return {
        enabled: true,
        host: settings.smtp_host,
        port: settings.smtp_port || 465,
        user: settings.smtp_user,
        pass: settings.smtp_pass,
        secure: settings.smtp_secure !== false,
        fromName: settings.smtp_from_name || 'IndexNow Studio',
        fromEmail: settings.smtp_from_email
      };

    } catch (error) {
      return this.getFallbackEmailConfiguration();
    }
  }

  /**
   * Fallback to environment variables
   */
  private getFallbackEmailConfiguration() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    
    if (!host || !user) {
      return { enabled: false };
    }

    return {
      enabled: true,
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '465'),
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      secure: process.env.SMTP_SECURE !== 'false',
      fromName: process.env.SMTP_FROM_NAME || 'IndexNow Studio',
      fromEmail: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER
    };
  }

  /**
   * Create email transporter
   */
  private async createTransporter(config: any) {
    try {
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.user,
          pass: config.pass
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      await transporter.verify();
      return transporter;
    } catch (error) {
      return null;
    }
  }

  /**
   * Prepare email template
   */
  private async prepareEmailTemplate(data: LoginNotificationData): Promise<string | null> {
    try {
      const templatePath = path.resolve(process.cwd(), '..', '..', 'packages', 'mail', 'src', 'templates', 'login-notification.html');
      
      if (!fs.existsSync(templatePath)) {
        console.error('❌ Login notification template not found at:', templatePath);
        return null;
      }
      
      let template = fs.readFileSync(templatePath, 'utf8');

      const deviceInfo = data.deviceInfo;
      const locationData = data.locationData;

      const location = this.formatLocation(locationData);
      const deviceType = deviceInfo?.type || 'Unknown Device';
      const browser = deviceInfo?.browser || 'Unknown';
      const operatingSystem = deviceInfo?.os || 'Unknown';
      
      const loginTime = new Date(data.loginTime).toLocaleString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
      });

      const replacements: Record<string, string> = {
        '{{userName}}': data.userName || data.userEmail.split('@')[0],
        '{{userEmail}}': data.userEmail,
        '{{loginTime}}': loginTime,
        '{{ipAddress}}': data.ipAddress || 'Unknown',
        '{{location}}': location,
        '{{deviceType}}': deviceType,
        '{{browser}}': browser,
        '{{operatingSystem}}': operatingSystem,
        '{{secureAccountUrl}}': `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/forgot-password`
      };

      for (const [placeholder, value] of Object.entries(replacements)) {
        template = template.replace(new RegExp(placeholder, 'g'), value);
      }

      return template;
    } catch (error) {
      return null;
    }
  }

  private formatLocation(locationData: LocationData | null | undefined): string {
    if (!locationData) return 'Unknown Location';
    const parts = [];
    if (locationData.city) parts.push(locationData.city);
    if (locationData.region) parts.push(locationData.region);
    if (locationData.country) parts.push(locationData.country);
    return parts.length > 0 ? parts.join(', ') : 'Unknown Location';
  }
}

export const loginNotificationService = LoginNotificationService.getInstance();
