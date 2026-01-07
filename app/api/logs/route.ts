import { NextRequest, NextResponse } from 'next/server'
import { getVolumeLogByUserAndDate, getVolumeLogsByUser, getAllVolumeLogs, createVolumeLog, updateVolumeLog, getUserById } from '@/lib/db-utils'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    const date = request.nextUrl.searchParams.get('date')

    // If no userId is provided, return all logs (for admin view)
    if (!userId) {
      const logs = getAllVolumeLogs()
      return NextResponse.json({ success: true, logs })
    }

    if (date) {
      // Get specific date log
      const log = getVolumeLogByUserAndDate(userId, date)
      return NextResponse.json({ success: true, log })
    } else {
      // Get all logs for user
      const logs = getVolumeLogsByUser(userId)
      return NextResponse.json({ success: true, logs })
    }
  } catch (error) {
    console.error('Get logs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, content, date } = body

    if (!userId || content === undefined) {
      return NextResponse.json({ error: 'User ID and content are required' }, { status: 400 })
    }

    // Verify user exists
    const user = getUserById(userId)
    if (!user) {
      return NextResponse.json({ 
        error: 'User not found. Please log in again.' 
      }, { status: 400 })
    }
    
    // Get the date (default to today if not provided)
    const logDate = date || new Date().toISOString().split('T')[0]
    
    // Check time restrictions: logs can only be saved/edited from 8am to 7pm (19:00)
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentTimeInMinutes = currentHour * 60 + currentMinute
    
    // 8am = 480 minutes, 7pm = 1140 minutes
    // Allow saving/editing between 8am and 7pm (before 7pm)
    if (currentTimeInMinutes < 480 || currentTimeInMinutes >= 1140) {
      return NextResponse.json({ 
        error: 'Volume logs can only be saved or edited between 8:00 AM and 7:00 PM' 
      }, { status: 403 })
    }
    
    // Check if log exists for this date
    const existing = getVolumeLogByUserAndDate(userId, logDate)
    
    if (existing) {
      // Update existing log (time restriction already checked above)
      updateVolumeLog(existing.id, content)
      return NextResponse.json({ success: true, message: 'Log updated successfully' })
    } else {
      // Create new log (time restriction already checked above)
      const logId = `log-${userId}-${logDate}-${Date.now()}`
      createVolumeLog({
        id: logId,
        userId,
        date: logDate,
        content
      })
      return NextResponse.json({ success: true, message: 'Log created successfully' })
    }
  } catch (error: any) {
    console.error('Save log error:', error)
    
    // Handle foreign key constraint errors
    if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY' || error.message?.includes('foreign key')) {
      return NextResponse.json({ 
        error: 'User not found. Please log in again.' 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 })
  }
}



