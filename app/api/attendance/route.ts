import { NextRequest, NextResponse } from 'next/server'
import { getAttendanceByUser } from '@/lib/db-utils'
import db from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const date = searchParams.get('date')

    if (date) {
      // Fetch attendance records for a specific date
      const records = db.prepare(`
        SELECT 
          a.*,
          u.fullName,
          u.department,
          u.email
        FROM attendance a
        JOIN users u ON a.userId = u.id
        WHERE a.date = ?
        ORDER BY a.clockInTime DESC
      `).all(date) as any[]

      const formattedRecords = records.map((record: any) => ({
        id: record.id,
        userId: record.userId,
        date: record.date,
        clockInTime: record.clockInTime,
        clockOutTime: record.clockOutTime,
        status: record.status || 'absent',
        fullName: record.fullName,
        department: record.department,
        email: record.email,
        createdAt: record.createdAt,
      }))

      return NextResponse.json({
        success: true,
        records: formattedRecords
      })
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID or date is required' },
        { status: 400 }
      )
    }

    const records = getAttendanceByUser(userId)

    // Format records for response
    const formattedRecords = records.map((record: any) => ({
      id: record.id,
      userId: record.userId,
      date: record.date,
      clockInTime: record.clockInTime,
      clockOutTime: record.clockOutTime,
      clockInImage: record.clockInImage || record.clockInPhoto,
      clockOutImage: record.clockOutImage || record.clockOutPhoto,
      clockInLatitude: record.clockInLatitude || record.clockInLat,
      clockInLongitude: record.clockInLongitude || record.clockInLng,
      clockOutLatitude: record.clockOutLatitude || record.clockOutLat,
      clockOutLongitude: record.clockOutLongitude || record.clockOutLng,
      status: record.status || 'absent',
      createdAt: record.createdAt,
    }))

    return NextResponse.json({
      success: true,
      records: formattedRecords
    })
  } catch (error: any) {
    console.error('Get attendance error:', error)
    return NextResponse.json(
      { success: false, error: 'An error occurred while fetching attendance records.' },
      { status: 500 }
    )
  }
}

