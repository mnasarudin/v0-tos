import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Clear the userId cookie
    const cookieStore = await cookies()
    cookieStore.delete('userId')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { success: false, error: 'An error occurred during logout' },
      { status: 500 }
    )
  }
}


