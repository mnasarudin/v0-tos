"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
// Removed isAuthenticated import - will check auth client-side via localStorage
import { Loader2 } from "lucide-react"
import { checkDirectAccess } from "@/lib/navigation-guard"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthed, setIsAuthed] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    let mounted = true
    
    // IMMEDIATELY block rendering until verification is complete
    // This prevents any content from showing before authentication is verified
    
    // FIRST: Check URL parameters (login redirects)
    const urlParams = new URLSearchParams(window.location.search)
    const urlAuth = urlParams.get('auth') === 'true'
    const urlUserId = urlParams.get('userId')
    
    if (urlAuth && urlUserId) {
      console.log('[AuthGuard] URL auth params detected - verifying...')
      
      // Verify the user from server even with URL params (security)
      fetch(`/api/auth/me?userId=${urlUserId}`, {
        credentials: 'include',
        cache: 'no-store'
      })
        .then(r => r.json())
        .then(data => {
          if (data.success && data.user && mounted) {
            // Save to storage
            try {
              localStorage.setItem('isAuthenticated', 'true')
              localStorage.setItem('currentUserId', String(data.user.id))
              localStorage.setItem('currentUser', JSON.stringify(data.user))
            } catch (e) {}
            
            try {
              if (typeof sessionStorage !== 'undefined') {
                sessionStorage.setItem('isAuthenticated', 'true')
                sessionStorage.setItem('currentUserId', String(data.user.id))
                sessionStorage.setItem('currentUser', JSON.stringify(data.user))
              }
            } catch (e) {}
            
            if (mounted) {
              setIsAuthed(true)
              setIsLoading(false)
            }
            
            // Clean URL
            setTimeout(() => {
              if (mounted) {
                window.history.replaceState({}, '', window.location.pathname)
              }
            }, 100)
          } else {
            // Invalid URL params - redirect
            if (mounted) {
              setIsAuthed(false)
              setIsLoading(false)
              router.replace('/')
            }
          }
        })
        .catch(() => {
          if (mounted) {
            setIsAuthed(false)
            setIsLoading(false)
            router.replace('/')
          }
        })
      
      return () => {
        mounted = false
      }
    }
    
    // SECOND: Check for logout flag
    try {
      if (typeof sessionStorage !== 'undefined') {
        const logoutFlag = sessionStorage.getItem('logoutFlag')
        if (logoutFlag === 'true') {
          console.log('[AuthGuard] Logout flag detected, redirecting to homepage')
          sessionStorage.removeItem('logoutFlag')
          if (mounted) {
            setIsAuthed(false)
            setIsLoading(false)
            router.replace('/')
          }
          return () => {
            mounted = false
          }
        }
      }
    } catch (error) {
      console.error('[AuthGuard] Error checking logout flag:', error)
    }
    
    // THIRD: Always verify user from server (cookie-based) - this is the main security check
    // This prevents URL bypass by ensuring a valid cookie exists
    const verifyUserFromServer = async () => {
      try {
        // Fetch user from server (uses cookie as source of truth)
        const response = await fetch('/api/auth/me', {
          credentials: 'include', // Include cookies
          cache: 'no-store' // Always fetch fresh data
        })
        
        if (!response.ok || response.status === 401) {
          // No valid session on server - BLOCK ACCESS
          console.log('[AuthGuard] No valid session on server, redirecting to homepage')
          // Clear all storage
          try {
            localStorage.clear()
            if (typeof sessionStorage !== 'undefined') {
              sessionStorage.clear()
            }
          } catch (e) {}
          
          if (mounted) {
            setIsAuthed(false)
            setIsLoading(false)
            router.replace('/')
          }
          return false
        }
        
        const data = await response.json()
        
        if (data.success && data.user) {
          const serverUser = data.user
          const serverUserId = String(serverUser.id)
          
          // Get stored user for comparison
          let storedUserId: string | null = null
          try {
            storedUserId = sessionStorage.getItem('currentUserId') || localStorage.getItem('currentUserId')
          } catch (e) {}
          
          // If stored user doesn't match server user, clear and update
          if (storedUserId && storedUserId !== serverUserId) {
            console.log('[AuthGuard] Stored user mismatch detected, updating with server user')
            // Clear all storage
            try {
              localStorage.clear()
              if (typeof sessionStorage !== 'undefined') {
                sessionStorage.clear()
              }
            } catch (e) {}
          }
          
          // Update storage with server user (always fresh)
          try {
            localStorage.setItem('isAuthenticated', 'true')
            localStorage.setItem('currentUserId', serverUserId)
            localStorage.setItem('currentUser', JSON.stringify(serverUser))
          } catch (e) {}
          
          try {
            if (typeof sessionStorage !== 'undefined') {
              sessionStorage.setItem('isAuthenticated', 'true')
              sessionStorage.setItem('currentUserId', serverUserId)
              sessionStorage.setItem('currentUser', JSON.stringify(serverUser))
            }
          } catch (e) {}
          
          // User is authenticated and verified
          if (mounted) {
            setIsAuthed(true)
            setIsLoading(false)
          }
          return true
        } else {
          // No user returned from server - BLOCK ACCESS
          console.log('[AuthGuard] No user from server, redirecting to homepage')
          // Clear all storage
          try {
            localStorage.clear()
            if (typeof sessionStorage !== 'undefined') {
              sessionStorage.clear()
            }
          } catch (e) {}
          
          if (mounted) {
            setIsAuthed(false)
            setIsLoading(false)
            router.replace('/')
          }
          return false
        }
      } catch (error) {
        console.error('[AuthGuard] Error verifying user from server:', error)
        // On error, redirect to homepage for security
        if (mounted) {
          setIsAuthed(false)
          setIsLoading(false)
          router.replace('/')
        }
        return false
      }
    }
    
    // Always verify from server (this ensures correct user on refresh/back/forward)
    // This is the critical security check that prevents URL bypass
    verifyUserFromServer()

    return () => {
      mounted = false
    }
  }, [router, pathname])

  // CRITICAL: Don't render anything until authentication is verified
  // This prevents any content from showing before the server check completes
  if (isLoading) {
    return null // Block rendering completely
  }

  if (!isAuthed) {
    // Not authenticated - already redirected, but return null to be safe
    return null
  }

  console.log('[AuthGuard] User authenticated, rendering children')
  return <>{children}</>
}

// AdminGuard: Ensures isAuthenticated AND currentUser.isAdmin (uses localStorage and DB)
// Removed getCurrentUser import - will get user from localStorage/sessionStorage
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthed, setIsAuthed] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check for logout flag - prevent forward navigation after logout
    try {
      if (typeof sessionStorage !== 'undefined') {
        const logoutFlag = sessionStorage.getItem('logoutFlag')
        if (logoutFlag === 'true') {
          console.log('[AdminGuard] Logout flag detected, redirecting to login')
          sessionStorage.removeItem('logoutFlag')
          router.replace('/login')
          return
        }
      }
    } catch (error) {
      console.error('[AdminGuard] Error checking logout flag:', error)
    }

    // Check for direct access (copy-paste URL) - redirect to homepage
    try {
      if (checkDirectAccess()) {
        console.log('[AdminGuard] Direct access detected, redirecting to homepage')
        router.replace('/')
        return
      }
    } catch (error) {
      console.error('[AdminGuard] Error checking direct access:', error)
      // Continue with normal auth flow if check fails
    }

    async function check() {
      // Always verify user from server (cookie-based) to prevent showing wrong account
      // This ensures that on refresh/back/forward, we always show the correct user
      try {
        // Fetch user from server (uses cookie as source of truth)
        const response = await fetch('/api/auth/me', {
          credentials: 'include', // Include cookies
          cache: 'no-store' // Always fetch fresh data
        })
        
        if (!response.ok) {
          // No valid session on server
          console.log('[AdminGuard] No valid session on server, redirecting to homepage')
          // Clear all storage
          try {
            localStorage.clear()
            if (typeof sessionStorage !== 'undefined') {
              sessionStorage.clear()
            }
          } catch (e) {}
          
          setIsAuthed(false)
          setIsLoading(false)
          router.replace('/')
          return
        }
        
        const data = await response.json()
        
        if (data.success && data.user) {
          const serverUser = data.user
          const serverUserId = String(serverUser.id)
          
          // Get stored user for comparison
          let storedUserId: string | null = null
          try {
            storedUserId = sessionStorage.getItem('currentUserId') || localStorage.getItem('currentUserId')
          } catch (e) {}
          
          // If stored user doesn't match server user, clear and update
          if (storedUserId && storedUserId !== serverUserId) {
            console.log('[AdminGuard] Stored user mismatch detected, updating with server user')
            // Clear all storage
            try {
              localStorage.clear()
              if (typeof sessionStorage !== 'undefined') {
                sessionStorage.clear()
              }
            } catch (e) {}
          }
          
          // Update storage with server user (always fresh)
          try {
            localStorage.setItem('isAuthenticated', 'true')
            localStorage.setItem('currentUserId', serverUserId)
            localStorage.setItem('currentUser', JSON.stringify(serverUser))
          } catch (e) {}
          
          try {
            if (typeof sessionStorage !== 'undefined') {
              sessionStorage.setItem('isAuthenticated', 'true')
              sessionStorage.setItem('currentUserId', serverUserId)
              sessionStorage.setItem('currentUser', JSON.stringify(serverUser))
            }
          } catch (e) {}
          
          // User is authenticated
          setIsAuthed(true)
          
          // Check if user is admin (handle both integer, boolean, and string values)
          const userIsAdmin = serverUser?.isAdmin === 1 || 
                              serverUser?.isAdmin === true || 
                              String(serverUser?.isAdmin) === '1' || 
                              String(serverUser?.isAdmin) === 'true'
          
          console.log('[AdminGuard] User isAdmin check result from server:', userIsAdmin)
          
          if (userIsAdmin) {
            setIsAdmin(true)
          } else {
            console.log('[AdminGuard] User is not admin, redirecting to homepage. isAdmin value:', serverUser?.isAdmin, 'Type:', typeof serverUser?.isAdmin)
            router.replace('/')
            setIsLoading(false)
            return
          }
        } else {
          // No user returned from server
          console.log('[AdminGuard] No user from server, redirecting to homepage')
          // Clear all storage
          try {
            localStorage.clear()
            if (typeof sessionStorage !== 'undefined') {
              sessionStorage.clear()
            }
          } catch (e) {}
          
          setIsAuthed(false)
          setIsLoading(false)
          router.replace('/')
          return
        }
      } catch (error) {
        console.error('[AdminGuard] Error verifying user from server:', error)
        // On error, redirect to homepage for security
        router.replace('/')
        setIsLoading(false)
        return
      }
      
      setIsLoading(false)
    }
    check()
  }, [router])

  // If not authenticated, redirect to login immediately (no loading state)
  if (!isAuthed) {
    return null // Component will redirect in useEffect
  }
  
  // If authenticated but not admin, redirect to login
  if (!isAdmin) {
    return null // Component will redirect in useEffect
  }
  
  // Show loading only while checking admin status
  if (isLoading) {
    return null // Don't show loading, let redirect happen
  }
  return <>{children}</>
}
