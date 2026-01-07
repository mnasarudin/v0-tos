"use client"

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminGuard } from '@/components/auth-guard'
import { AdminLayout } from '@/components/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { 
  Users, 
  Clock, 
  AlertCircle,
  ArrowRight,
  Activity,
  BarChart3,
  UserCheck,
  RefreshCw
} from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'

export default function AdminOverviewPage() {
  const router = useRouter()
  const [stats, setStats] = useState({
    totalInterns: 0,
    activeInterns: 0,
    pendingLeaves: 0,
    totalAttendanceToday: 0,
    lateToday: 0,
    absentToday: 0,
    onTimeToday: 0
  })
  const [recentLeaves, setRecentLeaves] = useState<any[]>([])
  const [allInterns, setAllInterns] = useState<any[]>([])
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'mine' | 'all' | 'leaves'>('all')
  const currentMonth = new Date().toISOString().slice(0, 7)

  useEffect(() => {
    // Check for logout flag - prevent forward navigation after logout
    try {
      if (typeof sessionStorage !== 'undefined') {
        const logoutFlag = sessionStorage.getItem('logoutFlag')
        if (logoutFlag === 'true') {
          sessionStorage.removeItem('logoutFlag')
          router.replace('/login')
          return
        }
      }
    } catch (error) {
      // Ignore errors
    }

    // Replace history to prevent forward navigation
    window.history.replaceState(null, '', window.location.href)
  }, [router])

  useEffect(() => {
    fetchDashboardData()
    
    // Auto-refresh every 30 seconds to update pending leaves count
    const interval = setInterval(() => {
      fetchDashboardData()
    }, 30000) // 30 seconds
    
    // Refresh when page becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchDashboardData()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  useEffect(() => {
    getCurrentUser()
      .then((user) => {
        setCurrentUser(user)
        // Default to 'all' tab to show all interns
        setActiveTab('all')
      })
      .catch(console.error)
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [internsRes, leavesRes, attendanceStatsRes] = await Promise.all([
        fetch('/api/auth/interns').catch(() => ({ json: () => ({ interns: [] }) })),
        // Fetch ALL pending leaves (no department filter for company overview)
        fetch('/api/leaves?status=pending').catch(() => ({ json: () => ({ leaves: [] }) })),
        fetch(`/api/attendance/stats?month=${currentMonth}`).catch(() => ({ json: () => ({ success: false, stats: { onTime: 0, late: 0, absent: 0, total: 0 } }) }))
      ])

      const internsData = await internsRes.json()
      const leavesData = await leavesRes.json()
      const attendanceStatsData = await attendanceStatsRes.json()

      // Get real-time intern count from database
      const interns = internsData.interns || []
      // Filter only active interns (isActive is not 0 and not false)
      const activeInterns = interns.filter((i: any) => {
        return i.isActive !== 0 && i.isActive !== false && i.isActive !== '0'
      }).length

      // Get attendance stats
      const attendanceStats = attendanceStatsData.stats || { onTime: 0, late: 0, absent: 0, total: 0 }

      setStats({
        totalInterns: interns.length, // Real-time count from database
        activeInterns, // Real-time active count
        pendingLeaves: leavesData.leaves?.length || 0,
        totalAttendanceToday: interns.length,
        lateToday: attendanceStats.late || 0,
        absentToday: attendanceStats.absent || 0,
        onTimeToday: attendanceStats.onTime || 0
      })
      setAllInterns(interns)

      // Get recent pending leaves (limit to 5)
      const pendingLeavesList = leavesData.leaves || []
      setPendingLeaves(pendingLeavesList)
      setRecentLeaves(pendingLeavesList.slice(0, 5))
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // Set defaults on error so page still renders
      setStats({
        totalInterns: 0,
        activeInterns: 0,
        pendingLeaves: 0,
        totalAttendanceToday: 0,
        lateToday: 0,
        absentToday: 0,
        onTimeToday: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const myDepartment = currentUser?.department

  const myDepartmentInterns = useMemo(() => {
    if (!myDepartment) return []
    const normalized = myDepartment.trim().toLowerCase()
    return allInterns.filter(intern => (intern.department || '').trim().toLowerCase() === normalized)
  }, [allInterns, myDepartment])

  const myActiveInterns = useMemo(() => {
    return myDepartmentInterns.filter((intern: any) => intern.isActive !== 0 && intern.isActive !== false && intern.isActive !== '0')
  }, [myDepartmentInterns])

  const myPendingLeaves = useMemo(() => {
    if (!myDepartment) return []
    const normalized = myDepartment.trim().toLowerCase()
    return pendingLeaves.filter((leave: any) => (leave.department || '').trim().toLowerCase() === normalized)
  }, [pendingLeaves, myDepartment])

  if (loading) {
    return (
      <AdminGuard>
        <AdminLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#008B8B] mx-auto mb-2"></div>
              <p className="text-gray-600">Loading dashboard...</p>
            </div>
          </div>
        </AdminLayout>
      </AdminGuard>
    )
  }

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-[#00A0A0] to-[#008B8B] rounded-lg p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">Welcome back{currentUser ? `, ${currentUser.fullName}` : ''}!</h1>
                <p className="text-white/90 text-lg">
                  {myDepartment
                    ? `Here is what's happening with your ${myDepartment} interns today.`
                    : "Here's your overview of the intern attendance system."}
                </p>
                {myDepartment && (
                  <p className="text-white/80 mt-2 text-sm uppercase tracking-wide">
                    Focused on {myDepartment}
                  </p>
                )}
              </div>
              <div className="hidden md:block">
                <Activity className="h-24 w-24 text-white/30" />
              </div>
            </div>
          </div>

          {myDepartment && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-[#008B8B]/40 hover:shadow-md transition cursor-pointer" onClick={() => router.push('/admin/interns?view=mine')}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">My Interns</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-gray-900">{myDepartmentInterns.length}</p>
                  <p className="text-sm text-gray-500 mt-1">{myActiveInterns.length} active today</p>
                </CardContent>
              </Card>
              <Card 
                className="border-[#008B8B]/40 hover:shadow-md transition cursor-pointer" 
                onClick={() => router.push('/admin/leaves?view=mydept')}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Pending Leaves (My Dept)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-gray-900">{myPendingLeaves.length}</p>
                  <p className="text-sm text-gray-500 mt-1">Need your approval</p>
                </CardContent>
              </Card>
              <Card className="border-[#008B8B]/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="border-white text-[#008B8B]" onClick={() => router.push('/admin/interns?view=mine')}>
                    Manage My Interns
                  </Button>
                  <Button size="sm" variant="outline" className="border-white text-[#008B8B]" onClick={() => router.push('/admin/leaves')}>
                    Review Leaves
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Company Overview</h2>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={fetchDashboardData}
                  className="text-teal-700 hover:text-teal-900"
                  title="Refresh dashboard data"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => router.push('/admin/reports')} className="text-teal-700 hover:text-teal-900">
                  View Reports
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-[#00A0A0]/30 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/interns?view=all')}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Interns</CardTitle>
                  <div className="h-10 w-10 rounded-full bg-[#00A0A0]/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-[#008B8B]" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-gray-900">{stats.totalInterns}</p>
                  <p className="text-sm text-gray-500">
                    {stats.activeInterns} active
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#00A0A0]/30 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/leaves?view=all')}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">Pending Leaves</CardTitle>
                  <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-gray-900">{stats.pendingLeaves}</p>
                  <p className="text-sm text-gray-500">Awaiting review</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#00A0A0]/30 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/interns')}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">Active Interns</CardTitle>
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <UserCheck className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-gray-900">{stats.activeInterns}</p>
                  <p className="text-sm text-gray-500">Out of {stats.totalInterns} total</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-4 text-[#008B8B] hover:text-[#006666] hover:bg-[#00A0A0]/10 w-full justify-between"
                  onClick={(e) => { e.stopPropagation(); router.push('/admin/interns') }}
                >
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="border-[#00A0A0]/30 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/attendance/stats')}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">Attendance Stats</CardTitle>
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">On Time:</span>
                    <span className="font-semibold text-green-600">{stats.onTimeToday}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Late:</span>
                    <span className="font-semibold text-orange-600">{stats.lateToday}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Absent:</span>
                    <span className="font-semibold text-red-600">{stats.absentToday}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-between text-[#008B8B] hover:text-[#006666] hover:bg-[#00A0A0]/10 mt-3"
                    onClick={(e) => { e.stopPropagation(); router.push('/admin/attendance/stats') }}
                  >
                    View Chart
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            </div>
          </div>

          {/* Multi-tab section */}
          <div>
            <div className="flex flex-wrap items-center justify-between mb-4">
              <div className="flex gap-2">
                <Button
                  variant={activeTab === 'mine' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('mine')}
                >
                  My Interns
                </Button>
                <Button 
                  variant={activeTab === 'all' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('all')}
                >
                  All Interns
                </Button>
                  <Button 
                  variant={activeTab === 'leaves' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('leaves')}
                >
                  Recent Leaves
                  </Button>
                </div>
              <p className="text-sm text-gray-500">
                {activeTab === 'mine' && myDepartment ? `Showing interns from ${myDepartment}` : null}
                {activeTab === 'all' ? 'Company-wide roster' : null}
                {activeTab === 'leaves' ? 'Pending and recent leave activity' : null}
              </p>
            </div>

            <Card className="border-[#008B8B]/20">
              <CardContent className="p-0">
                {activeTab === 'mine' && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#008B8B]/5">
                        <tr>
                          <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide p-4">Name</th>
                          <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide p-4">Email</th>
                          <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide p-4">Status</th>
                          <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide p-4">Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myDepartment ? (
                          myDepartmentInterns.slice(0, 6).map(intern => (
                            <tr 
                              key={intern.id} 
                              className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                              onClick={() => router.push(`/admin/interns/${intern.id}`)}
                            >
                              <td className="p-4 font-medium">{intern.fullName || '-'}</td>
                              <td className="p-4 text-sm text-gray-600">{intern.email || '-'}</td>
                              <td className="p-4">
                                <Badge className={intern.isActive !== 0 && intern.isActive !== false ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-700'}>
                                  {intern.isActive !== 0 && intern.isActive !== false ? 'Active' : 'Inactive'}
                                </Badge>
                              </td>
                              <td className="p-4 text-right text-sm text-gray-500">
                                {intern.createdAt ? new Date(intern.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/') : '-'}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="p-6 text-center text-sm text-gray-500">
                              Add a department to your profile to view your interns here.
                            </td>
                          </tr>
                        )}
                        {myDepartment && myDepartmentInterns.length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-6 text-center text-sm text-gray-500">
                              No interns assigned to your department yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === 'all' && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#008B8B]/5">
                        <tr>
                          <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide p-4">Name</th>
                          <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide p-4">Department</th>
                          <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide p-4">Email</th>
                          <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide p-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allInterns.slice(0, 8).map(intern => (
                          <tr 
                            key={intern.id} 
                            className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                            onClick={() => router.push(`/admin/interns/${intern.id}`)}
                          >
                            <td className="p-4 font-medium">{intern.fullName || '-'}</td>
                            <td className="p-4 text-sm">{intern.department || '-'}</td>
                            <td className="p-4 text-sm text-gray-600">{intern.email || '-'}</td>
                            <td className="p-4 text-right">
                              <Badge className={intern.isActive !== 0 && intern.isActive !== false ? 'bg-[#008B8B] text-white' : 'bg-gray-200 text-gray-700'}>
                                {intern.isActive !== 0 && intern.isActive !== false ? 'Active' : 'Inactive'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                        {allInterns.length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-6 text-center text-sm text-gray-500">
                              No interns found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === 'leaves' && (
                  <div className="overflow-x-auto">
                    <div className="flex items-center justify-between p-4 border-b">
                      <p className="text-sm text-gray-600">
                        Showing all {pendingLeaves.length} pending leave applications
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push('/admin/leaves')}
                        className="text-[#008B8B] hover:text-[#006666]"
                      >
                        View All Leaves
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                    <table className="w-full">
                      <thead className="bg-[#008B8B]/5">
                        <tr>
                          <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide p-4">Intern</th>
                          <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide p-4">Department</th>
                          <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide p-4">Dates</th>
                          <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide p-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingLeaves.map(leave => (
                          <tr 
                            key={leave.id} 
                            className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                            onClick={() => router.push('/admin/leaves')}
                          >
                            <td className="p-4 font-medium">{leave.fullName || '-'}</td>
                            <td className="p-4 text-sm">{leave.department || '-'}</td>
                            <td className="p-4 text-sm text-gray-600">
                              {leave.startDate} - {leave.endDate}
                            </td>
                            <td className="p-4 text-right">
                              <Badge className={leave.status === 'pending' ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-700'}>
                                {leave.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                        {pendingLeaves.length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-6 text-center text-sm text-gray-500">
                              No pending leave applications.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminLayout>
    </AdminGuard>
  )
}
