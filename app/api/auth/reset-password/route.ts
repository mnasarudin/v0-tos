import { NextRequest, NextResponse } from 'next/server'
import { verifyCode, checkCode, getUserByEmail, updateUser } from '@/lib/db-utils'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, code, newPassword } = body

    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: 'Email and verification code are required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = getUserByEmail(email.trim().toLowerCase())

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // If newPassword is provided, validate and update it (final step - delete code after reset)
    if (newPassword) {
      // Verify the code and delete it after successful password reset
      const isValid = verifyCode(email.trim().toLowerCase(), code.trim(), true)

      if (!isValid) {
        return NextResponse.json(
          { success: false, error: 'Invalid or expired verification code' },
          { status: 401 }
        )
      }

      // Validate password
      if (newPassword.length < 8 || !/(?=.*[a-zA-Z])(?=.*[0-9])/.test(newPassword)) {
        return NextResponse.json(
          { success: false, error: 'Password must be at least 8 characters with both letters and numbers' },
          { status: 400 }
        )
      }

      // Update user password
      try {
        updateUser(user.id, { password: newPassword })

        console.log('✅ Password reset successfully for user:', user.id)

        return NextResponse.json({
          success: true,
          message: 'Password reset successful. You can now login with your new password.',
        })
      } catch (error: any) {
        console.error('Error resetting password:', error)

        return NextResponse.json(
          { success: false, error: 'Failed to reset password. Please try again.' },
          { status: 500 }
        )
      }
    }

    // If no newPassword, just check the code is valid (for step 1 of reset - don't delete yet)
    const isValid = checkCode(email.trim().toLowerCase(), code.trim())

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired verification code' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code is valid. Please set your new password.',
    })
  } catch (error: any) {
    console.error('Reset password error:', error)

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
      { success: false, error: 'An error occurred during password reset. Please try again.' },
      { status: 500 }
    )
  }
}

