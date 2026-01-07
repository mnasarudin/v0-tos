import { NextRequest, NextResponse } from 'next/server'
import { verifyCode, getUserByEmail, getNextUserId, createUser } from '@/lib/db-utils'

export const dynamic = 'force-dynamic'

// Temporary storage for user data during verification
// In production, use Redis or a proper session store
const pendingSignups = new Map<string, any>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, code, userData } = body

    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: 'Email and verification code are required' },
        { status: 400 }
      )
    }

    // Verify the code
    const isValid = verifyCode(email.trim().toLowerCase(), code.trim())

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired verification code' },
        { status: 401 }
      )
    }

    // If userData is provided, create the user account
    if (userData) {
      // Check if user already exists
      const existingUser = getUserByEmail(email.trim().toLowerCase())
      if (existingUser) {
        return NextResponse.json(
          { success: false, error: 'Email already registered' },
          { status: 409 }
        )
      }

      // Generate user ID
      const userId = getNextUserId()

      // Create user in database
      try {
        createUser({
          id: userId,
          fullName: userData.fullName,
          username: userData.username,
          email: email.trim().toLowerCase(),
          address: userData.address,
          department: userData.department,
          emergencyContactName: userData.emergencyContactName,
          emergencyContactPhone: userData.emergencyContactPhone,
          institution: userData.institution,
          lecturerContactName: userData.lecturerContactName,
          lecturerContactPhone: userData.lecturerContactPhone,
          phoneNumber: userData.phoneNumber,
          password: userData.password, // In production, hash this with bcrypt
          profilePhoto: userData.profilePhoto || null,
          isAdmin: 0,
          isPhoneVerified: 0,
        })

        console.log('✅ User created successfully:', userId)

        return NextResponse.json({
          success: true,
          message: 'Email verified and account created successfully',
          userId,
        })
      } catch (error: any) {
        console.error('Error creating user:', error)
        
        if (error.message?.includes('UNIQUE constraint')) {
          return NextResponse.json(
            { success: false, error: 'Username or email already exists' },
            { status: 409 }
          )
        }

        return NextResponse.json(
          { success: false, error: 'Failed to create account. Please try again.' },
          { status: 500 }
        )
      }
    }

    // If no userData, just verify the email
    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
    })
  } catch (error: any) {
    console.error('Verification error:', error)

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

    return NextResponse.json(
      { success: false, error: 'An error occurred during verification. Please try again.' },
      { status: 500 }
    )
  }
}


