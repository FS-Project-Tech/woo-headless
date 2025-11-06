import { NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const token = getAuthToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { product_ids } = body || [];
    
    if (!Array.isArray(product_ids)) {
      return NextResponse.json({ error: 'Invalid product_ids' }, { status: 400 });
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
    // Get existing wishlist from server
    const serverWishlistRes = await fetch(`${wpBase}/wp-json/custom/v1/wishlist`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    let serverWishlist: number[] = [];
    if (serverWishlistRes.ok) {
      const serverData = await serverWishlistRes.json();
      serverWishlist = serverData.wishlist || [];
    }

    // Merge cookie wishlist with server wishlist (deduplicate)
    const cookieIds = product_ids.filter((id: number) => typeof id === 'number' && id > 0);
    const mergedWishlist = Array.from(new Set([...serverWishlist, ...cookieIds]));

    // Update server wishlist with merged list
    // We'll add each cookie item that's not already on server
    const itemsToAdd = cookieIds.filter((id: number) => !serverWishlist.includes(id));
    
    // Add all new items to server wishlist
    for (const productId of itemsToAdd) {
      try {
        await fetch(`${wpBase}/wp-json/custom/v1/wishlist/add`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ product_id: productId }),
        });
      } catch (error) {
        console.error(`Failed to add product ${productId} to wishlist:`, error);
      }
    }

    // Get final wishlist
    const finalRes = await fetch(`${wpBase}/wp-json/custom/v1/wishlist`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    let finalWishlist: number[] = mergedWishlist;
    if (finalRes.ok) {
      const finalData = await finalRes.json();
      finalWishlist = finalData.wishlist || [];
    }

    return NextResponse.json({ ok: true, wishlist: finalWishlist });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to sync wishlist' }, { status: 500 });
  }
}

