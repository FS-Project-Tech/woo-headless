import { NextResponse } from 'next/server';

// Simple in-memory cache (per server instance)
const cache = new Map<string, { at: number; data: any }>();
const TTL_MS = 60_000; // 60 seconds

function getWpBase(): string | null {
  const api = process.env.NEXT_PUBLIC_WC_API_URL || '';
  try {
    const u = new URL(api);
    return `${u.protocol}//${u.host}`;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim();
  if (!q) return NextResponse.json({ products: [], categories: [], brands: [] });

  const base = getWpBase();
  if (!base) return NextResponse.json({ products: [], categories: [], brands: [] });

  const key = `unified:${q.toLowerCase()}`;
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && now - hit.at < TTL_MS) {
    return NextResponse.json(hit.data, { headers: { 'Cache-Control': 'no-store' } });
  }

  const limit = 30; // Increased to get more results
  try {
    // Always use search parameter - WooCommerce search is pretty good
    const searchParam = `&search=${encodeURIComponent(q)}`;
    
    const [prodRes, catRes, brandRes1, brandRes2] = await Promise.all([
      fetch(`${base}/wp-json/wc/v3/products?per_page=${limit}${searchParam}&_fields=id,name,slug,price,regular_price,on_sale,sku,images,categories,average_rating,rating_count`, { headers: wcAuthHeaders(), cache: 'no-store' }),
      fetch(`${base}/wp-json/wp/v2/product_cat?per_page=${limit}${searchParam}&_fields=id,name,slug,parent`, { cache: 'no-store' }),
      // WooCommerce Brands taxonomy
      fetch(`${base}/wp-json/wp/v2/product_brand?per_page=${limit}${searchParam}&_fields=id,name,slug`, { cache: 'no-store' }).catch(() => ({ ok: false, json: async () => [] } as any)),
      // Fallback taxonomy name some sites use
      fetch(`${base}/wp-json/wp/v2/brands?per_page=${limit}${searchParam}&_fields=id,name,slug`, { cache: 'no-store' }).catch(() => ({ ok: false, json: async () => [] } as any)),
    ]);

    let products = [];
    let categories = [];
    let brandsA = [];
    let brandsB = [];

    try {
      if (prodRes.ok) products = await prodRes.json();
      if (!Array.isArray(products)) products = [];
    } catch (e) {
      console.error('Error parsing products:', e);
    }

    try {
      if (catRes.ok) categories = await catRes.json();
      if (!Array.isArray(categories)) categories = [];
    } catch (e) {
      console.error('Error parsing categories:', e);
    }

    try {
      if (brandRes1.ok) brandsA = await brandRes1.json();
      if (!Array.isArray(brandsA)) brandsA = [];
    } catch (e) {
      console.error('Error parsing brands (1):', e);
    }

    try {
      if (brandRes2.ok) brandsB = await brandRes2.json();
      if (!Array.isArray(brandsB)) brandsB = [];
    } catch (e) {
      console.error('Error parsing brands (2):', e);
    }

    const seen = new Set<number>();
    const brands = ([] as any[]).concat(brandsA, brandsB).filter((b) => {
      if (!b || typeof b.id !== 'number') return false;
      if (seen.has(b.id)) return false;
      seen.add(b.id);
      return true;
    });

    const data = { products, categories, brands };
    cache.set(key, { at: now, data });
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('Search unified API error:', err);
    return NextResponse.json({ products: [], categories: [], brands: [] });
  }
}

function wcAuthHeaders(): Record<string, string> {
  const key = process.env.NEXT_PUBLIC_WC_CONSUMER_KEY;
  const secret = process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET;
  if (!key || !secret) return {};
  // Basic auth is acceptable for server-to-Woo calls
  const basic = Buffer.from(`${key}:${secret}`).toString('base64');
  return { Authorization: `Basic ${basic}` };
}
