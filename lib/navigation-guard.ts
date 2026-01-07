/**
 * Navigation guard utility to prevent direct URL access
 * Allows page refreshes but redirects direct URL copy-paste
 */

export function checkDirectAccess(): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    // Check if sessionStorage is available
    if (typeof sessionStorage === 'undefined') {
      return false // If sessionStorage not available, allow access
    }
    
    // FIRST: Check if user is authenticated
    let isAuthenticated = false
    try {
      isAuthenticated = sessionStorage.getItem('isAuthenticated') === 'true' ||
                        localStorage.getItem('isAuthenticated') === 'true' ||
                        !!sessionStorage.getItem('currentUserId') ||
                        !!localStorage.getItem('currentUserId') ||
                        !!sessionStorage.getItem('currentUser') ||
                        !!localStorage.getItem('currentUser')
    } catch (e) {
      // If we can't check auth, assume not authenticated for security
      isAuthenticated = false
    }
    
    // SECOND: Check if this is a legitimate navigation (marked in sessionStorage)
    const legitimateNav = sessionStorage.getItem('legitimateNavigation') === 'true'
    
    if (legitimateNav) {
      // Clear the flag after use
      sessionStorage.removeItem('legitimateNavigation')
      return false // Not direct access (legitimate internal navigation)
    }
    
    // THIRD: Check referrer
    const referrer = document.referrer
    const currentOrigin = window.location.origin
    
    // If referrer is from same origin, it's likely internal navigation or refresh
    if (referrer && referrer.startsWith(currentOrigin)) {
      // If authenticated, allow it (could be refresh or internal nav)
      if (isAuthenticated) {
        return false // Not direct access
      }
      // If not authenticated but has same-origin referrer, still check Performance API
    }
    
    // FOURTH: Check if this is a refresh using Performance API
    // Only allow refresh if user is authenticated
    let isRefresh = false
    try {
      if (typeof performance !== 'undefined' && performance.getEntriesByType) {
        const navEntries = performance.getEntriesByType('navigation')
        if (navEntries && navEntries.length > 0) {
          const navEntry = navEntries[0] as any
          // Only 'reload' type is a true refresh - 'navigate' could be direct access
          if (navEntry.type === 'reload') {
            isRefresh = true
          }
        }
      }
    } catch (e) {
      // Performance API not available or error - continue with other checks
      console.warn('Performance API check failed:', e)
    }
    
    // FIFTH: Determine if this is direct access
    // Direct access = NOT authenticated AND (no referrer OR referrer from different origin) AND not a refresh
    if (!isAuthenticated) {
      // User is NOT authenticated
      if (isRefresh) {
        // It's a refresh but user is not authenticated - this shouldn't happen normally
        // But to be safe, allow it (might be a session expiry during refresh)
        return false
      }
      
      // No referrer or referrer from different origin = direct access attempt
      if (!referrer || !referrer.startsWith(currentOrigin)) {
        console.log('[checkDirectAccess] Direct access detected: Not authenticated, no same-origin referrer')
        return true // Direct access detected - BLOCK IT
      }
    } else {
      // User IS authenticated
      // If it's a refresh, allow it
      if (isRefresh) {
        return false // Not direct access (authenticated user refreshing)
      }
      
      // If authenticated and has same-origin referrer, allow it
      if (referrer && referrer.startsWith(currentOrigin)) {
        return false // Not direct access (internal navigation)
      }
      
      // Authenticated but no referrer - could be bookmark or typed URL
      // Allow it since user is authenticated
      return false
    }
    
    return false
  } catch (error) {
    // If any error occurs, be strict and block access for security
    console.error('Error in checkDirectAccess:', error)
    // Return true to block access if we can't determine - better safe than sorry
    return true
  }
}

/**
 * Mark navigation as legitimate (call this when navigating via internal links)
 */
export function markLegitimateNavigation() {
  try {
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('legitimateNavigation', 'true')
    }
  } catch (error) {
    // Silently fail if sessionStorage is not available
    console.warn('Failed to mark legitimate navigation:', error)
  }
}

