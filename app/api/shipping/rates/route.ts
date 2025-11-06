import { NextResponse } from "next/server";
import wcAPI from "@/lib/woocommerce";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get("country");
    const zoneName = searchParams.get("zone");

    // Fetch zones
    const zonesRes = await wcAPI.get("/shipping/zones");
    const zones: Array<{ id: number; name: string }> = zonesRes.data || [];

    const methods: Array<{ id: string; label: string; cost: number; zoneId: number; zone: string }> = [];

    // Filter zones by zone name if provided, otherwise default to Australia zone
    let filteredZones: Array<{ id: number; name: string }>;
    if (zoneName === null || zoneName === undefined) {
      // No zone parameter means default to Australia
      filteredZones = zones.filter(z => z.name.toLowerCase().includes('australia'));
      // If no Australia zone found, fall back to all zones
      if (filteredZones.length === 0) {
        filteredZones = zones;
      }
    } else if (zoneName === '') {
      // Empty string means show all zones
      filteredZones = zones;
    } else {
      // Zone name is explicitly provided, filter by it
      filteredZones = zones.filter(z => z.name.toLowerCase().includes(zoneName.toLowerCase()));
    }

    for (const z of filteredZones) {
      try {
        const mRes = await wcAPI.get(`/shipping/zones/${z.id}/methods`);
        const ms = Array.isArray(mRes.data) ? mRes.data : [];
        for (const m of ms) {
          if (m.enabled !== true && m.enabled !== 'yes') continue;
          const cost = m.settings?.cost?.value ? parseFloat(m.settings.cost.value) : (typeof m.cost === 'number' ? m.cost : 0);
          methods.push({ id: `${m.method_id || m.id}:${m.instance_id}`, label: m.title || m.method_title || m.id, cost: isNaN(cost) ? 0 : cost, zoneId: z.id, zone: z.name });
        }
      } catch {}
    }

    return NextResponse.json({ rates: methods });
  } catch (error: any) {
    const status = error?.response?.status || 500;
    const message = error?.response?.data || { message: "Failed to fetch shipping rates" };
    return NextResponse.json(message, { status });
  }
}

// Duplicate handler removed
