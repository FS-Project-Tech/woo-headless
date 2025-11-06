import { NextResponse } from "next/server";
import { fetchCatalogueData } from "@/lib/catalogue";

export async function GET() {
  try {
    const chapters = await fetchCatalogueData();
    return NextResponse.json({ chapters });
  } catch (error: any) {
    console.error("Error fetching catalogue data:", error);
    return NextResponse.json(
      { error: "Failed to fetch catalogue data", chapters: [] },
      { status: 500 }
    );
  }
}
