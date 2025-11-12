import { NextResponse } from "next/server";
import wcAPI from "@/lib/woocommerce";

/**
 * GET - Fetch order details by ID
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params (Next.js 15+ requires this)
    const resolvedParams = await params;
    const orderId = resolvedParams?.id;

    if (!orderId) {
      console.error("Order API: Missing order ID in params");
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    console.log(`Order API: Fetching order ${orderId}`);

    // Fetch order from WooCommerce
    const { data: order } = await wcAPI.get(`/orders/${orderId}`);

    if (!order) {
      console.error(`Order API: Order ${orderId} not found in WooCommerce`);
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    console.log(`Order API: Successfully fetched order ${orderId}`);
    return NextResponse.json({ order });
  } catch (error: any) {
    console.error("Order API Error:", {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status,
      params: error.config?.params,
    });
    
    if (error.response?.status === 404) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    if (error.response?.status === 401 || error.response?.status === 403) {
      return NextResponse.json(
        { error: "Authentication required to view this order" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { 
        error: error.message || "Failed to fetch order details",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: error.response?.status || 500 }
    );
  }
}
