import { NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const token = getAuthToken();
    if (!token) {
      return NextResponse.json({ inWishlist: false });
    }

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('product_id');
    if (!productId) {
      return NextResponse.json({ inWishlist: false });
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
      return NextResponse.json({ inWishlist: false });
    }
    const user = await userRes.json();
    const userId = user.id;

    // Get wishlist and check if product is in it
    const wishlistRes = await fetch(`${wpBase}/wp-json/custom/v1/wishlist?user_id=${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!wishlistRes.ok) {
      return NextResponse.json({ inWishlist: false });
    }

    const result = await wishlistRes.json();
    const wishlist = result.wishlist || [];
    const inWishlist = wishlist.includes(Number(productId));

    return NextResponse.json({ inWishlist });
  } catch (e: any) {
    return NextResponse.json({ inWishlist: false });
  }
}

