import { NextResponse } from "next/server";
import wcAPI from "@/lib/woocommerce";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ category: null });
    }
    
    const res = await wcAPI.get(`/products/categories/${id}`);
    return NextResponse.json({ category: res.data || null });
  } catch (error) {
    return NextResponse.json({ category: null }, { status: 200 });
  }
}

