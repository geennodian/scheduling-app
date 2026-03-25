import { Resend } from 'resend'
import nodemailer from 'nodemailer'

let resendClient: Resend | null = null
let nodemailerTransporter: nodemailer.Transporter | null = null

function getResendClient(): Resend | null {
  if (resendClient) return resendClient
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return null
  resendClient = new Resend(apiKey)
  return resendClient
}

function getNodemailerTransporter(): nodemailer.Transporter | null {
  if (nodemailerTransporter) return nodemailerTransporter
  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!host || !user || !pass) return null
  nodemailerTransporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: { user, pass },
  })
  return nodemailerTransporter
}

const FROM_EMAIL = process.env.MAIL_FROM || process.env.SMTP_USER || 'noreply@example.com'
const FROM_NAME = '日程調整'

export async function sendEmail(options: {
  to: string
  subject: string
  html: string
}): Promise<boolean> {
  // Try Resend first (works on Vercel), fall back to SMTP (works locally)
  const resend = getResendClient()
  if (resend) {
    try {
      await resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      })
      console.log('[Mail/Resend] Sent:', options.subject, '->', options.to)
      return true
    } catch (error) {
      console.error('[Mail/Resend] Failed:', error)
      return false
    }
  }

  // Fallback to SMTP (for local development)
  const transporter = getNodemailerTransporter()
  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      })
      console.log('[Mail/SMTP] Sent:', options.subject, '->', options.to)
      return true
    } catch (error) {
      console.error('[Mail/SMTP] Failed:', error)
      return false
    }
  }

  console.warn('[Mail] No mail provider configured. Skipped:', options.subject)
  return false
}
