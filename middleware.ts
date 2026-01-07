import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Protect dashboard and admin routes
  // Note: Edge Runtime doesn't support Node.js modules like fs, so we can't access the database here
  // We'll check for cookie existence and let AuthGuard handle actual verification
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
    try {
      // Get userId from cookie (server-side)
      const cookieStore = await cookies()
      const userId = cookieStore.get('userId')?.value
      
      // If no userId cookie, redirect to homepage
      // This prevents unauthorized URL access attempts
      if (!userId) {
        console.log('[Middleware] No userId cookie found, redirecting to homepage')
        return NextResponse.redirect(new URL('/', request.url))
      }
      
      // Cookie exists - allow through to let AuthGuard verify the user in database
      // AuthGuard will handle the actual database verification since it runs client-side
      return NextResponse.next()
    } catch (error) {
      console.error('[Middleware] Error checking authentication:', error)
      // On error, redirect to homepage for security
      return NextResponse.redirect(new URL('/', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
}
