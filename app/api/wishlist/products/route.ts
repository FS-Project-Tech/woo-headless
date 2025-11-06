import { NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/auth';
import wcAPI from '@/lib/woocommerce';

export async function GET(req: Request) {
  try {
    const token = getAuthToken();
    if (!token) {
      return NextResponse.json({ products: [] });
    }

    const { searchParams } = new URL(req.url);
    const productIds = searchParams.get('ids');
    
    if (!productIds) {
      return NextResponse.json({ products: [] });
    }

    // Parse comma-separated IDs
    const ids = productIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id) && id > 0);
    
    if (ids.length === 0) {
      return NextResponse.json({ products: [] });
    }

    // Fetch products by IDs using WooCommerce API (include parameter)
    const response = await wcAPI.get('/products', {
      params: {
        include: ids.join(','),
        per_page: ids.length
      }
    });

    return NextResponse.json({ products: response.data || [] });
  } catch (e: any) {
    console.error('Error fetching wishlist products:', e);
    return NextResponse.json({ products: [] });
  }
}

