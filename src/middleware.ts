import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if expired
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Define protected routes
  const protectedRoutes = [
    '/dashboard',
    '/polls/create',
    '/auth/profile',
    '/analytics'
  ]

  // Define auth routes (redirect if already logged in)
  const authRoutes = [
    '/auth/login',
    '/auth/register'
  ]

  const { pathname } = req.nextUrl

  // Check if user is trying to access protected routes
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )

  // Check if user is trying to access auth routes
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  )

  // Redirect to login if accessing protected route without session
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/auth/login', req.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect to dashboard if accessing auth routes with session
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Handle poll sharing tokens
  if (pathname.startsWith('/polls/') && req.nextUrl.searchParams.has('token')) {
    const token = req.nextUrl.searchParams.get('token')
    
    // Validate token format (should be 32 character hex)
    if (token && /^[a-f0-9]{32}$/.test(token)) {
      // Token is valid, allow access
      return res
    }
  }

  // Add user info to headers for server components
  if (session?.user) {
    res.headers.set('x-user-id', session.user.id)
    res.headers.set('x-user-email', session.user.email || '')
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes that don't require auth
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api/webhooks).*)',
  ],
}
