import { NextResponse } from "next/server";
import wcAPI from "@/lib/woocommerce";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parent = searchParams.get("parent") || "0";
    const res = await wcAPI.get('/products/categories', { params: { per_page: 50, hide_empty: true, parent } });
    return NextResponse.json({ categories: res.data || [] });
  } catch {
    return NextResponse.json({ categories: [] }, { status: 200 });
  }
}


