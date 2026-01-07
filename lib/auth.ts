// Simple authentication utilities for demo purposes
export interface User {
  id?: number | string
  email?: string
  name?: string
  fullName?: string
  username?: string
  isAdmin?: number | boolean | string
  [key: string]: any // Allow additional properties
}

// Department list based on actual database values
export const DEPARTMENTS = [
  'Keselamatan dan Kesihatan',
  'Kewangan',
  'Operasi',
  'Pentadbiran',
  'Teknikal dan Penyelenggaraan',
  'Unit Teknologi Maklumat'
] as const

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem("isAuthenticated") === "true"
}

export async function getCurrentUser(): Promise<User | null> {
  if (typeof window === "undefined") return null
  
  // First try to get the full user object from localStorage
  try {
    const currentUserStr = localStorage.getItem("currentUser")
    if (currentUserStr) {
      const user = JSON.parse(currentUserStr)
      return user
    }
  } catch (e) {
    console.warn("Failed to parse currentUser from localStorage:", e)
  }
  
  // Fallback: try sessionStorage
  try {
    if (typeof sessionStorage !== "undefined") {
      const currentUserStr = sessionStorage.getItem("currentUser")
      if (currentUserStr) {
        const user = JSON.parse(currentUserStr)
        return user
      }
    }
  } catch (e) {
    console.warn("Failed to parse currentUser from sessionStorage:", e)
  }
  
  // Legacy fallback: try to get email from userEmail
  const email = localStorage.getItem("userEmail")
  if (email) {
    return {
      email,
      name: email.split("@")[0],
    }
  }
  
  return null
}

export function logout(): void {
  if (typeof window === "undefined") return
  // Clear all storage for comprehensive cleanup
  try {
    localStorage.clear()
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear()
    }
  } catch (error) {
    console.error('Error clearing storage during logout:', error)
  }
}
