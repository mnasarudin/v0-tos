"use client"

import { useState, useEffect } from 'react'
import { AdminGuard } from '@/components/auth-guard'
import { AdminLayout } from '@/components/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Download, Printer, Clock, RefreshCw } from 'lucide-react'
import { exportTableToPDF } from '@/lib/pdf-export'

export default function AttendancePage() {
  const [liveAttendance, setLiveAttendance] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    fetchLiveAttendance()
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchLiveAttendance()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchLiveAttendance = async () => {
    try {
      setLoading(true)
      const today = new Date().toISOString().split('T')[0]
      
      // Get all interns
      const internsRes = await fetch('/api/auth/interns')
      const internsData = await internsRes.json()
      const interns = internsData.interns || []
      
      // Get today's attendance for all interns
      const attendancePromises = interns.map(async (intern: any) => {
        try {
          const res = await fetch(`/api/attendance?userId=${intern.id}`)
          const data = await res.json()
          if (data.success && data.records) {
            const todayRecord = data.records.find((r: any) => r.date === today)
            return {
              ...intern,
              attendance: todayRecord || null,
              clockInTime: todayRecord?.clockInTime || null,
              clockOutTime: todayRecord?.clockOutTime || null,
              status: todayRecord?.status || 'Absent'
            }
          }
          return {
            ...intern,
            attendance: null,
            clockInTime: null,
            clockOutTime: null,
            status: 'Absent'
          }
        } catch (error) {
          return {
            ...intern,
            attendance: null,
            clockInTime: null,
            clockOutTime: null,
            status: 'Absent'
          }
        }
      })
      
      const results = await Promise.all(attendancePromises)
      
      // Sort by most recent activity (clock in/out time)
      const sorted = results.sort((a, b) => {
        const aTime = a.clockOutTime || a.clockInTime
        const bTime = b.clockOutTime || b.clockInTime
        if (!aTime && !bTime) return 0
        if (!aTime) return 1
        if (!bTime) return -1
        return new Date(bTime).getTime() - new Date(aTime).getTime()
      })
      
      setLiveAttendance(sorted)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Error fetching live attendance:', error)
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleExportPDF = () => {
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/')
    exportTableToPDF({
      title: 'Live Attendance',
      filterText: `Date: ${today}`,
      columns: [
        { header: 'Intern', accessor: 'fullName', width: 60 },
        { header: 'Department', accessor: 'department', width: 60 },
        { header: 'Clock In', accessor: (row: any) => row.clockInTime || '-', width: 40 },
        { header: 'Clock Out', accessor: (row: any) => row.clockOutTime || '-', width: 40 },
        { header: 'Status', accessor: (row: any) => row.status || 'Absent', width: 40 }
      ],
      data: liveAttendance,
      filename: `live_attendance_${today.replace(/\//g, '_')}.pdf`
    })
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      return
    }

    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/')
    const tableRows = liveAttendance.map(attendee => `
      <tr>
        <td>${attendee.fullName || '-'}</td>
        <td>${attendee.department || '-'}</td>
        <td>${attendee.clockInTime || '-'}</td>
        <td>${attendee.clockOutTime || '-'}</td>
        <td>${attendee.status || 'Absent'}</td>
      </tr>
    `).join('')

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Live Attendance - ${today}</title>
          <style>
            @media print {
              @page {
                margin: 15mm;
                size: A4;
              }
            }
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { font-size: 18px; font-weight: bold; margin-bottom: 10px; text-align: center; }
            .info { font-size: 12px; margin-bottom: 15px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10px; }
            th { background-color: #f3f4f6; border: 1px solid #d1d5db; padding: 8px 6px; text-align: left; font-weight: bold; font-size: 9px; }
            td { border: 1px solid #d1d5db; padding: 8px 6px; font-size: 9px; }
            tr:nth-child(even) { background-color: #f9fafb; }
          </style>
        </head>
        <body>
          <h1>Live Attendance</h1>
          <div class="info">
            <div><strong>Date:</strong> ${today}</div>
            <div><strong>Last Updated:</strong> ${lastUpdate.toLocaleTimeString()}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Intern</th>
                <th>Department</th>
                <th>Clock In</th>
                <th>Clock Out</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </body>
      </html>
    `)
    printWindow.document.close()
    setTimeout(() => {
      printWindow.focus()
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
              <p className="text-sm text-gray-600 mt-1">Live attendance tracking - who just clocked in/out</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchLiveAttendance}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </div>

          {lastUpdate && (
            <div className="text-sm text-gray-500">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
          )}

          <Card className="border-[#008B8B]/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Today's Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#008B8B] mx-auto mb-2"></div>
                    <p className="text-gray-600">Loading attendance...</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide p-4">Intern</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide p-4">Department</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide p-4">Clock In</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide p-4">Clock Out</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide p-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {liveAttendance.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-gray-500 text-sm">
                            No attendance records found
                          </td>
                        </tr>
                      ) : (
                        liveAttendance.map((attendee) => (
                          <tr key={attendee.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={attendee.profilePhoto} alt={attendee.fullName} />
                                  <AvatarFallback className="bg-[#008B8B]/10 text-[#008B8B]">
                                    {getInitials(attendee.fullName || attendee.username || '?')}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">{attendee.fullName || '-'}</p>
                                  <p className="text-xs text-gray-500">{attendee.email || '-'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-sm">{attendee.department || '-'}</td>
                            <td className="p-4 text-sm">{attendee.clockInTime || '-'}</td>
                            <td className="p-4 text-sm">{attendee.clockOutTime || '-'}</td>
                            <td className="p-4">
                              <Badge className={
                                attendee.status === 'on-time' || attendee.status === 'On Time'
                                  ? 'bg-green-500 text-white'
                                  : attendee.status === 'late' || attendee.status === 'Late'
                                  ? 'bg-orange-500 text-white'
                                  : 'bg-red-500 text-white'
                              }>
                                {attendee.status || 'Absent'}
                              </Badge>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </AdminGuard>
  )
}
