import nodemailer from 'nodemailer'

let transporter: nodemailer.Transporter | null = null

function getTransporter() {
  if (transporter) return transporter

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('Gmail SMTP credentials not configured. Emails will not be sent.')
    return null
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })

  return transporter
}

export async function sendEmail(options: {
  to: string
  subject: string
  html: string
}): Promise<boolean> {
  const t = getTransporter()
  if (!t) {
    console.log('[Mail] Skipped (not configured):', options.subject)
    return false
  }

  try {
    await t.sendMail({
      from: `"日程調整アプリ" <${process.env.GMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    })
    return true
  } catch (error) {
    console.error('[Mail] Failed to send:', error)
    return false
  }
}
