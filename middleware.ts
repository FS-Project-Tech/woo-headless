import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for protected routes and auto-redirects
 * - Protects /dashboard routes
 * - Auto-redirects: /login → if authenticated, /dashboard → if not authenticated
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get JWT token from cookie
  const token = request.cookies.get('session')?.value;
  
  // Auto-redirect logic
  if (pathname === '/login' || pathname === '/register' || pathname === '/forgot') {
    // If user is authenticated, redirect to dashboard
    if (token) {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_WC_API_URL || '';
        const wpBase = new URL(apiUrl).origin;
        
        const validateRes = await fetch(`${wpBase}/wp-json/jwt-auth/v1/token/validate`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        });
        
        if (validateRes.ok) {
          // User is authenticated, redirect to dashboard
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      } catch (error) {
        // Validation failed, allow access to login/register pages
      }
    }
    // Not authenticated, allow access to login/register pages
    return NextResponse.next();
  }
  
  // Protected routes that require authentication
  const protectedRoutes = [
    '/dashboard',
    '/account',
    '/checkout',
    '/orders',
  ];
  
  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  if (!isProtectedRoute) {
    return NextResponse.next();
  }
  
  // No token, redirect to login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Validate token with WordPress
  try {
    const apiUrl = process.env.NEXT_PUBLIC_WC_API_URL || '';
    const wpBase = new URL(apiUrl).origin;
    
    const validateRes = await fetch(`${wpBase}/wp-json/jwt-auth/v1/token/validate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });
    
    if (!validateRes.ok) {
      // Token invalid, redirect to login and clear session
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('session');
      return response;
    }
    
    // Token is valid, allow request
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware auth error:', error);
    // On error, redirect to login for security
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/account/:path*',
    '/checkout/:path*',
    '/orders/:path*',
    '/login',
    '/register',
    '/forgot',
  ],
};

