"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardContent } from "@/components/dashboard-content"
import { checkDirectAccess } from "@/lib/navigation-guard"
import { getCurrentUser } from "@/lib/auth"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is admin - if so, redirect to admin dashboard
    const checkUserRole = async () => {
      try {
        const user = await getCurrentUser()
        if (user) {
          const userIsAdmin = user.isAdmin === 1 || 
                            user.isAdmin === true || 
                            String(user.isAdmin) === '1' || 
                            String(user.isAdmin) === 'true'
          if (userIsAdmin) {
            console.log('[Dashboard] Admin user detected, redirecting to admin dashboard')
            router.replace('/admin')
            return
          }
        }
      } catch (error) {
        console.error('[Dashboard] Error checking user role:', error)
      }
    }
    checkUserRole()

    // Check if this is a legitimate login redirect (has auth params)
    const urlParams = new URLSearchParams(window.location.search)
    const isLoginRedirect = urlParams.get('auth') === 'true' && urlParams.get('userId')
    
    // Only check for direct access if this is NOT a login redirect
    if (!isLoginRedirect) {
      try {
        if (checkDirectAccess()) {
          console.log('[Dashboard] Direct access detected, redirecting to homepage')
          router.replace('/')
          return
        }
      } catch (error) {
        console.error('[Dashboard] Error checking direct access:', error)
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

  return (
    <AuthGuard>
      <DashboardLayout>
        <DashboardContent />
      </DashboardLayout>
    </AuthGuard>
  )
}
