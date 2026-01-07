import { NextRequest, NextResponse } from 'next/server'
import { getUserById } from '@/lib/db-utils'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get userId from cookie (server-side source of truth)
    // Query params are optional for backward compatibility
    const cookieStore = await cookies()
    const cookieUserId = cookieStore.get('userId')?.value
    const queryUserId = request.nextUrl.searchParams.get('userId')

    // Prefer cookie over query param (cookie is more secure)
    const targetUserId = cookieUserId || queryUserId

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 401 }
      )
    }
    
    // Security: If query param is provided but doesn't match cookie, reject
    // This prevents URL parameter manipulation attacks
    if (queryUserId && cookieUserId && queryUserId !== cookieUserId) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 403 }
      )
    }

    // Get user from database
    const user = getUserById(targetUserId)

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user

    // Return user data
    return NextResponse.json({
      success: true,
      user: {
        ...userWithoutPassword,
        isAdmin: user.isAdmin === 1 || user.isAdmin === true || String(user.isAdmin) === '1'
      }
    })
  } catch (error: any) {
    console.error('Get user error:', error)
    
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
      { success: false, error: 'An error occurred. Please try again.' },
      { status: 500 }
    )
  }
}


