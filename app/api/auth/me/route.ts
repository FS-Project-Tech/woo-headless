import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken, getUserData, validateToken } from '@/lib/auth';

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    const token = await getAuthToken();

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Validate token (with timeout handling)
    let isValid = false;
    try {
      isValid = await validateToken(token);
    } catch (error: any) {
      // Timeout or connection errors - treat as invalid
      const isTimeoutError = 
        error?.name === 'AbortError' ||
        error?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
        error?.message?.includes('timeout') ||
        error?.message?.includes('aborted');
      
      if (!isTimeoutError) {
        console.error('Token validation error:', error);
      }
      isValid = false;
    }

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get user data (with timeout handling)
    let user = null;
    try {
      user = await getUserData(token);
    } catch (error: any) {
      // Timeout or connection errors - treat as unable to fetch
      const isTimeoutError = 
        error?.name === 'AbortError' ||
        error?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
        error?.message?.includes('timeout') ||
        error?.message?.includes('aborted');
      
      if (!isTimeoutError) {
        console.error('Get user data error:', error);
      }
      user = null;
    }

    if (!user) {
      // If user data can't be fetched, token might be invalid or expired
      return NextResponse.json(
        { error: 'Unable to fetch user data. Please login again.' },
        { status: 401 }
      );
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    // Catch any unexpected errors and return 401 instead of 500
    const isTimeoutError = 
      error?.name === 'AbortError' ||
      error?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
      error?.message?.includes('timeout') ||
      error?.message?.includes('aborted');
    
    if (!isTimeoutError) {
      console.error('Get user error:', error);
    }
    
    // Always return 401 instead of 500 for authentication errors
    return NextResponse.json(
      { error: 'Authentication failed. Please login again.' },
      { status: 401 }
    );
  }
}

