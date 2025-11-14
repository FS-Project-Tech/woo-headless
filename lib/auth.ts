/**
 * Authentication Utilities
 * Handles JWT token storage, validation, and cookie management
 */

import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/**
 * Get WordPress base URL from environment
 */
export function getWpBaseUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_WC_API_URL || '';
  try {
    const url = new URL(apiUrl);
    return `${url.protocol}//${url.host}`;
  } catch {
    return '';
  }
}

/**
 * Get JWT token from cookie
 */
export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value || null;
}

/**
 * Set JWT token in HttpOnly cookie
 */
export async function setAuthToken(token: string): Promise<void> {
  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === 'production';
  
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
}

/**
 * Clear auth token cookie
 */
export async function clearAuthToken(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Validate JWT token with WordPress
 */
export async function validateToken(token: string): Promise<boolean> {
  try {
    const wpBase = getWpBaseUrl();
    if (!wpBase) return false;

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
 * Get user data from WordPress using JWT token
 */
export async function getUserData(token: string): Promise<any | null> {
  try {
    const wpBase = getWpBaseUrl();
    if (!wpBase) {
      console.error('WordPress base URL not configured');
      return null;
    }

    const response = await fetch(`${wpBase}/wp-json/wp/v2/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('Failed to fetch user data:', response.status, response.statusText);
      return null;
    }

    const user = await response.json();
    
    // Ensure we have required fields
    if (!user || !user.id) {
      console.error('Invalid user data received:', user);
      return null;
    }

    return {
      id: user.id,
      email: user.email || user.user_email,
      name: user.name || user.display_name,
      username: user.slug || user.user_login || user.nicename,
      roles: user.roles || [],
    };
  } catch (error) {
    console.error('Get user data error:', error);
    return null;
  }
}

