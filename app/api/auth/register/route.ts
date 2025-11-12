import { NextRequest, NextResponse } from 'next/server';
import { setAuthToken, getWpBaseUrl } from '@/lib/auth';

// In-memory storage for refresh tokens
const refreshTokens = new Map<string, { token: string; expiresAt: number }>();

/**
 * POST /api/auth/register
 * Register new user via WooCommerce REST API
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, username, password, firstName, lastName } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Password strength check
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
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

    // Step 1: Create WordPress user via WooCommerce API
    const consumerKey = process.env.NEXT_PUBLIC_WC_CONSUMER_KEY || '';
    const consumerSecret = process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET || '';
    
    // Build URL with query parameters for WooCommerce API authentication
    const wcUrl = new URL(`${wpBase}/wp-json/wc/v3/customers`);
    wcUrl.searchParams.set('consumer_key', consumerKey);
    wcUrl.searchParams.set('consumer_secret', consumerSecret);
    
    const wcResponse = await fetch(wcUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(
          `${consumerKey}:${consumerSecret}`
        ).toString('base64')}`,
      },
      body: JSON.stringify({
        email,
        username: username || email,
        password,
        first_name: firstName || '',
        last_name: lastName || '',
      }),
      cache: 'no-store',
    });

    const wcData = await wcResponse.json();

    if (!wcResponse.ok) {
      return NextResponse.json(
        { error: wcData.message || 'Registration failed' },
        { status: wcResponse.status }
      );
    }

    // Step 2: Auto-login after registration using JWT
    const jwtResponse = await fetch(`${wpBase}/wp-json/jwt-auth/v1/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username || email,
        password,
      }),
      cache: 'no-store',
    });

    const jwtData = await jwtResponse.json();

    if (!jwtResponse.ok) {
      // User created but login failed - user should login manually
      return NextResponse.json({
        user: {
          id: wcData.id,
          email: wcData.email,
          name: `${wcData.first_name} ${wcData.last_name}`.trim() || wcData.email,
          username: wcData.username,
        },
        message: 'Registration successful. Please login.',
      });
    }

    // Generate refresh token
    const refreshToken = crypto.randomUUID();
    const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
    refreshTokens.set(refreshToken, { token: jwtData.token, expiresAt });

    // Store JWT token in HttpOnly cookie
    await setAuthToken(jwtData.token);

    return NextResponse.json({
      user: {
        id: jwtData.user.id,
        email: jwtData.user.email,
        name: jwtData.user.name,
        username: jwtData.user.nicename,
        roles: jwtData.user.roles || ['customer'],
      },
      customer: wcData,
      refreshToken,
      message: 'Registration successful',
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}

