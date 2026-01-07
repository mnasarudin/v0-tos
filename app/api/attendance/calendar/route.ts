import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7) // YYYY-MM format

    // Get all active interns
    const interns = db.prepare(`
      SELECT id, fullName, department 
      FROM users 
      WHERE (isAdmin = 0 OR isAdmin IS NULL OR isAdmin = '0')
        AND (isActive = 1 OR isActive IS NULL OR isActive = '1')
      ORDER BY fullName ASC
    `).all() as any[]

    // Get attendance records for the specified month
    const startDate = `${month}-01`
    const endDate = `${month}-31`
    
    const attendanceRecords = db.prepare(`
      SELECT 
        userId,
        date,
        status,
        clockInTime,
        clockOutTime,
        clockInImage,
        clockOutImage
      FROM attendance
      WHERE date >= ? AND date <= ?
      ORDER BY date ASC
    `).all(startDate, endDate) as any[]

    // Create a map of attendance by userId and date with full details
    const attendanceMap = new Map<string, Map<string, any>>()
    
    attendanceRecords.forEach(record => {
      if (!attendanceMap.has(record.userId)) {
        attendanceMap.set(record.userId, new Map())
      }
      const userAttendance = attendanceMap.get(record.userId)!
      const status = (record.status || '').toLowerCase().trim()
      // Mark as 'attended' if status is on-time or late, 'absent' otherwise
      const attendanceStatus = (status === 'on-time' || status === 'on time' || status === 'ontime' || status === 'late') 
        ? 'attended' 
        : 'absent'
      userAttendance.set(record.date, {
        status: attendanceStatus,
        clockInTime: record.clockInTime,
        clockOutTime: record.clockOutTime,
        clockInImage: record.clockInImage,
        clockOutImage: record.clockOutImage
      })
    })

    // Generate calendar data for the month
    const year = parseInt(month.split('-')[0])
    const monthNum = parseInt(month.split('-')[1])
    const daysInMonth = new Date(year, monthNum, 0).getDate()
    
    // Get first day of month and its day of week (0 = Sunday, 6 = Saturday)
    const firstDay = new Date(year, monthNum - 1, 1).getDay()
    
    // Generate calendar days (only Sunday to Thursday)
    const calendarData = interns.map(intern => {
      const internAttendance: { date: string; status: 'attended' | 'absent' | 'weekend' | null }[] = []
      
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, monthNum - 1, day)
        const dayOfWeek = date.getDay() // 0 = Sunday, 6 = Saturday
        
        // Only include Sunday (0) to Thursday (4)
        if (dayOfWeek >= 0 && dayOfWeek <= 4) {
          const dateStr = `${month}-${day.toString().padStart(2, '0')}`
          const userAttendance = attendanceMap.get(intern.id)
          const attendanceData = userAttendance?.get(dateStr) || { status: 'absent' }
          
          internAttendance.push({
            date: dateStr,
            status: attendanceData.status as 'attended' | 'absent',
            clockInTime: attendanceData.clockInTime || null,
            clockOutTime: attendanceData.clockOutTime || null,
            clockInImage: attendanceData.clockInImage || null,
            clockOutImage: attendanceData.clockOutImage || null
          })
        }
      }
      
      return {
        internId: intern.id,
        internName: intern.fullName,
        department: intern.department,
        attendance: internAttendance
      }
    })

    return NextResponse.json({
      success: true,
      month,
      calendarData,
      totalInterns: interns.length
    })
  } catch (error: any) {
    console.error('Get calendar attendance error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'An error occurred while fetching calendar attendance.',
        calendarData: []
      },
      { status: 500 }
    )
  }
}

