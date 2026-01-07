import { NextRequest, NextResponse } from 'next/server'
import { getUserById, updateUser } from '@/lib/db-utils'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

// GET: Fetch user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    const user = getUserById(userId)

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
      user: {
        ...userWithoutPassword,
        isAdmin: user.isAdmin === 1 || user.isAdmin === true || String(user.isAdmin) === '1'
      }
    })
  } catch (error: any) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { success: false, error: 'An error occurred while fetching user data.' },
      { status: 500 }
    )
  }
}

// PUT: Update user profile
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id
    const body = await request.json()

    // Verify user is updating their own profile or is an admin
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

    // Check if user is updating their own profile or is an admin
    const isAdmin = currentUser.isAdmin === 1 || currentUser.isAdmin === true || String(currentUser.isAdmin) === '1'
    if (currentUserId !== userId && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to update this profile' },
        { status: 403 }
      )
    }

    // Validate required fields
    if (body.fullName && !body.fullName.trim()) {
      return NextResponse.json(
        { success: false, error: 'Full name is required' },
        { status: 400 }
      )
    }

    if (body.email && !/\S+@\S+\.\S+/.test(body.email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Prepare update object (only include allowed fields)
    const allowedFields = ['fullName', 'email', 'username', 'phoneNumber', 'address', 'department']
    const updates: any = {}
    
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    })

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    // Update user
    updateUser(userId, updates)

    // Fetch updated user
    const updatedUser = getUserById(userId)
    const { password: _, ...userWithoutPassword } = updatedUser

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        ...userWithoutPassword,
        isAdmin: updatedUser.isAdmin === 1 || updatedUser.isAdmin === true || String(updatedUser.isAdmin) === '1'
      }
    })
  } catch (error: any) {
    console.error('Update user error:', error)
    
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
      { success: false, error: 'An error occurred while updating profile.' },
      { status: 500 }
    )
  }
}


