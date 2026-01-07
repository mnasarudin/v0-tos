import { NextRequest, NextResponse } from 'next/server'
import { getUserByUsername, getUserByEmail, getNextUserId, saveVerificationCode } from '@/lib/db-utils'
import { sendVerificationEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      fullName,
      username,
      email,
      address,
      department,
      emergencyContactName,
      emergencyContactPhone,
      institution,
      lecturerContactName,
      lecturerContactPhone,
      phoneNumber,
      password,
    } = body

    // Validate required fields
    if (!fullName || !username || !email || !address || !department ||
        !emergencyContactName || !emergencyContactPhone || !institution ||
        !lecturerContactName || !lecturerContactPhone || !phoneNumber || !password) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
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

    // Validate password
    if (password.length < 8 || !/(?=.*[a-zA-Z])(?=.*[0-9])/.test(password)) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters with both letters and numbers' },
        { status: 400 }
      )
    }

    // Check if username already exists
    const existingUser = getUserByUsername(username.trim())
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Username already exists' },
        { status: 409 }
      )
    }

    // Check if email already exists
    const existingEmail = getUserByEmail(email.trim().toLowerCase())
    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 409 }
      )
    }

    // Generate 4-digit verification code
    const code = Math.floor(1000 + Math.random() * 9000).toString()

    // Save verification code (expires in 10 minutes)
    saveVerificationCode(email.trim().toLowerCase(), code, 10)

    // Send verification email
    const emailResult = await sendVerificationEmail(email.trim().toLowerCase(), code)
    
    if (!emailResult.sent) {
      console.error('❌ Failed to send verification email:', emailResult.error)
      
      // If email credentials are not configured, still allow signup in dev mode
      if (emailResult.error?.includes('credentials not configured')) {
        if (process.env.NODE_ENV === 'development') {
          console.log('📧 [DEV MODE] Email credentials not configured. Verification code:', code)
          return NextResponse.json({
            success: true,
            message: 'Verification code generated (email not sent - credentials not configured)',
            devCode: code,
            emailNotSent: true,
          })
        } else {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Email service is not configured. Please contact the administrator.' 
            },
            { status: 503 }
          )
        }
      }
      
      // For other email errors, still allow signup but warn user
      console.log('⚠️ Email sending failed, but code is saved. Code:', code)
      return NextResponse.json({
        success: true,
        message: 'Verification code generated, but email could not be sent. Please contact support.',
        devCode: process.env.NODE_ENV === 'development' ? code : undefined,
        emailNotSent: true,
      })
    }

    console.log('✅ Verification email sent successfully to:', email)

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email',
    })
  } catch (error: any) {
    console.error('❌ Signup error:', error)
    console.error('❌ Error stack:', error.stack)
    console.error('❌ Error message:', error.message)
    console.error('❌ Error code:', error.code)

    // Handle database locked error
    if (error.message?.includes('database is locked') || error.code === 'SQLITE_BUSY') {
      return NextResponse.json(
        {
          success: false,
          error: 'Database is temporarily busy. Please close any database viewing tools and try again.'
        },
        { status: 503 }
      )
    }

    // Return more specific error message in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `An error occurred: ${error.message || 'Unknown error'}`
      : 'An error occurred during signup. Please try again.'

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
