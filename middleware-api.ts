/**
 * API Route Middleware
 * Applies JWT authentication to all /api/* routes (except public ones)
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = 'session';

/**
 * Public API routes that don't require authentication
 */
const PUBLIC_API_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/api/products',
  '/api/category-by-slug',
  '/api/categories',
  '/api/search',
  '/api/search-unified',
  '/api/filters',
  '/api/shipping',
  '/api/payment-methods',
  '/api/coupons/validate',
  '/api/coupons/available',
  '/api/inventory/check',
  '/api/newsletter/subscribe',
  '/api/store-settings',
];

/**
 * Check if route is public
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Validate JWT token with WordPress
 */
async function validateToken(token: string): Promise<boolean> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_WC_API_URL || '';
    if (!apiUrl) return false;
    
    const url = new URL(apiUrl);
    const wpBase = `${url.protocol}//${url.host}`;
    
    const response = await fetch(`${wpBase}/wp-json/jwt-auth/v1/token/validate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });
    
    return response.ok;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
}

/**
 * API Route Middleware
 * Applies JWT authentication to protected API routes
 */
export async function apiMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;

  // Skip if not an API route
  if (!pathname.startsWith('/api/')) {
    return null;
  }

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return null;
  }

  // Protected routes require authentication
  // Get token from cookies (middleware context)
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json(
      {
        error: 'Authentication required',
        message: 'Please login to access this resource',
      },
      { status: 401 }
    );
  }

  // Validate token
  const isValid = await validateToken(token);
  if (!isValid) {
    return NextResponse.json(
      {
        error: 'Invalid token',
        message: 'Your session has expired. Please login again.',
      },
      { status: 401 }
    );
  }

  // Token is valid, allow request
  return null;
}

