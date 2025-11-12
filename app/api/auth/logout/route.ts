import { NextRequest, NextResponse } from 'next/server';
import { clearAuthToken, getAuthToken } from '@/lib/auth';

/**
 * POST /api/auth/logout
 * Logout user and clear session
 */
export async function POST(req: NextRequest) {
  try {
    // Get refresh token from header if provided
    const refreshToken = req.headers.get('x-refresh-token');
    
    // Clear HttpOnly cookie
    await clearAuthToken();

    // Clear refresh token from memory (if using in-memory storage)
    // In production, you'd clear from Redis/database
    if (refreshToken) {
      // Note: In a real implementation, you'd have access to the refreshTokens map
      // For now, we'll just clear the cookie
    }

    return NextResponse.json({ 
      message: 'Logged out successfully' 
    });
  } catch (error: any) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'An error occurred during logout' },
      { status: 500 }
    );
  }
}
