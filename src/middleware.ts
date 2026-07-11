import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { routing } from './i18n/navigation';

// Create the intl middleware
const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 1. Check if it's a public asset or api route
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') || 
    pathname.startsWith('/static') || 
    pathname.includes('.') // file extension
  ) {
    return NextResponse.next()
  }

  // 2. Check Setup Status (Only if not already on setup page)
  // Note: We can't easily call the API here to check setup status on every request without performance hit.
  // Ideally, we check a cookie 'is_setup_done'. 
  // If not present, we might want to check API.
  // For now, let's assume the setup check happens in the UI or we rely on 'accessToken' to determine auth.
  
  // 3. Check Authentication for Dashboard
  const token = request.cookies.get('accessToken')?.value
  const isAuthPage = pathname.includes('/auth/login') || pathname.includes('/setup')
  const isRootPage = pathname === '/' || pathname === '/en' || pathname === '/bn'
  
  // If no token and trying to access any protected route - redirect to login
  if (!token && !isAuthPage && !pathname.includes('/public')) {
      const locale = request.cookies.get('NEXT_LOCALE')?.value || 'en';
      return NextResponse.redirect(new URL(`/${locale}/auth/login`, request.url))
  }

  // If token exists and trying to access login page or the landing page, redirect to dashboard
  if (token && (pathname.includes('/auth/login') || isRootPage)) {
      const locale = request.cookies.get('NEXT_LOCALE')?.value || 'en';
      return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url))
  }

  // Run intl middleware for locale handling
  return intlMiddleware(request)
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
}
