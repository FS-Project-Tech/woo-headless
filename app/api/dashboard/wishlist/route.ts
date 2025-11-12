import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken, getWpBaseUrl } from '@/lib/auth';

/**
 * GET /api/dashboard/wishlist
 * Fetch wishlist for the authenticated user
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

    const wpBase = getWpBaseUrl();
    if (!wpBase) {
      return NextResponse.json(
        { error: 'WordPress URL not configured' },
        { status: 500 }
      );
    }

    // First, verify the token is valid by checking user
    const userResponse = await fetch(`${wpBase}/wp-json/wp/v2/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!userResponse.ok) {
      return NextResponse.json({ wishlist: [] });
    }

    // Fetch wishlist from custom endpoint
    const response = await fetch(`${wpBase}/wp-json/custom/v1/wishlist`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      // If endpoint doesn't exist or user not authenticated, return empty wishlist
      if (response.status === 404 || response.status === 401) {
        console.warn('Wishlist endpoint not available or unauthorized');
        return NextResponse.json({ wishlist: [] });
      }
      const errorText = await response.text();
      console.error('Failed to fetch wishlist:', response.status, errorText);
      return NextResponse.json({ wishlist: [] });
    }

    const data = await response.json();
    return NextResponse.json({ wishlist: data.wishlist || [] });
  } catch (error: any) {
    console.error('Wishlist API error:', error);
    return NextResponse.json({ wishlist: [] });
  }
}

/**
 * POST /api/dashboard/wishlist
 * Add or remove product from wishlist
 * Supports action parameter: 'add' (default) or 'remove'
 */
export async function POST(req: NextRequest) {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { product_id, action } = body;

    if (!product_id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const wpBase = getWpBaseUrl();
    if (!wpBase) {
      return NextResponse.json(
        { error: 'WordPress URL not configured' },
        { status: 500 }
      );
    }

    // Verify token is valid before making wishlist request
    const userResponse = await fetch(`${wpBase}/wp-json/wp/v2/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!userResponse.ok) {
      console.error('Token validation failed:', userResponse.status);
      return NextResponse.json(
        { error: 'Authentication failed. Please login again.' },
        { status: 401 }
      );
    }

    // Determine if this is an add or remove action
    const isRemove = action === 'remove';
    const endpoint = isRemove 
      ? `${wpBase}/wp-json/custom/v1/wishlist/remove`
      : `${wpBase}/wp-json/custom/v1/wishlist/add`;

    console.log('Making wishlist request:', { endpoint, product_id, action, isRemove });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ product_id }),
      cache: 'no-store',
    });

    if (!response.ok) {
      let errorMessage = `Failed to ${isRemove ? 'remove from' : 'add to'} wishlist`;
      try {
        const error = await response.json();
        errorMessage = error.message || error.error || errorMessage;
        console.error('WordPress wishlist API error:', {
          status: response.status,
          statusText: response.statusText,
          error: error,
          endpoint: endpoint,
        });
      } catch (e) {
        const errorText = await response.text();
        console.error('WordPress wishlist API error (non-JSON):', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText,
          endpoint: endpoint,
        });
        errorMessage = errorText || errorMessage;
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ 
      wishlist: data.wishlist || [],
      message: `Product ${isRemove ? 'removed from' : 'added to'} wishlist` 
    });
  } catch (error: any) {
    console.error('Wishlist operation error:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating wishlist' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/dashboard/wishlist
 * Remove product from wishlist
 * Note: Using POST with action=remove to avoid DELETE body parsing issues
 */
export async function DELETE(req: NextRequest) {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Try to get product_id from body, fallback to query params
    let product_id: number | undefined;
    try {
      const body = await req.json().catch(() => ({}));
      product_id = body.product_id;
    } catch {
      // If body parsing fails, try query params
      const searchParams = req.nextUrl.searchParams;
      product_id = searchParams.get('product_id') ? parseInt(searchParams.get('product_id')!) : undefined;
    }

    if (!product_id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const wpBase = getWpBaseUrl();
    if (!wpBase) {
      return NextResponse.json(
        { error: 'WordPress URL not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(`${wpBase}/wp-json/custom/v1/wishlist/remove`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ product_id }),
      cache: 'no-store',
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.message || 'Failed to remove from wishlist' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ 
      wishlist: data.wishlist || [],
      message: 'Product removed from wishlist' 
    });
  } catch (error: any) {
    console.error('Remove from wishlist error:', error);
    return NextResponse.json(
      { error: 'An error occurred while removing from wishlist' },
      { status: 500 }
    );
  }
}

