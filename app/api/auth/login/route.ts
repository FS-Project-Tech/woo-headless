import { NextRequest, NextResponse } from 'next/server';
import { setAuthToken, getWpBaseUrl } from '@/lib/auth';

// In-memory storage for refresh tokens (in production, use Redis or database)
const refreshTokens = new Map<string, { token: string; expiresAt: number }>();

/**
 * POST /api/auth/login
 * Authenticate user with WooCommerce REST API + JWT
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
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

    // Step 1: Authenticate with WordPress JWT endpoint
    const jwtResponse = await fetch(`${wpBase}/wp-json/jwt-auth/v1/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
      }),
      cache: 'no-store',
    });

    const jwtData = await jwtResponse.json();

    if (!jwtResponse.ok) {
      return NextResponse.json(
        { error: jwtData.message || jwtData.error || 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if token exists
    if (!jwtData.token) {
      return NextResponse.json(
        { error: 'Authentication failed: No token received' },
        { status: 401 }
      );
    }

    // Extract user data - JWT plugin may return user data in different formats
    const userData = jwtData.user || jwtData.data || jwtData;
    const userEmail = userData?.email || jwtData.email;
    const userId = userData?.id || jwtData.id;

    if (!userEmail) {
      // If no email in JWT response, fetch user data using the token
      try {
        const userResponse = await fetch(`${wpBase}/wp-json/wp/v2/users/me`, {
          headers: {
            'Authorization': `Bearer ${jwtData.token}`,
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        });

        if (userResponse.ok) {
          const wpUser = await userResponse.json();
          userData.email = wpUser.email;
          userData.id = wpUser.id;
          userData.name = wpUser.name;
          userData.nicename = wpUser.slug;
          userData.roles = wpUser.roles || [];
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    }

    // Step 2: Get WooCommerce customer data
    let customerData = null;
    if (userData?.email || userEmail) {
      try {
        const email = userData?.email || userEmail;
        const wcResponse = await fetch(`${wpBase}/wp-json/wc/v3/customers?email=${encodeURIComponent(email)}`, {
          headers: {
            'Authorization': `Bearer ${jwtData.token}`,
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        });

        if (wcResponse.ok) {
          const customers = await wcResponse.json();
          if (customers && customers.length > 0) {
            customerData = customers[0];
          }
        }
      } catch (error) {
        console.error('Error fetching WooCommerce customer:', error);
        // Continue without customer data
      }
    }

    // Generate refresh token
    const refreshToken = crypto.randomUUID();
    const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
    refreshTokens.set(refreshToken, { token: jwtData.token, expiresAt });

    // Store JWT token in HttpOnly cookie
    await setAuthToken(jwtData.token);

    // Return user data (never expose JWT token to client)
    return NextResponse.json({
      user: {
        id: userData?.id || userId || 0,
        email: userData?.email || userEmail || '',
        name: userData?.name || userData?.display_name || userData?.nicename || '',
        username: userData?.nicename || userData?.username || userData?.slug || '',
        roles: userData?.roles || [],
      },
      customer: customerData,
      refreshToken, // Return refresh token (stored in memory on client)
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/refresh
 * Refresh JWT token using refresh token
 */
export async function GET(req: NextRequest) {
  try {
    const refreshToken = req.headers.get('x-refresh-token');
    
    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token required' },
        { status: 401 }
      );
    }

    const stored = refreshTokens.get(refreshToken);
    
    if (!stored || stored.expiresAt < Date.now()) {
      refreshTokens.delete(refreshToken);
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    // Validate current token
    const wpBase = getWpBaseUrl();
    if (!wpBase) {
      return NextResponse.json(
        { error: 'WordPress URL not configured' },
        { status: 500 }
      );
    }

    const validateRes = await fetch(`${wpBase}/wp-json/jwt-auth/v1/token/validate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stored.token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (validateRes.ok) {
      // Token still valid, return it
      await setAuthToken(stored.token);
      return NextResponse.json({ success: true });
    }

    // Token expired, need to re-authenticate
    refreshTokens.delete(refreshToken);
    return NextResponse.json(
      { error: 'Token expired. Please login again.' },
      { status: 401 }
    );
  } catch (error: any) {
    console.error('Refresh token error:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}

