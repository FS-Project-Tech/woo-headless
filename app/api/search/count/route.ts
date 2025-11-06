import { NextResponse } from "next/server";
import wcAPI from "@/lib/woocommerce";

// Cache product count (changes infrequently)
let cachedCount: { count: number; timestamp: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function GET() {
  try {
    const now = Date.now();
    
    // Return cached count if fresh
    if (cachedCount && (now - cachedCount.timestamp) < CACHE_TTL) {
      return NextResponse.json({ count: cachedCount.count });
    }
    
    // Fetch total product count
    const response = await wcAPI.get('/products', {
      params: {
        per_page: 1,
        status: 'publish',
      },
    });
    
    // Get total from headers or estimate
    const total = parseInt(response.headers['x-wp-total'] as string || '0', 10) || 
                  parseInt(response.headers['x-wp-totalpages'] as string || '0', 10) * 100;
    
    // If header not available, try to estimate from first page
    let count = total;
    if (count === 0) {
      // Fallback: estimate from first page
      const firstPage = await wcAPI.get('/products', {
        params: { per_page: 100, status: 'publish' },
      });
      count = (firstPage.data || []).length;
      // Rough estimate (not accurate but better than nothing)
      if (count === 100) count = 500; // Estimate if page is full
    }
    
    cachedCount = { count, timestamp: now };
    
    return NextResponse.json({ count }, {
      headers: {
        'Cache-Control': 'public, max-age=3600', // 1 hour
      },
    });
  } catch (error) {
    console.error('Error fetching product count:', error);
    // Return a default estimate
    return NextResponse.json({ count: 0 });
  }
}

