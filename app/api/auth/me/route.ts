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

    // Validate token
    const isValid = await validateToken(token);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get user data
    const user = await getUserData(token);
    if (!user) {
      // If user data can't be fetched, token might be invalid or expired
      return NextResponse.json(
        { error: 'Unable to fetch user data. Please login again.' },
        { status: 401 }
      );
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('Get user error:', error);
    // Return 401 instead of 500 for authentication errors
    return NextResponse.json(
      { error: 'Authentication failed. Please login again.' },
      { status: 401 }
    );
  }
}

