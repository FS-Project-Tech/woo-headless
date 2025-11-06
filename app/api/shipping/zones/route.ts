import { NextResponse } from "next/server";
import wcAPI from "@/lib/woocommerce";

export async function GET() {
  try {
    const { data } = await wcAPI.get("/shipping/zones");
    return NextResponse.json(data);
  } catch (error: any) {
    const status = error?.response?.status || 500;
    const message = error?.response?.data || { message: "Failed to fetch shipping zones" };
    return NextResponse.json(message, { status });
  }
}


