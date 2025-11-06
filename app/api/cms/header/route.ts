import { NextResponse } from 'next/server';

function getWpBase(): string | null {
  const api = process.env.NEXT_PUBLIC_WC_API_URL || '';
  if (!api) return null;
  try {
    const u = new URL(api);
    return `${u.protocol}//${u.host}`;
  } catch {
    return null;
  }
}

export async function GET() {
  const fallback = {
    logo: process.env.NEXT_PUBLIC_HEADER_LOGO || null,
    tagline: process.env.NEXT_PUBLIC_HEADER_TAGLINE || null,
  };

  const base = getWpBase();
  if (!base) return NextResponse.json(fallback, { headers: { 'Cache-Control': 'no-store' } });

  // Try ACF Options endpoint first
  try {
    const res = await fetch(`${base}/wp-json/acf/v3/options/options`, { cache: 'no-store' });
    if (res.ok) {
      const json: any = await res.json();
      const fields = json?.acf || {};
      return NextResponse.json({
        logo: fields?.site_logo?.url || fields?.header_logo?.url || fallback.logo,
        tagline: fields?.header_tagline || fields?.site_tagline || fallback.tagline,
      }, { headers: { 'Cache-Control': 'no-store' } });
    }
  } catch {}

  // Fallback to a "home" page ACF
  try {
    const res = await fetch(`${base}/wp-json/wp/v2/pages?slug=home&_fields=acf`, { cache: 'no-store' });
    if (res.ok) {
      const arr: any[] = await res.json();
      const acf = arr?.[0]?.acf || {};
      return NextResponse.json({
        logo: acf?.site_logo?.url || acf?.header_logo?.url || fallback.logo,
        tagline: acf?.header_tagline || acf?.site_tagline || fallback.tagline,
      }, { headers: { 'Cache-Control': 'no-store' } });
    }
  } catch {}

  return NextResponse.json(fallback, { headers: { 'Cache-Control': 'no-store' } });
}
