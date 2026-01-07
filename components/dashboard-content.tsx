"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, Calendar, FileText, User, History } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { getTodayAttendance } from "@/lib/attendance"
import { useRouter } from "next/navigation"
import { markLegitimateNavigation } from "@/lib/navigation-guard"

export function DashboardContent() {
  const [user, setUser] = useState<any>(null)
  const [attendance, setAttendance] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser()
        if (currentUser) {
          setUser(currentUser)
          
          // Fetch today's attendance
          try {
            const today = new Date().toISOString().split('T')[0]
            const response = await fetch(`/api/attendance?userId=${currentUser.id}`)
            const data = await response.json()
            
            if (data.success && data.records) {
              const todayRecord = data.records.find((r: any) => r.date === today)
              setAttendance(todayRecord || null)
            } else {
              setAttendance(null)
            }
          } catch (error) {
            console.error('Error fetching attendance:', error)
            setAttendance(null)
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [])

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#008B8B] mx-auto mb-2"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.fullName}!
        </h1>
        <p className="text-gray-600 mt-2">
          {currentDate}
        </p>
      </div>

      {/* Today's Attendance Card */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-[#008B8B]" />
            Today's Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {attendance ? (
            <div className="space-y-4">
              <p className="text-gray-600">You have already clocked in today.</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Clock In</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {attendance.clockInTime ? new Date(attendance.clockInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : "Not yet"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Clock Out</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {attendance.clockOutTime ? new Date(attendance.clockOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : "Not yet"}
                  </p>
                </div>
              </div>
              {!attendance.clockOutTime && (
                <Button 
                  onClick={() => { markLegitimateNavigation(); router.push('/dashboard/attendance') }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white text-base font-medium py-6 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
                >
                  Clock Out Now
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600">You haven't clocked in today yet.</p>
              <Button 
                onClick={() => { markLegitimateNavigation(); router.push('/dashboard/attendance') }}
                className="w-full bg-green-600 hover:bg-green-700 text-white text-base font-medium py-6 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
              >
                Clock In Now
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card 
            className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-[#008B8B]/50 border border-gray-200"
            onClick={() => { markLegitimateNavigation(); router.push('/dashboard/attendance') }}
          >
            <CardContent className="flex flex-col items-center justify-center p-6 h-full min-h-[120px]">
              <Clock className="h-8 w-8 mb-2 text-[#008B8B]" />
              <p className="text-sm font-medium text-center text-gray-700">Clock In/Out</p>
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-[#008B8B]/50 border border-gray-200"
            onClick={() => { markLegitimateNavigation(); router.push('/dashboard/logs') }}
          >
            <CardContent className="flex flex-col items-center justify-center p-6 h-full min-h-[120px]">
              <FileText className="h-8 w-8 mb-2 text-[#008B8B]" />
              <p className="text-sm font-medium text-center text-gray-700">Volume Log</p>
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-[#008B8B]/50 border border-gray-200"
            onClick={() => { markLegitimateNavigation(); router.push('/dashboard/leave') }}
          >
            <CardContent className="flex flex-col items-center justify-center p-6 h-full min-h-[120px]">
              <Calendar className="h-8 w-8 mb-2 text-[#008B8B]" />
              <p className="text-sm font-medium text-center text-gray-700">Apply Leave</p>
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-[#008B8B]/50 border border-gray-200"
            onClick={() => { markLegitimateNavigation(); router.push('/dashboard/history') }}
          >
            <CardContent className="flex flex-col items-center justify-center p-6 h-full min-h-[120px]">
              <History className="h-8 w-8 mb-2 text-[#008B8B]" />
              <p className="text-sm font-medium text-center text-gray-700">Attendance History</p>
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-[#008B8B]/50 border border-gray-200"
            onClick={() => { markLegitimateNavigation(); router.push('/dashboard/profile') }}
          >
            <CardContent className="flex flex-col items-center justify-center p-6 h-full min-h-[120px]">
              <User className="h-8 w-8 mb-2 text-[#008B8B]" />
              <p className="text-sm font-medium text-center text-gray-700">Profile</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
