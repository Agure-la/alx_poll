import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware function to handle authentication and authorization.
 * This function is executed for every request that matches the `matcher` config.
 * It checks for a valid session and redirects users based on their authentication status.
 * @param req The incoming request object.
 * @returns A response object, which can be a redirect or the original response.
 */
export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Refresh the user's session if it has expired.
  // This is important to ensure the user remains logged in.
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // These are routes that require the user to be authenticated.
  // If a user is not logged in, they will be redirected to the login page.
  const protectedRoutes = [
    '/dashboard',
    '/polls/create',
    '/auth/profile',
    '/analytics'
  ]

  // These are routes that are only accessible to unauthenticated users.
  // If a user is already logged in, they will be redirected to the dashboard.
  const authRoutes = [
    '/auth/login',
    '/auth/register'
  ]

  const { pathname } = req.nextUrl

  // Check if the user is trying to access a protected route.
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )

  // Check if the user is trying to access an authentication route.
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  )

  // If the user is trying to access a protected route without a valid session,
  // redirect them to the login page. The `redirectTo` query parameter
  // is used to redirect the user back to the page they were trying to access.
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/auth/login', req.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If the user is already logged in and tries to access an authentication route,
  // redirect them to the dashboard.
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // This handles poll sharing tokens. If a request to a poll page includes a valid token,
  // the user is allowed to access the poll, even if they are not logged in.
  if (pathname.startsWith('/polls/') && req.nextUrl.searchParams.has('token')) {
    const token = req.nextUrl.searchParams.get('token')
    
    // The token should be a 32-character hexadecimal string.
    // This is a basic validation to ensure the token format is correct.
    if (token && /^[a-f0-9]{32}$/.test(token)) {
      // If the token is valid, we allow the request to proceed.
      return res
    }
  }

  // For server components, we add the user's information to the request headers.
  // This allows server components to access the user's session information.
  if (session?.user) {
    res.headers.set('x-user-id', session.user.id)
    res.headers.set('x-user-email', session.user.email || '')
  }

  return res
}

export const config = {
  matcher: [
    /*
     * This matcher ensures that the middleware is executed for all request paths
     * except for static files, images, and other assets.
     * This is important for performance, as it avoids running the middleware
     * for requests that don't require authentication.
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api/webhooks).*)',
  ],
}