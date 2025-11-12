import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken, getUserData } from '@/lib/auth';

/**
 * GET /api/dashboard/quotes
 * Fetch all quote requests for the logged-in user
 */
export async function GET(req: NextRequest) {
  try {
    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await getUserData(token);
    if (!user || !user.email) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // For now, we'll fetch quotes from localStorage or a simple storage
    // In production, you might want to store quotes in a database
    // This is a placeholder - you'll need to implement actual quote storage
    
    // Option 1: If quotes are stored in WooCommerce as draft orders or custom post type
    // Option 2: If quotes are stored in a separate database table
    // Option 3: For now, return empty array until quote storage is implemented
    
    // Placeholder response
    return NextResponse.json({
      quotes: [],
      total: 0,
    });

  } catch (error: any) {
    console.error('Quotes API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotes', quotes: [], total: 0 },
      { status: 500 }
    );
  }
}

