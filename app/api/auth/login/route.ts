import { NextRequest, NextResponse } from 'next/server'
import { getUserByUsername } from '@/lib/db-utils'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Get user from database
    const user = getUserByUsername(username.trim())

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Username does not exist. Please check your username and try again.' },
        { status: 401 }
      )
    }

    // Verify password (assuming plain text for now - in production, use bcrypt)
    if (user.password !== password) {
      return NextResponse.json(
        { success: false, error: 'Incorrect password. Please check your password and try again.' },
        { status: 401 }
      )
    }

    // Remove password from user object before sending
    const { password: _, ...userWithoutPassword } = user

    // Set cookie for session management
    const cookieStore = await cookies()
    cookieStore.set('userId', user.id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    // Return success with user data
    return NextResponse.json({
      success: true,
      user: {
        ...userWithoutPassword,
        isAdmin: user.isAdmin === 1 || user.isAdmin === true || String(user.isAdmin) === '1'
      }
    })
  } catch (error: any) {
    console.error('Login error:', error)
    
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
      { success: false, error: 'An error occurred during login. Please try again.' },
      { status: 500 }
    )
  }
}
