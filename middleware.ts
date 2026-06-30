import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Extract the __session cookie
  const session = request.cookies.get('__session')

  // Paths that require authentication
  const protectedPaths = [
    '/admin',
    '/checkout',
    '/profile',
    '/orders'
  ]

  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )

  if (isProtectedPath && !session) {
    // Basic route protection: if no session cookie is present, redirect to login.
    // The actual secure verification of the session (and admin roles) 
    // occurs in the API routes using firebase-admin.
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  // Apply middleware to all routes except static assets and API routes
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
