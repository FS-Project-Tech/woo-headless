import { NextResponse } from "next/server";
import wcAPI from "@/lib/woocommerce";

export async function GET() {
  try {
    // Get WordPress base URL
    const api = process.env.NEXT_PUBLIC_WC_API_URL || '';
    const u = new URL(api);
    const wpBase = `${u.protocol}//${u.host}`;

    // Method 1: Try to get from WooCommerce settings via custom endpoint
    // WooCommerce stores default country in wp_options as 'woocommerce_default_country'
    try {
      // Try WordPress REST API custom endpoint for WooCommerce options
      const optionsRes = await fetch(`${wpBase}/wp-json/wp/v2/options`, { cache: 'no-store' });
      if (optionsRes.ok) {
        const options = await optionsRes.json();
        const defaultCountry = options?.woocommerce_default_country || options?.default_country;
        if (defaultCountry) {
          // Extract country code (format might be "AU:AU" or just "AU")
          const countryCode = defaultCountry.split(':')[0].trim();
          if (countryCode) {
            return NextResponse.json({ 
              defaultCountry: countryCode,
              storeCountry: countryCode 
            });
          }
        }
      }
    } catch {}

    // Method 2: Try to get from shipping zones (most reliable fallback)
    try {
      const zonesRes = await wcAPI.get("/shipping/zones");
      const zones: Array<{ id: number; name: string }> = zonesRes.data || [];
      
      // Try to get countries from zones, prioritizing "Locations not covered by other zones"
      // which is usually zone 0, or the first zone
      for (const zone of zones) {
        try {
          const zoneLocationsRes = await wcAPI.get(`/shipping/zones/${zone.id}/locations`);
          const locations: Array<{ code: string; type: string }> = zoneLocationsRes.data || [];
          
          // Find the first country code
          const countryLocation = locations.find(loc => loc.type === 'country');
          if (countryLocation && countryLocation.code) {
            return NextResponse.json({ 
              defaultCountry: countryLocation.code,
              storeCountry: countryLocation.code 
            });
          }
        } catch {}
      }
    } catch {}

    // Fallback to Australia if nothing found
    return NextResponse.json({ 
      defaultCountry: "AU",
      storeCountry: "AU" 
    });
  } catch (error: any) {
    // Fallback to Australia on error
    return NextResponse.json({ 
      defaultCountry: "AU",
      storeCountry: "AU" 
    });
  }
}

