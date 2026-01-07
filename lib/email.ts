// Email utility for sending verification codes
import 'server-only'
import nodemailer from 'nodemailer'

interface EmailOptions {
  to: string
  subject: string
  text: string
  html?: string
}

export async function sendEmail(options: EmailOptions): Promise<{ sent: boolean; error?: string }> {
  try {
    // Check if email credentials are configured
    const gmailUser = process.env.GMAIL_USER
    const gmailPass = process.env.GMAIL_PASS

    if (!gmailUser || !gmailPass) {
      console.warn('⚠️ Email credentials not configured. Email sending is disabled.')
      console.warn('   Set GMAIL_USER and GMAIL_PASS environment variables to enable email sending.')
      console.log('📧 [DEV MODE] Email would be sent:')
      console.log('   To:', options.to)
      console.log('   Subject:', options.subject)
      console.log('   Body:', options.text)
      if (options.html) {
        console.log('   HTML:', options.html)
      }
      return { sent: false, error: 'Email credentials not configured' }
    }

    // Create transporter for Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    })

    // Send email
    console.log('📧 Sending email to:', options.to)
    const info = await transporter.sendMail({
      from: `"Langkawi Port Sdn Bhd" <${gmailUser}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || options.text,
    })

    console.log('✅ Email sent successfully!')
    console.log('   Message ID:', info.messageId)
    
    return { sent: true }
  } catch (error: any) {
    console.error('❌ Error sending email:', error)
    console.error('   Error message:', error.message)
    
    // Return error details
    return { 
      sent: false, 
      error: error.message || 'Failed to send email' 
    }
  }
}

export async function sendVerificationEmail(email: string, code: string): Promise<{ sent: boolean; error?: string }> {
  const subject = 'Verify Your Email - Intern Management System'
  const text = `Your verification code is: ${code}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.`
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #20b2aa;">Email Verification</h2>
      <p>Your verification code is:</p>
      <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0; border-radius: 8px;">
        ${code}
      </div>
      <p>This code will expire in 10 minutes.</p>
      <p style="color: #666; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
    </div>
  `

  return sendEmail({
    to: email,
    subject,
    text,
    html,
  })
}
