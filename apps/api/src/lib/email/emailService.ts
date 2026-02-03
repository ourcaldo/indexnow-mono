import * as fs from 'fs'
import * as path from 'path'
import * as nodemailer from 'nodemailer'
import { logger } from '../monitoring/error-handling'

interface EmailOptions {
  to: string
  subject: string
  template: string
  data: Record<string, any>
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null
  private isInitialized: boolean = false

  constructor() {}

  private async initializeTransporter() {
    if (this.isInitialized) {
      return
    }

    try {
      if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        logger.warn({}, 'SMTP configuration incomplete, email service disabled')
        return
      }

      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '465'),
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      })

      await this.transporter.verify()
      logger.info({}, 'SMTP transporter initialized successfully')
      this.isInitialized = true
      
    } catch (error) {
      logger.error({ error }, 'Failed to initialize SMTP transporter')
      this.transporter = null
    }
  }

  private async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initializeTransporter()
    }
  }

  private loadTemplate(templateName: string): string {
    try {
      // Normalize template name (replace underscores with hyphens if needed)
      const fileName = templateName.replace(/_/g, '-')
      const templatePath = path.join(process.cwd(), 'src', 'lib', 'email', 'templates', `${fileName}.html`)
      
      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template file not found: ${templatePath}`)
      }

      return fs.readFileSync(templatePath, 'utf-8')
    } catch (error) {
      logger.error({ error, templateName }, 'Failed to load email template')
      throw error
    }
  }

  private renderTemplate(template: string, data: Record<string, any>): string {
    try {
      let rendered = template
      
      // Replace simple variables {{variable}}
      Object.entries(data).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g')
        rendered = rendered.replace(regex, String(value || ''))
      })

      // Handle conditional blocks {{#if variable}}...{{/if}}
      rendered = rendered.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, variable, content) => {
        return data[variable] ? content : ''
      })

      return rendered
    } catch (error) {
      logger.error({ error }, 'Failed to render email template')
      throw error
    }
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      await this.ensureInitialized()
      
      if (!this.transporter) {
        throw new Error('SMTP transporter not available')
      }

      const templateHtml = this.loadTemplate(options.template)
      const renderedHtml = this.renderTemplate(templateHtml, options.data)

      const mailOptions = {
        from: `${process.env.SMTP_FROM_NAME || 'IndexNow Studio'} <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        html: renderedHtml
      }

      await this.transporter.sendMail(mailOptions)
      logger.info({ to: options.to, template: options.template }, 'Email sent successfully')

    } catch (error) {
      logger.error({ error, to: options.to, template: options.template }, 'Failed to send email')
      throw error
    }
  }
}

export const emailService = new EmailService()
