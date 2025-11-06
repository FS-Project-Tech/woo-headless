import { NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const token = getAuthToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { product_id } = body || {};
    if (!product_id || typeof product_id !== 'number') {
      return NextResponse.json({ error: 'Invalid product_id' }, { status: 400 });
    }

    // Get WordPress base URL
    const api = process.env.NEXT_PUBLIC_WC_API_URL || '';
    const u = new URL(api);
    const wpBase = `${u.protocol}//${u.host}`;

    // Get current user
    const userRes = await fetch(`${wpBase}/wp-json/wp/v2/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!userRes.ok) {
      return NextResponse.json({ error: 'Failed to get user' }, { status: 401 });
    }
    const user = await userRes.json();
    const userId = user.id;

    // Call custom WordPress endpoint
    const updateRes = await fetch(`${wpBase}/wp-json/custom/v1/wishlist/remove`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ product_id, user_id: userId }),
    });

    if (!updateRes.ok) {
      const error = await updateRes.json().catch(() => ({ error: 'Failed to update wishlist' }));
      return NextResponse.json({ error: error.error || 'Failed to update wishlist' }, { status: 500 });
    }

    const result = await updateRes.json();
    return NextResponse.json({ ok: true, wishlist: result.wishlist });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to remove from wishlist' }, { status: 500 });
  }
}

