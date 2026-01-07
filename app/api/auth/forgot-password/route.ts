import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail, getUserByUsername, saveVerificationCode } from '@/lib/db-utils'
import { sendEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email address is required' },
        { status: 400 }
      )
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = getUserByEmail(email.trim().toLowerCase())

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Email address does not match any account. Please check your email and try again.' },
        { status: 404 }
      )
    }

    // Generate 4-digit reset code
    const code = Math.floor(1000 + Math.random() * 9000).toString()

    // Save verification code (expires in 15 minutes)
    saveVerificationCode(email.trim().toLowerCase(), code, 15)

    // Send password reset email
    const subject = 'Password Reset Code - Intern Attendance System'
    const text = `Your password reset code is: ${code}\n\nThis code will expire in 15 minutes.\n\nIf you didn't request this code, please ignore this email and your password will remain unchanged.`
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #008B8B;">Password Reset</h2>
        <p>You requested to reset your password. Your reset code is:</p>
        <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0; border-radius: 8px;">
          ${code}
        </div>
        <p>This code will expire in 15 minutes.</p>
        <p style="color: #666; font-size: 12px;">If you didn't request this code, please ignore this email and your password will remain unchanged.</p>
      </div>
    `

    const emailResult = await sendEmail({
      to: email.trim().toLowerCase(),
      subject,
      text,
      html,
    })

    if (!emailResult.sent) {
      console.error('❌ Failed to send password reset email:', emailResult.error)

      // If email credentials are not configured, still allow reset in dev mode
      if (emailResult.error?.includes('credentials not configured')) {
        if (process.env.NODE_ENV === 'development') {
          console.log('📧 [DEV MODE] Email credentials not configured. Reset code:', code)
          return NextResponse.json({
            success: true,
            message: 'Password reset code generated (email not sent - credentials not configured)',
            devCode: code,
            emailNotSent: true,
          })
        } else {
          return NextResponse.json(
            {
              success: false,
              error: 'Email service is not configured. Please contact the administrator.',
            },
            { status: 503 }
          )
        }
      }

      // For other email errors, still allow reset but warn user
      console.log('⚠️ Email sending failed, but code is saved. Code:', code)
      return NextResponse.json({
        success: true,
        message: 'Password reset code generated, but email could not be sent. Please contact support.',
        devCode: process.env.NODE_ENV === 'development' ? code : undefined,
        emailNotSent: true,
      })
    }

    console.log('✅ Password reset email sent successfully to:', email)

    return NextResponse.json({
      success: true,
      message: 'Password reset code sent to your email',
    })
  } catch (error: any) {
    console.error('❌ Forgot password error:', error)

    // Handle database locked error
    if (error.message?.includes('database is locked') || error.code === 'SQLITE_BUSY') {
      return NextResponse.json(
        {
          success: false,
          error: 'Database is temporarily busy. Please close any database viewing tools and try again.',
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'An error occurred. Please try again.' },
      { status: 500 }
    )
  }
}

