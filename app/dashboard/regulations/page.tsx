"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Clock, FileText, History, Calendar, User, CheckCircle2 } from "lucide-react"
import { checkDirectAccess } from "@/lib/navigation-guard"

export default function RegulationsPage() {
  const router = useRouter()

  useEffect(() => {
    // Check if this is a legitimate login redirect (has auth params)
    const urlParams = new URLSearchParams(window.location.search)
    const isLoginRedirect = urlParams.get('auth') === 'true' && urlParams.get('userId')
    
    // Only check for direct access if this is NOT a login redirect
    if (!isLoginRedirect) {
      try {
        if (checkDirectAccess()) {
          console.log('[RegulationsPage] Direct access detected, redirecting to homepage')
          router.replace('/')
          return
        }
      } catch (error) {
        console.error('[RegulationsPage] Error checking direct access:', error)
      }
    }

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
  const features = [
    {
      icon: Clock,
      title: "Clock In/Out System",
      description: "Track your daily attendance by clocking in when you arrive and clocking out when you leave.",
      details: [
        "Clock in when you arrive at work",
        "Clock out when you leave for the day",
        "Your attendance is automatically recorded with timestamps",
        "Location and photo verification may be required",
        "Late clock-ins will be marked accordingly"
      ]
    },
    {
      icon: FileText,
      title: "Volume Logs",
      description: "Document your daily work activities and accomplishments.",
      details: [
        "Record your daily tasks and activities",
        "Track your work progress and achievements",
        "Maintain a log of your internship activities",
        "Help supervisors understand your contributions",
        "Volume logs can only be accessed and edited from 8:00 AM to 7:00 PM daily"
      ]
    },
    {
      icon: History,
      title: "Attendance History",
      description: "View your complete attendance record and track your attendance patterns.",
      details: [
        "View all your past attendance records",
        "See your clock-in and clock-out times",
        "Track your attendance status (on-time, late, absent)",
        "Monitor your attendance trends over time"
      ]
    },
    {
      icon: Calendar,
      title: "Leave Applications",
      description: "Apply for leave and track the status of your applications through the approval process.",
      details: [
        "Submit leave applications with start and end dates",
        "Provide a reason for your leave request",
        "Track application status through approval stages:",
        "  • Pending Supervisor Review",
        "  • Pending Final Review (Encik Shap)",
        "  • Approved or Rejected",
        "Receive notifications when your leave is approved or rejected"
      ]
    },
    {
      icon: User,
      title: "Profile Management",
      description: "Manage your personal information and account settings.",
      details: [
        "Update your personal information",
        "View and edit your contact details",
        "Manage your emergency contact information",
        "Update your profile photo"
      ]
    }
  ]

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col overflow-hidden">
      {/* Title Section - Moved down */}
      <div className="flex-shrink-0 mb-4 mt-6">
        <div className="flex items-center gap-3 mb-1">
          <BookOpen className="h-7 w-7 text-[#008B8B]" />
          <h1 className="text-3xl font-bold">System Regulations & Features</h1>
        </div>
        <p className="text-base text-muted-foreground ml-10">
          Learn about the system features and guidelines
        </p>
      </div>

      {/* Content Section - Non-scrollable, fits screen */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {/* System Features */}
        <div className="flex-1 min-h-0 overflow-y-auto mb-4 pr-2">
          <h2 className="text-2xl font-semibold mb-3 text-gray-900">System Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={index} className="border-[#00A0A0]/30 hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-10 w-10 rounded-lg bg-[#008B8B]/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-5 w-5 text-[#008B8B]" />
                      </div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </div>
                    <CardDescription className="text-sm">{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-1.5">
                      {feature.details.map((detail, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="leading-relaxed">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

