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
  // Read environment variables (server-side only)
  const fallback = {
    logo: process.env.NEXT_PUBLIC_HEADER_LOGO || null,
    footerLogo: process.env.NEXT_PUBLIC_FOOTER_LOGO || null,
    tagline: process.env.NEXT_PUBLIC_HEADER_TAGLINE || null,
    siteName: process.env.NEXT_PUBLIC_SITE_NAME || null,
  };

  const base = getWpBase();
  if (!base) {
    // Return fallback immediately if no WordPress base URL
    return NextResponse.json(fallback, { headers: { 'Cache-Control': 'no-store' } });
  }

  // Try ACF Options endpoint first
  try {
    const res = await fetch(`${base}/wp-json/acf/v3/options/options`, { cache: 'no-store' });
    if (res.ok) {
      const json: any = await res.json();
      const fields = json?.acf || {};
      return NextResponse.json({
        logo: fields?.site_logo?.url || fields?.header_logo?.url || fallback.logo,
        footerLogo: fields?.footer_logo?.url || fields?.footerLogo?.url || fields?.footer_logo_image?.url || fallback.footerLogo || fallback.logo,
        tagline: fields?.header_tagline || fields?.site_tagline || fallback.tagline,
        siteName: fields?.site_name || fields?.siteName || fallback.siteName,
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
        footerLogo: acf?.footer_logo?.url || acf?.footerLogo?.url || acf?.footer_logo_image?.url || fallback.footerLogo || fallback.logo,
        tagline: acf?.header_tagline || acf?.site_tagline || fallback.tagline,
        siteName: acf?.site_name || acf?.siteName || fallback.siteName,
      }, { headers: { 'Cache-Control': 'no-store' } });
    }
  } catch {}

  // Try to get site name from WordPress general settings
  let siteName = fallback.siteName;
  try {
    const settingsRes = await fetch(`${base}/wp-json/wp/v2/settings`, { cache: 'no-store' });
    if (settingsRes.ok) {
      const settings: any = await settingsRes.json();
      siteName = settings?.name || siteName;
    }
  } catch {}

  // Final fallback - always return footerLogo from env var if set
  return NextResponse.json({
    logo: fallback.logo,
    footerLogo: fallback.footerLogo || fallback.logo, // Use footer logo or fallback to header logo
    tagline: fallback.tagline,
    siteName: siteName || fallback.siteName,
  }, { headers: { 'Cache-Control': 'no-store' } });
}
