import nodemailer from 'nodemailer'

let transporter: nodemailer.Transporter | null = null

function getTransporter() {
  if (transporter) return transporter

  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    console.warn('[Mail] SMTP credentials not configured. Emails will not be sent.')
    return null
  }

  transporter = nodemailer.createTransport({
    host,
    port: Number(port) || 465,
    secure: true, // SSL
    auth: { user, pass },
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
      from: `"日程調整" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    })
    console.log('[Mail] Sent:', options.subject, '->', options.to)
    return true
  } catch (error) {
    console.error('[Mail] Failed to send:', error)
    return false
  }
}
