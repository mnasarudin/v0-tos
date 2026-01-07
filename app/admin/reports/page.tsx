"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminGuard } from '@/components/auth-guard'
import { AdminLayout } from '@/components/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Users, CheckCircle2, Clock, XCircle, Building2, Calendar } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'

export default function ReportsPage() {
  const router = useRouter()
  const [activeInterns, setActiveInterns] = useState(0)
  const [attendanceStats, setAttendanceStats] = useState({
    onTime: 0,
    late: 0,
    absent: 0
  })
  const [departmentBreakdown, setDepartmentBreakdown] = useState<{ department: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch active interns
      const internsRes = await fetch('/api/auth/interns')
      const internsData = await internsRes.json()
      const interns = internsData.interns || []
      
      // Filter active interns
      const active = interns.filter((i: any) => 
        i.isActive !== 0 && i.isActive !== false && i.isActive !== '0'
      )
      setActiveInterns(active.length)

      // Get today's date
      const today = new Date().toISOString().split('T')[0]
      const currentMonth = today.slice(0, 7)

      // Fetch today's attendance stats
      const statsRes = await fetch(`/api/attendance/stats?month=${currentMonth}`)
      const statsData = await statsRes.json()
      
      // Get today's attendance records
      const attendanceRes = await fetch(`/api/attendance?date=${today}`)
      const attendanceData = await attendanceRes.json()
      const todayRecords = attendanceData.records || []

      // Calculate today's stats
      let onTime = 0
      let late = 0
      let absent = 0

      todayRecords.forEach((record: any) => {
        const status = (record.status || '').toLowerCase().trim()
        if (status === 'on-time' || status === 'on time' || status === 'ontime') {
          onTime++
        } else if (status === 'late') {
          late++
        } else if (status === 'absent') {
          absent++
        }
      })

      // If no records, all are absent
      if (todayRecords.length === 0) {
        absent = active.length
      } else {
        // Count absent as active interns without records
        const internIdsWithRecords = new Set(todayRecords.map((r: any) => r.userId))
        absent = active.filter((i: any) => !internIdsWithRecords.has(i.id)).length
      }

      setAttendanceStats({ onTime, late, absent })

      // Calculate department breakdown
      const deptMap = new Map<string, number>()
      active.forEach((intern: any) => {
        const dept = intern.department || 'Unknown'
        deptMap.set(dept, (deptMap.get(dept) || 0) + 1)
      })
      
      const breakdown = Array.from(deptMap.entries())
        .map(([department, count]) => ({ department, count }))
        .sort((a, b) => b.count - a.count)
      
      setDepartmentBreakdown(breakdown)
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const total = attendanceStats.onTime + attendanceStats.late + attendanceStats.absent
  const onTimePercent = activeInterns > 0 ? Math.round((attendanceStats.onTime / activeInterns) * 100) : 0
  const latePercent = activeInterns > 0 ? Math.round((attendanceStats.late / activeInterns) * 100) : 0
  const absentPercent = activeInterns > 0 ? Math.round((attendanceStats.absent / activeInterns) * 100) : 0

  const maxChartValue = Math.max(attendanceStats.onTime, attendanceStats.late, attendanceStats.absent, 1)
  const chartHeight = 100

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Active Interns Attendance Flow</h1>
            <p className="text-sm text-gray-600 mt-1">Overall attendance statistics and flow visualization</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin')}
              className="mt-2 text-[#008B8B] hover:text-[#006666]"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              ← Back to Dashboard
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#008B8B] mx-auto mb-2"></div>
                <p className="text-gray-600">Loading attendance data...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-[#008B8B]/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Total Active Interns
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-gray-900">{activeInterns}</p>
                  </CardContent>
                </Card>

                <Card className="border-green-400/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      On-Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-green-600">{attendanceStats.onTime}</p>
                    <p className="text-sm text-gray-500 mt-1">{onTimePercent}%</p>
                  </CardContent>
                </Card>

                <Card className="border-yellow-400/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      Late
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-yellow-600">{attendanceStats.late}</p>
                    <p className="text-sm text-gray-500 mt-1">{latePercent}%</p>
                  </CardContent>
                </Card>

                <Card className="border-red-400/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      Absent
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-red-600">{attendanceStats.absent}</p>
                    <p className="text-sm text-gray-500 mt-1">{absentPercent}%</p>
                  </CardContent>
                </Card>
              </div>

              {/* Attendance Flow Chart */}
              <Card className="border-[#008B8B]/20">
                <CardHeader>
                  <CardTitle>Attendance Flow Chart</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Flow Diagram */}
                  <div className="flex flex-col items-center space-y-4">
                    {/* Top Box - Active Interns */}
                    <div className="bg-[#008B8B] text-white px-8 py-4 rounded-lg font-semibold text-lg">
                      {activeInterns} Active Interns
                    </div>
                    
                    {/* Vertical Line */}
                    <div className="w-1 h-8 bg-gray-300"></div>
                    
                    {/* Three Boxes */}
                    <div className="flex gap-4">
                      <div className="bg-green-500 text-white px-6 py-4 rounded-lg text-center min-w-[120px]">
                        <div className="text-2xl font-bold">{attendanceStats.onTime}</div>
                        <div className="text-sm">On-Time</div>
                        <div className="text-xs mt-1">{onTimePercent}%</div>
                      </div>
                      <div className="bg-orange-500 text-white px-6 py-4 rounded-lg text-center min-w-[120px]">
                        <div className="text-2xl font-bold">{attendanceStats.late}</div>
                        <div className="text-sm">Late</div>
                        <div className="text-xs mt-1">{latePercent}%</div>
                      </div>
                      <div className="bg-red-500 text-white px-6 py-4 rounded-lg text-center min-w-[120px]">
                        <div className="text-2xl font-bold">{attendanceStats.absent}</div>
                        <div className="text-sm">Absent</div>
                        <div className="text-xs mt-1">{absentPercent}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Bar Chart */}
                  <div className="mt-8 space-y-2">
                    <div className="flex items-end gap-4 h-32">
                      {/* Y-axis labels */}
                      <div className="flex flex-col justify-between h-full text-xs text-gray-500 pr-2">
                        {[4, 3, 2, 1, 0].map((val) => (
                          <span key={val}>{val}</span>
                        ))}
                      </div>
                      
                      {/* Bars */}
                      <div className="flex-1 flex items-end gap-8">
                        <div className="flex-1 flex flex-col items-center">
                          <div 
                            className="w-full bg-green-500 rounded-t transition-all"
                            style={{ height: `${(attendanceStats.onTime / maxChartValue) * chartHeight}%`, minHeight: attendanceStats.onTime > 0 ? '4px' : '0' }}
                          ></div>
                          <div className="mt-2 text-xs text-gray-600">On-Time</div>
                        </div>
                        <div className="flex-1 flex flex-col items-center">
                          <div 
                            className="w-full bg-orange-500 rounded-t transition-all"
                            style={{ height: `${(attendanceStats.late / maxChartValue) * chartHeight}%`, minHeight: attendanceStats.late > 0 ? '4px' : '0' }}
                          ></div>
                          <div className="mt-2 text-xs text-gray-600">Late</div>
                        </div>
                        <div className="flex-1 flex flex-col items-center">
                          <div 
                            className="w-full bg-red-500 rounded-t transition-all"
                            style={{ height: `${(attendanceStats.absent / maxChartValue) * chartHeight}%`, minHeight: attendanceStats.absent > 0 ? '4px' : '0' }}
                          ></div>
                          <div className="mt-2 text-xs text-gray-600">Absent</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Department Breakdown */}
              <Card className="border-[#008B8B]/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Department Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {departmentBreakdown.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">No departments found</p>
                  ) : (
                    <div className="space-y-3">
                      {departmentBreakdown.map((dept, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium text-gray-900">{dept.department}</span>
                          <span className="text-sm text-gray-600">
                            {dept.count} active intern{dept.count !== 1 ? 's' : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </AdminLayout>
    </AdminGuard>
  )
}
