import { NextResponse } from "next/server";
import wcAPI from "@/lib/woocommerce";

/**
 * Get order by ID
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id, 10);
    
    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: "Invalid order ID" },
        { status: 400 }
      );
    }

    const { data } = await wcAPI.get(`/orders/${orderId}`);
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error fetching order:", error);
    const status = error?.response?.status || 500;
    const message = error?.response?.data || { message: "Failed to fetch order" };
    return NextResponse.json(message, { status });
  }
}

