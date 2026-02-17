import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AppConfig, logger } from '@indexnow/shared';

// Resolve template directory relative to this file (works after ESM bundling)
const __filename = fileURLToPath(import.meta.url);
const __templatesDir = path.join(path.dirname(__filename), 'templates');

export interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  context: Record<string, unknown>;
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  // Template cache to avoid recompiling on every send (#49)
  private templateCache = new Map<string, handlebars.TemplateDelegate>();

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: AppConfig.email.smtp.host,
      port: Number(AppConfig.email.smtp.port),
      secure: Number(AppConfig.email.smtp.port) === 465,
      auth: {
        user: AppConfig.email.smtp.user,
        pass: AppConfig.email.smtp.pass,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    const { to, subject, template, context } = options;

    // (#51) Sanitize template name to prevent path traversal
    const safeName = path.basename(template).replace(/[^a-zA-Z0-9_-]/g, '');
    if (!safeName || safeName !== template) {
      throw new Error(`Invalid template name: ${template}`);
    }

    // Check cache first (#49)
    let compiledTemplate = this.templateCache.get(safeName);
    if (!compiledTemplate) {
      const templatePath = path.join(__templatesDir, `${safeName}.html`);
      
      try {
        const templateSource = fs.readFileSync(templatePath, 'utf8');
        compiledTemplate = handlebars.compile(templateSource);
        this.templateCache.set(safeName, compiledTemplate);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error({ error: err, template: safeName }, `Failed to load email template: ${safeName}`);
        throw new Error(`Email template not found: ${safeName}`);
      }
    }

    const html = compiledTemplate(context);

    await this.transporter.sendMail({
      from: `"${AppConfig.email.smtp.fromName}" <${AppConfig.email.smtp.fromEmail}>`,
      to,
      subject,
      html,
    });
  }
}

let _emailService: EmailService | null = null;

export function getEmailService(): EmailService {
  if (!_emailService) {
    _emailService = new EmailService();
  }
  return _emailService;
}

/** @deprecated Use `getEmailService()` for lazy initialization (#48).
 * This proxy is kept for backward compatibility but may have context binding issues.
 * TODO: Remove in next major version and update all consumers to use getEmailService(). */
export const emailService = new Proxy({} as EmailService, {
  get(_target, prop) {
    return Reflect.get(getEmailService(), prop);
  },
});
