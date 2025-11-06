import { NextResponse } from "next/server";
import { fetchCategoryBySlug } from "@/lib/woocommerce";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    
    if (!slug) {
      return NextResponse.json({ category: null });
    }
    
    const category = await fetchCategoryBySlug(slug).catch(() => null);
    return NextResponse.json({ category });
  } catch (error) {
    return NextResponse.json({ category: null }, { status: 200 });
  }
}

