import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { AppConfig } from '@indexnow/shared';

export interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  context: any;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: AppConfig.smtp.host,
      port: Number(AppConfig.smtp.port),
      secure: AppConfig.smtp.secure,
      auth: {
        user: AppConfig.smtp.user,
        pass: AppConfig.smtp.pass,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    const { to, subject, template, context } = options;

    // In a real environment, we would load the template from the filesystem or a database
    // For this implementation, we'll assume they are in the src/templates directory
    const templatePath = path.join(__dirname, 'templates', `${template}.html`);
    
    let html: string;
    try {
      const templateSource = fs.readFileSync(templatePath, 'utf8');
      const compiledTemplate = handlebars.compile(templateSource);
      html = compiledTemplate(context);
    } catch (error) {
      console.error(`Failed to load email template: ${template}`, error);
      throw new Error(`Email template not found: ${template}`);
    }

    await this.transporter.sendMail({
      from: `"${AppConfig.smtp.fromName}" <${AppConfig.smtp.fromEmail}>`,
      to,
      subject,
      html,
    });
  }
}

export const emailService = new EmailService();
