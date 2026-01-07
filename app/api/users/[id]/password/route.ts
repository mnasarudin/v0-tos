import { NextRequest, NextResponse } from 'next/server'
import { getUserById, updateUser } from '@/lib/db-utils'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

// PUT: Update user password
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id
    const body = await request.json()
    const { currentPassword, newPassword } = body

    // Verify user is updating their own password or is an admin
    const cookieStore = await cookies()
    const currentUserId = cookieStore.get('userId')?.value

    if (!currentUserId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const currentUser = getUserById(currentUserId)
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user is updating their own password or is an admin
    const isAdmin = currentUser.isAdmin === 1 || currentUser.isAdmin === true || String(currentUser.isAdmin) === '1'
    if (currentUserId !== userId && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to update this password' },
        { status: 403 }
      )
    }

    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Current password and new password are required' },
        { status: 400 }
      )
    }

    // Get the user whose password is being changed
    const targetUser = getUserById(userId)
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify current password (assuming plain text for now - in production, use bcrypt)
    if (targetUser.password !== currentPassword) {
      return NextResponse.json(
        { success: false, error: 'Current password is incorrect' },
        { status: 401 }
      )
    }

    // Validate new password
    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: 'New password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return NextResponse.json(
        { success: false, error: 'New password must contain both letters and numbers' },
        { status: 400 }
      )
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { success: false, error: 'New password must be different from current password' },
        { status: 400 }
      )
    }

    // Update password
    updateUser(userId, { password: newPassword })

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully'
    })
  } catch (error: any) {
    console.error('Change password error:', error)
    
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
      { success: false, error: 'An error occurred while changing password.' },
      { status: 500 }
    )
  }
}


