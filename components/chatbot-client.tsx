"use client"

import React, { useEffect, useState } from "react"
import { isAuthenticated } from "@/lib/auth"

/**
 * Client-only wrapper for Chatbot component
 * This ensures the chatbot is NEVER rendered on the server side
 * Uses dynamic import inside to prevent any server bundle inclusion
 * Only shows chatbot when user is NOT logged in
 */
export function ChatbotClient() {
  const [mounted, setMounted] = useState(false)
  const [ChatbotComponent, setChatbotComponent] = useState<React.ComponentType | null>(null)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    // Strict check - only run in browser environment
    if (typeof window === "undefined") {
      return
    }

    // Check authentication status
    const checkAuth = () => {
      setAuthenticated(isAuthenticated())
    }

    // Initial check
    checkAuth()

    // Listen for storage changes (when user logs in/out from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "isAuthenticated") {
        checkAuth()
      }
    }

    // Listen for custom auth events (when user logs in/out in same tab)
    const handleAuthChange = () => {
      checkAuth()
    }

    // Poll for auth changes periodically (fallback)
    const authInterval = setInterval(checkAuth, 2000)

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("auth-changed", handleAuthChange)

    // Dynamically import chatbot only after client-side mount
    import("@/components/chatbot").then((mod) => {
      setChatbotComponent(() => mod.Chatbot)
      setMounted(true)
    })

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("auth-changed", handleAuthChange)
      clearInterval(authInterval)
    }
  }, [])

  // Don't render anything on server or before mount - return null
  if (!mounted || typeof window === "undefined" || !ChatbotComponent) {
    return null
  }

  // Don't render chatbot if user is authenticated
  if (authenticated) {
    return null
  }

  return <ChatbotComponent />
}

