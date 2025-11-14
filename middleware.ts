import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { apiMiddleware } from './middleware-api';

/**
 * Middleware for protected routes and auto-redirects
 * - Protects /dashboard routes
 * - Protects /api/* routes with JWT authentication
 * - Auto-redirects: /login → if authenticated, /dashboard → if not authenticated
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Apply API middleware for /api/* routes
  if (pathname.startsWith('/api/')) {
    const apiResponse = await apiMiddleware(request);
    if (apiResponse) {
      return apiResponse; // Auth failed, return error
    }
  }
  
  const response = NextResponse.next();
  
  // Add caching headers for static assets and API routes
  if (pathname.startsWith('/_next/static') || pathname.startsWith('/_next/image')) {
    // Static assets - cache for 1 year
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    response.headers.set('X-Content-Type-Options', 'nosniff');
  } else if (pathname.startsWith('/api/products') || pathname.startsWith('/api/category-by-slug')) {
    // API routes - cache for 5 minutes with stale-while-revalidate
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    response.headers.set('Content-Type', 'application/json; charset=utf-8');
  } else if (pathname.startsWith('/api/')) {
    // Other API routes - shorter cache
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    response.headers.set('Content-Type', 'application/json; charset=utf-8');
  } else if (pathname.match(/\.(jpg|jpeg|png|gif|ico|svg|webp|avif)$/)) {
    // Images - cache for 1 year
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    response.headers.set('X-Content-Type-Options', 'nosniff');
  } else if (pathname.match(/\.(js|css|woff|woff2|ttf|eot)$/)) {
    // JS/CSS/Fonts - cache for 1 year
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    response.headers.set('X-Content-Type-Options', 'nosniff');
  } else if (pathname.startsWith('/products/') || pathname.startsWith('/product-category/')) {
    // Product and category pages - ISR with revalidation
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
  }
  
  // Security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Compression headers (Next.js handles compression automatically with compress: true)
  // But we can hint to browsers about available compression
  const acceptEncoding = request.headers.get('accept-encoding') || '';
  if (acceptEncoding.includes('br')) {
    response.headers.set('Vary', 'Accept-Encoding');
  }
  
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
    return response;
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
    return response;
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
    return response;
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
    '/api/:path*',
    '/products/:path*',
    '/product-category/:path*',
    '/_next/static/:path*',
    '/_next/image/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

