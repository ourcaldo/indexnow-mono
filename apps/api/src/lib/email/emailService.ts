import * as fs from 'fs'
import * as path from 'path'
import * as nodemailer from 'nodemailer'
import { AppConfig, type Json } from '@indexnow/shared'
import { ErrorHandlingService } from '@/lib/monitoring/error-handling'

interface EmailTemplate {
  subject: string
  html: string
}

interface BillingConfirmationData {
  customerName: string
  orderId: string
  packageName: string
  billingPeriod: string
  amount: string
  paymentMethod: string
  bankName?: string
  accountName?: string
  accountNumber?: string
  orderDate: string
  expiryTime?: string
  vaNumber?: string
  vaBank?: string
  storeCode?: string
  storeName?: string
}

interface PaymentReceivedData {
  customerName: string
  orderId: string
  packageName: string
  billingPeriod: string
  amount: string
  paymentDate: string
}

interface PackageActivatedData {
  customerName: string
  packageName: string
  billingPeriod: string
  expiresAt: string
  activationDate: string
  dashboardUrl: string
}

interface OrderExpiredData {
  customerName: string
  orderId: string
  packageName: string
  billingPeriod: string
  amount: string
  status: string
  expiredDate: string
  subscribeUrl: string
}


export class EmailService {
  private transporter: nodemailer.Transporter | null = null
  private isInitialized: boolean = false

  constructor() {
    // Don't initialize during build time - use lazy initialization
  }

  private async initializeTransporter() {
    // Skip initialization during build process
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return
    }

    if (this.isInitialized) {
      return
    }

    try {
      console.log('🔧 Initializing SMTP transporter...')
      
      const { smtp } = AppConfig.email;

      if (!smtp.host || !smtp.user || !smtp.pass) {
        console.warn('⚠️ SMTP configuration incomplete, email service disabled')
        return
      }

      console.log(`📧 SMTP Config: ${smtp.host}:${smtp.port || '465'}`)
      console.log(`👤 SMTP User: ${smtp.user}`)

      this.transporter = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port || 465,
        secure: true, // true for 465, false for other ports like 587
        auth: {
          user: smtp.user,
          pass: smtp.pass
        },
        tls: {
          rejectUnauthorized: false // Accept self-signed certificates
        }
      })

      // Test the connection
      await this.transporter.verify()
      console.log('✅ SMTP transporter initialized and verified successfully')
      this.isInitialized = true
      
    } catch (error) {
      ErrorHandlingService.handle(error, { context: 'EmailService.initializeTransporter' });
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
      const templatePath = path.join(process.cwd(), 'lib', 'email', 'templates', `${templateName}.html`)
      console.log(`📄 Loading email template from: ${templatePath}`)
      
      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template file not found: ${templatePath}`)
      }

      const template = fs.readFileSync(templatePath, 'utf-8')
      console.log(`✅ Template loaded successfully (${template.length} characters)`)
      return template
    } catch (error) {
      ErrorHandlingService.handle(error, { context: `EmailService.loadTemplate(${templateName})` });
      throw error
    }
  }

  private renderTemplate(template: string, data: Record<string, Json>): string {
    try {
      console.log('🔄 Rendering email template with data:', Object.keys(data))
      
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

      console.log('✅ Template rendered successfully')
      return rendered
    } catch (error) {
      ErrorHandlingService.handle(error, { context: 'EmailService.renderTemplate' });
      throw error
    }
  }


  async sendBillingConfirmation(email: string, data: BillingConfirmationData): Promise<void> {
    try {
      console.log(`📤 Preparing to send billing confirmation email to: ${email}`)
      console.log('📊 Email data:', {
        customerName: data.customerName,
        orderId: data.orderId,
        packageName: data.packageName,
        amount: data.amount
      })

      await this.ensureInitialized()
      
      if (!this.transporter) {
        throw new Error('SMTP transporter not available')
      }

      // Load and render template
      const templateHtml = this.loadTemplate('billing-confirmation')
      const renderedHtml = this.renderTemplate(templateHtml, data)

      const mailOptions = {
        from: `${AppConfig.email.smtp.fromName} <${AppConfig.email.smtp.fromEmail || AppConfig.email.smtp.user}>`,
        to: email,
        subject: `Order Confirmation - ${data.packageName} Subscription`,
        html: renderedHtml
      }

      console.log('📬 Sending email with options:', {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject,
        htmlLength: renderedHtml.length
      })

      const result = await this.transporter.sendMail(mailOptions)
      
      console.log('✅ Billing confirmation email sent successfully!')
      console.log('📨 Email result:', {
        messageId: result.messageId,
        response: result.response
      })

    } catch (error) {
      ErrorHandlingService.handle(error, { 
        context: 'EmailService.sendBillingConfirmation',
        severity: ErrorSeverity.HIGH 
      });
      throw error
    }
  }

  async sendPaymentReceived(email: string, data: PaymentReceivedData): Promise<void> {
    try {
      console.log(`📤 Preparing to send payment received email to: ${email}`)

      if (!this.transporter) {
        await this.initializeTransporter()
        if (!this.transporter) {
          throw new Error('SMTP transporter not available')
        }
      }

      const templateHtml = this.loadTemplate('payment-received')
      const renderedHtml = this.renderTemplate(templateHtml, data)

      const mailOptions = {
        from: `${AppConfig.email.smtp.fromName} <${AppConfig.email.smtp.fromEmail || AppConfig.email.smtp.user}>`,
        to: email,
        subject: `Payment Received - ${data.packageName} Subscription`,
        html: renderedHtml
      }

      const result = await this.transporter.sendMail(mailOptions)
      console.log('✅ Payment received email sent successfully!')

    } catch (error) {
      ErrorHandlingService.handle(error, { context: 'EmailService.sendPaymentReceived' });
      throw error
    }
  }

  async sendPackageActivated(email: string, data: PackageActivatedData): Promise<void> {
    try {
      console.log(`📤 Preparing to send package activated email to: ${email}`)

      if (!this.transporter) {
        await this.initializeTransporter()
        if (!this.transporter) {
          throw new Error('SMTP transporter not available')
        }
      }

      const templateHtml = this.loadTemplate('package-activated')
      const renderedHtml = this.renderTemplate(templateHtml, data)

      const mailOptions = {
        from: `${AppConfig.email.smtp.fromName} <${AppConfig.email.smtp.fromEmail || AppConfig.email.smtp.user}>`,
        to: email,
        subject: `Package Activated - Welcome to ${data.packageName}!`,
        html: renderedHtml
      }

      const result = await this.transporter.sendMail(mailOptions)
      console.log('✅ Package activated email sent successfully!')

    } catch (error) {
      ErrorHandlingService.handle(error, { context: 'EmailService.sendPackageActivated' });
      throw error
    }
  }

  async sendOrderExpired(email: string, data: OrderExpiredData): Promise<void> {
    try {
      console.log(`📤 Preparing to send order expired email to: ${email}`)

      if (!this.transporter) {
        await this.initializeTransporter()
        if (!this.transporter) {
          throw new Error('SMTP transporter not available')
        }
      }

      const templateHtml = this.loadTemplate('order-expired')
      const renderedHtml = this.renderTemplate(templateHtml, data)

      const mailOptions = {
        from: `${AppConfig.email.smtp.fromName} <${AppConfig.email.smtp.fromEmail || AppConfig.email.smtp.user}>`,
        to: email,
        subject: `Order Expired - ${data.packageName} Subscription`,
        html: renderedHtml
      }

      const result = await this.transporter.sendMail(mailOptions)
      console.log('✅ Order expired email sent successfully!')

    } catch (error) {
      ErrorHandlingService.handle(error, { context: 'EmailService.sendOrderExpired' });
      throw error
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.ensureInitialized()

      if (!this.transporter) {
        return false
      }

      await this.transporter.verify()
      console.log('✅ SMTP connection test successful')
      return true
    } catch (error) {
      ErrorHandlingService.handle(error, { context: 'EmailService.testConnection' });
      return false
    }
  }

  async sendEmail(options: {
    to: string
    subject: string
    template: string
    data: Record<string, Json>
  }): Promise<void> {
    try {
      console.log(`📤 Preparing to send email to: ${options.to} using template: ${options.template}`)
      
      await this.ensureInitialized()
      
      if (!this.transporter) {
        throw new Error('SMTP transporter not available')
      }

      // Load and render template
      const templateHtml = this.loadTemplate(options.template)
      const renderedHtml = this.renderTemplate(templateHtml, options.data)

      const mailOptions = {
        from: `${AppConfig.email.smtp.fromName} <${AppConfig.email.smtp.fromEmail || AppConfig.email.smtp.user}>`,
        to: options.to,
        subject: options.subject,
        html: renderedHtml
      }

      const result = await this.transporter.sendMail(mailOptions)
      console.log(`✅ Email sent successfully! MessageId: ${result.messageId}`)
    } catch (error) {
      console.error(`❌ Failed to send email to ${options.to}:`, error)
      throw error
    }
  }
}

// Export singleton instance
export const emailService = new EmailService()