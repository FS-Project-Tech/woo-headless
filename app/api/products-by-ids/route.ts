import { NextResponse } from 'next/server';

function wcAuthHeaders(): Record<string, string> {
  const key = process.env.NEXT_PUBLIC_WC_CONSUMER_KEY;
  const secret = process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET;
  if (!key || !secret) return {};
  const basic = Buffer.from(`${key}:${secret}`).toString('base64');
  return { Authorization: `Basic ${basic}` };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const idsParam = (url.searchParams.get('ids') || '').trim();
  if (!idsParam) return NextResponse.json({ products: [] });
  const ids = idsParam
    .split(',')
    .map((s) => parseInt(s, 10))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (ids.length === 0) return NextResponse.json({ products: [] });

  const api = process.env.NEXT_PUBLIC_WC_API_URL || '';
  try {
    const res = await fetch(`${api}/products?include=${ids.join(',')}&per_page=${ids.length}&_fields=id,name,slug,price,regular_price,on_sale,sku,images,categories,average_rating,rating_count,tax_class`, { headers: wcAuthHeaders(), cache: 'no-store' });
    const products = res.ok ? await res.json() : [];
    return NextResponse.json({ products }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ products: [] });
  }
}


