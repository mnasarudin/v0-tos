import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET: Fetch attendance statistics
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7) // YYYY-MM format

    // Get all interns (non-admin users)
    const interns = db.prepare(`
      SELECT id, fullName, department 
      FROM users 
      WHERE isAdmin = 0 OR isAdmin IS NULL OR isAdmin = '0'
    `).all() as any[]

    // Get attendance records for the specified month
    const startDate = `${month}-01`
    const endDate = `${month}-31`
    
    const attendanceRecords = db.prepare(`
      SELECT 
        userId,
        date,
        status,
        clockInTime
      FROM attendance
      WHERE date >= ? AND date <= ?
      ORDER BY date ASC
    `).all(startDate, endDate) as any[]

    // Calculate statistics
    const stats = {
      onTime: 0,
      late: 0,
      absent: 0,
      total: interns.length
    }

    // Group attendance by date
    const attendanceByDate: Record<string, any[]> = {}
    attendanceRecords.forEach(record => {
      if (!attendanceByDate[record.date]) {
        attendanceByDate[record.date] = []
      }
      attendanceByDate[record.date].push(record)
    })

    // Count statuses (case-insensitive matching)
    attendanceRecords.forEach(record => {
      const status = (record.status || '').toLowerCase().trim()
      if (status === 'on-time' || status === 'on time' || status === 'ontime') {
        stats.onTime++
      } else if (status === 'late') {
        stats.late++
      } else if (status === 'absent') {
        stats.absent++
      }
    })

    // Calculate daily stats for the month
    const dailyStats: Array<{ date: string; onTime: number; late: number; absent: number }> = []
    
    // Get number of days in the month
    const year = parseInt(month.split('-')[0])
    const monthNum = parseInt(month.split('-')[1])
    const daysInMonth = new Date(year, monthNum, 0).getDate()

    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${month}-${day.toString().padStart(2, '0')}`
      const dayRecords = attendanceByDate[date] || []
      
      const dayStat = {
        date,
        onTime: dayRecords.filter(r => {
          const status = (r.status || '').toLowerCase().trim()
          return status === 'on-time' || status === 'on time' || status === 'ontime'
        }).length,
        late: dayRecords.filter(r => {
          const status = (r.status || '').toLowerCase().trim()
          return status === 'late'
        }).length,
        absent: dayRecords.filter(r => {
          const status = (r.status || '').toLowerCase().trim()
          return status === 'absent'
        }).length
      }
      
      dailyStats.push(dayStat)
    }

    return NextResponse.json({
      success: true,
      month,
      stats,
      dailyStats,
      totalInterns: interns.length
    })
  } catch (error: any) {
    console.error('Get attendance stats error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'An error occurred while fetching attendance statistics.',
        stats: { onTime: 0, late: 0, absent: 0, total: 0 },
        dailyStats: []
      },
      { status: 500 }
    )
  }
}

