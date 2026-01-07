"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AdminGuard } from '@/components/auth-guard'
import { AdminLayout } from '@/components/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ArrowLeft, Download, Printer, Mail, Building2, User, Phone, MapPin, Calendar, Clock, FileText, Eye } from 'lucide-react'
import { exportTableToPDF } from '@/lib/pdf-export'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function InternDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const internId = params?.id as string
  
  const [intern, setIntern] = useState<any>(null)
  const [attendance, setAttendance] = useState<any[]>([])
  const [leaves, setLeaves] = useState<any[]>([])
  const [volumeLogs, setVolumeLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'attendance' | 'leave' | 'volume-logs'>('attendance')
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [viewImage, setViewImage] = useState<{ open: boolean; image: string | null; type: 'clockIn' | 'clockOut' }>({ open: false, image: null, type: 'clockIn' })

  useEffect(() => {
    if (internId) {
      fetchInternData()
    }
  }, [internId])

  useEffect(() => {
    if (internId && activeTab === 'attendance') {
      fetchMonthlyAttendance()
    }
  }, [internId, selectedMonth, activeTab])

  const fetchInternData = async () => {
    try {
      setLoading(true)
      
      // Fetch intern details
      const internRes = await fetch(`/api/auth/interns`)
      const internData = await internRes.json()
      const foundIntern = internData.interns?.find((i: any) => i.id === internId)
      
      if (foundIntern) {
        setIntern(foundIntern)
        
        // Fetch attendance records
        try {
          const attendanceRes = await fetch(`/api/attendance?userId=${internId}`)
          const attendanceData = await attendanceRes.json()
          if (attendanceData.success) {
            setAttendance(attendanceData.records || [])
          }
        } catch (error) {
          console.error('Error fetching attendance:', error)
        }
        
        // Fetch leave applications
        const leavesRes = await fetch(`/api/leaves?userId=${internId}`)
        const leavesData = await leavesRes.json()
        if (leavesData.success) {
          setLeaves(leavesData.leaves || [])
        }
        
        // Fetch volume logs
        const logsRes = await fetch(`/api/logs?userId=${internId}`)
        const logsData = await logsRes.json()
        if (logsData.success) {
          setVolumeLogs(logsData.logs || [])
        }
      } else {
        router.push('/admin/interns')
      }
    } catch (error) {
      console.error('Error fetching intern data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMonthlyAttendance = async () => {
    try {
      // Fetch attendance records for the selected month
      const response = await fetch(`/api/attendance?userId=${internId}`)
      const data = await response.json()
      
      if (data.success) {
        const records = data.records || []
        // Filter for the selected month and only Sunday to Thursday
        const monthRecords = records.filter((record: any) => {
          if (!record.date) return false
          const recordMonth = record.date.slice(0, 7)
          if (recordMonth !== selectedMonth) return false
          
          // Check if it's Sunday to Thursday
          const date = new Date(record.date)
          const dayOfWeek = date.getDay() // 0 = Sunday, 6 = Saturday
          return dayOfWeek >= 0 && dayOfWeek <= 4
        })
        
        // Sort by date (newest first)
        monthRecords.sort((a: any, b: any) => {
          return b.date.localeCompare(a.date)
        })
        
        setAttendance(monthRecords)
      }
    } catch (error) {
      console.error('Error fetching monthly attendance:', error)
      setAttendance([])
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
    if (activeTab === 'attendance') {
      const monthName = new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      exportTableToPDF({
        title: `Attendance Records - ${monthName}`,
        filterText: `Showing Sunday to Thursday only`,
        columns: [
          { header: 'Date', accessor: (row: any) => {
            if (!row.date) return '-'
            const dateObj = new Date(row.date)
            return dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/')
          }, width: 30 },
          { header: 'Clock In', accessor: (row: any) => row.clockInTime || '-', width: 30 },
          { header: 'Clock Out', accessor: (row: any) => row.clockOutTime || '-', width: 30 },
          { header: 'Status', accessor: (row: any) => {
            const status = (row.status || '').toLowerCase().trim()
            const isAttended = status === 'on-time' || status === 'on time' || status === 'ontime' || status === 'late'
            return isAttended ? 'Attended' : 'Absent'
          }, width: 30 }
        ],
        data: attendance,
        filename: `attendance_${intern?.fullName || 'intern'}_${selectedMonth}.pdf`
      })
    } else if (activeTab === 'leave') {
      exportTableToPDF({
        title: 'Leave Applications',
        columns: [
          { header: 'Date Range', accessor: (row: any) => {
            if (row.startDate && row.endDate) {
              return `${new Date(row.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/')} - ${new Date(row.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/')}`
            }
            return '-'
          }, width: 50 },
          { header: 'Leave Type', accessor: (row: any) => {
            return row.leaveType === 'regular' ? 'Regular Leave' : row.leaveType === 'emergency' ? 'Emergency Leave' : 'MC'
          }, width: 40 },
          { header: 'Reason', accessor: (row: any) => row.reason || '-', width: 80 },
          { header: 'Status', accessor: (row: any) => {
            return row.status === 'approved_hod' ? 'Approved' : row.status === 'supervisor_approved' ? 'Pending Final Review' : row.status === 'rejected' ? 'Rejected' : 'Pending'
          }, width: 50 }
        ],
        data: leaves,
        filename: `leave_applications_${intern?.fullName || 'intern'}.pdf`,
        userName: intern?.fullName,
        userDepartment: intern?.department
      })
    } else if (activeTab === 'volume-logs') {
      exportTableToPDF({
        title: 'Volume Logs',
        columns: [
          { header: 'Date', accessor: (row: any) => row.date ? new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/') : '-', width: 40 },
          { 
            header: 'Log Content', 
            accessor: (row: any) => {
              if (!row.content) return '-'
              const lines = row.content.split('\n').filter((line: string) => line.trim())
              return lines.map((line: string) => `- ${line.trim()}`).join('\n')
            },
            width: 140
          }
        ],
        data: volumeLogs,
        filename: `volume_logs_${intern?.fullName || 'intern'}.pdf`,
        userName: intern?.fullName,
        userDepartment: intern?.department
      })
    }
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    let tableContent = ''
    let tableHeaders = ''
    let tableRows = ''

    if (activeTab === 'attendance') {
      const monthName = new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      tableHeaders = '<tr><th>Date</th><th>Clock In</th><th>Clock Out</th><th>Status</th></tr>'
      tableRows = attendance.map(record => {
        const dateStr = record.date ? new Date(record.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/') : '-'
        const status = (record.status || '').toLowerCase().trim()
        const isAttended = status === 'on-time' || status === 'on time' || status === 'ontime' || status === 'late'
        const statusText = isAttended ? 'Attended' : 'Absent'
        return `
        <tr>
          <td>${dateStr}</td>
          <td>${record.clockInTime || '-'}</td>
          <td>${record.clockOutTime || '-'}</td>
          <td>${statusText}</td>
        </tr>
      `
      }).join('')
      tableContent = `<table>${tableHeaders}${tableRows}</table>`
    } else if (activeTab === 'leave') {
      tableHeaders = '<tr><th>Date Range</th><th>Leave Type</th><th>Reason</th><th>Status</th></tr>'
      tableRows = leaves.map(leave => `
        <tr>
          <td>${leave.startDate && leave.endDate 
            ? `${new Date(leave.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/')} - ${new Date(leave.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/')}`
            : '-'}</td>
          <td>${leave.leaveType === 'regular' ? 'Regular Leave' : leave.leaveType === 'emergency' ? 'Emergency Leave' : 'MC'}</td>
          <td>${leave.reason || '-'}</td>
          <td>${leave.status === 'approved_hod' ? 'Approved' : leave.status === 'supervisor_approved' ? 'Pending Final Review' : leave.status === 'rejected' ? 'Rejected' : 'Pending'}</td>
        </tr>
      `).join('')
      tableContent = `<table>${tableHeaders}${tableRows}</table>`
    } else if (activeTab === 'volume-logs') {
      tableHeaders = '<tr><th>Date</th><th>Log Content</th></tr>'
      tableRows = volumeLogs.map(log => {
        const content = (log.content || '').split('\n').filter((line: string) => line.trim()).map((line: string) => `- ${line.trim()}`).join('<br>')
        return `
        <tr>
          <td>${log.date ? new Date(log.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/') : '-'}</td>
          <td>${content || '-'}</td>
        </tr>
      `
      }).join('')
      tableContent = `<table>${tableHeaders}${tableRows}</table>`
    }

    const monthName = activeTab === 'attendance' ? new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : ''
    const title = activeTab === 'attendance' ? `Attendance Records - ${monthName}` : activeTab === 'leave' ? 'Leave Applications' : 'Volume Logs'

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title} - ${intern?.fullName || 'Intern'}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              margin: 0;
            }
            h1 {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .info {
              font-size: 12px;
              margin-bottom: 15px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            th {
              background-color: #f3f4f6;
              border: 1px solid #d1d5db;
              padding: 8px;
              text-align: left;
              font-weight: bold;
              font-size: 11px;
            }
            td {
              border: 1px solid #d1d5db;
              padding: 8px;
              font-size: 11px;
            }
            tr:nth-child(even) {
              background-color: #f9fafb;
            }
            @media print {
              body { margin: 0; padding: 15px; }
              @page { margin: 1cm; }
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <div class="info">
            <div><strong>Name:</strong> ${intern?.fullName || '-'}</div>
            <div><strong>Department:</strong> ${intern?.department || '-'}</div>
            ${activeTab === 'attendance' ? `<div><strong>Period:</strong> ${monthName}</div><div><strong>Showing:</strong> Sunday to Thursday only</div>` : ''}
          </div>
          ${tableContent}
        </body>
      </html>
    `)
    printWindow.document.close()
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }

  if (loading) {
    return (
      <AdminGuard>
        <AdminLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#008B8B] mx-auto mb-2"></div>
              <p className="text-gray-600">Loading intern details...</p>
            </div>
          </div>
        </AdminLayout>
      </AdminGuard>
    )
  }

  if (!intern) {
    return (
      <AdminGuard>
        <AdminLayout>
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-600">Intern not found</p>
          </div>
        </AdminLayout>
      </AdminGuard>
    )
  }

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/interns')}
              className="text-[#008B8B] hover:text-[#006666]"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Intern Details</h1>
          </div>

          {/* Intern Information Card */}
          <Card className="border-[#008B8B]/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={intern.profilePhoto} alt={intern.fullName} />
                  <AvatarFallback className="bg-[#008B8B]/10 text-[#008B8B] text-2xl">
                    {getInitials(intern.fullName || intern.username || '?')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">{intern.fullName || '-'}</h2>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{intern.email || '-'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Unit: {intern.department || '-'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Username: {intern.username || '-'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">
                        Emergency Contact: {intern.emergencyContactName || '-'} / {intern.emergencyContactPhone || '-'}
                      </span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                      <span className="text-gray-600">{intern.address || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">
                        Joined: {intern.createdAt ? new Date(intern.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/') : '-'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex gap-2">
              <Button
                variant={activeTab === 'attendance' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('attendance')}
                className={activeTab === 'attendance' ? 'bg-[#008B8B] text-white hover:bg-[#006666]' : ''}
              >
                <Clock className="h-4 w-4 mr-2" />
                Attendance
              </Button>
              <Button
                variant={activeTab === 'leave' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('leave')}
                className={activeTab === 'leave' ? 'bg-[#008B8B] text-white hover:bg-[#006666]' : ''}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Leave
              </Button>
              <Button
                variant={activeTab === 'volume-logs' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('volume-logs')}
                className={activeTab === 'volume-logs' ? 'bg-[#008B8B] text-white hover:bg-[#006666]' : ''}
              >
                <FileText className="h-4 w-4 mr-2" />
                Volume Logs
              </Button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'attendance' && (
            <Card className="border-[#008B8B]/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Attendance</CardTitle>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="border rounded-md px-3 py-2 text-sm"
                    />
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
              </CardHeader>
              <CardContent>
                {attendance.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No attendance records found</p>
                ) : (
                  <div className="space-y-4">
                    {attendance.map((record: any) => {
                      const dateObj = new Date(record.date)
                      const dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/')
                      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' })
                      const status = (record.status || '').toLowerCase().trim()
                      const isAttended = status === 'on-time' || status === 'on time' || status === 'ontime' || status === 'late'
                      
                      return (
                        <div
                          key={record.id}
                          className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className="text-center min-w-[80px]">
                                <p className="text-sm font-semibold text-gray-900">{dateStr}</p>
                                <p className="text-xs text-gray-500">{dayName}</p>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-4">
                                  <div className="text-center">
                                    <p className="text-xs text-gray-500 mb-1">Clock In</p>
                                    <p className="text-sm font-medium">{record.clockInTime || '-'}</p>
                                    {record.clockInImage && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-xs mt-1"
                                        onClick={() => setViewImage({ open: true, image: record.clockInImage, type: 'clockIn' })}
                                      >
                                        <Eye className="h-3 w-3 mr-1" />
                                        View Photo
                                      </Button>
                                    )}
                                  </div>
                                  <div className="text-center">
                                    <p className="text-xs text-gray-500 mb-1">Clock Out</p>
                                    <p className="text-sm font-medium">{record.clockOutTime || '-'}</p>
                                    {record.clockOutImage && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-xs mt-1"
                                        onClick={() => setViewImage({ open: true, image: record.clockOutImage, type: 'clockOut' })}
                                      >
                                        <Eye className="h-3 w-3 mr-1" />
                                        View Photo
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div>
                                <Badge className={
                                  isAttended
                                    ? 'bg-green-500 text-white'
                                    : 'bg-red-500 text-white'
                                }>
                                  {isAttended ? 'Attended' : 'Absent'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'leave' && (
            <Card className="border-[#008B8B]/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Leave Applications</CardTitle>
                  <div className="flex gap-2">
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
              </CardHeader>
              <CardContent>
                {leaves.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No leave applications found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide p-4">Date Range</th>
                          <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide p-4">Leave Type</th>
                          <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide p-4">Reason</th>
                          <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide p-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaves.map((leave: any) => (
                          <tr key={leave.id} className="border-b border-gray-100">
                            <td className="p-4 text-sm">
                              {leave.startDate && leave.endDate 
                                ? `${new Date(leave.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/')} - ${new Date(leave.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/')}`
                                : '-'
                              }
                            </td>
                            <td className="p-4">
                              <Badge className={
                                leave.leaveType === 'regular' 
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : leave.leaveType === 'emergency'
                                  ? 'bg-orange-50 text-orange-700 border-orange-200'
                                  : 'bg-red-50 text-red-700 border-red-200'
                              }>
                                {leave.leaveType === 'regular' ? 'Regular Leave' : leave.leaveType === 'emergency' ? 'Emergency Leave' : 'MC'}
                              </Badge>
                            </td>
                            <td className="p-4 text-sm">{leave.reason || '-'}</td>
                            <td className="p-4">
                              <Badge className={
                                leave.status === 'approved_hod'
                                  ? 'bg-green-500 text-white'
                                  : leave.status === 'supervisor_approved'
                                  ? 'bg-blue-500 text-white'
                                  : leave.status === 'rejected'
                                  ? 'bg-red-500 text-white'
                                  : 'bg-yellow-500 text-white'
                              }>
                                {leave.status === 'approved_hod' ? 'Approved' : leave.status === 'supervisor_approved' ? 'Pending Final Review' : leave.status === 'rejected' ? 'Rejected' : 'Pending'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'volume-logs' && (
            <Card className="border-[#008B8B]/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Volume Logs</CardTitle>
                  <div className="flex gap-2">
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
              </CardHeader>
              <CardContent>
                {volumeLogs.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No volume logs found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide p-4">Date</th>
                          <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide p-4">Content</th>
                        </tr>
                      </thead>
                      <tbody>
                        {volumeLogs.map((log: any) => (
                          <tr key={log.id} className="border-b border-gray-100">
                            <td className="p-4 text-sm font-medium">
                              {log.date ? new Date(log.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/') : '-'}
                            </td>
                            <td className="p-4 text-sm text-gray-600 whitespace-pre-wrap">
                              {(log.content || '').split('\n').map((line: string, idx: number) => (
                                <div key={idx}>{line}</div>
                              ))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Image View Dialog */}
        <Dialog open={viewImage.open} onOpenChange={(open) => setViewImage({ open, image: null, type: 'clockIn' })}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{viewImage.type === 'clockIn' ? 'Clock In Photo' : 'Clock Out Photo'}</DialogTitle>
            </DialogHeader>
            {viewImage.image && (
              <div className="mt-4">
                <img
                  src={viewImage.image}
                  alt={viewImage.type === 'clockIn' ? 'Clock In' : 'Clock Out'}
                  className="max-w-full h-auto rounded-lg border border-gray-200"
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </AdminGuard>
  )
}
