import { NextResponse } from "next/server";
import { updateCartPrices } from "@/lib/cart-sync";
import type { CartItem } from "@/components/CartProvider";

/**
 * POST /api/cart/prices
 * Update cart item prices from WooCommerce
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items } = body;

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: "Invalid items array" },
        { status: 400 }
      );
    }

    const priceMap = await updateCartPrices(items as CartItem[]);

    // Convert Map to object for JSON response
    const prices: Record<string, string> = {};
    priceMap.forEach((price, id) => {
      prices[id] = price;
    });

    return NextResponse.json({
      success: true,
      prices,
    });
  } catch (error: any) {
    console.error("Price update error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to update prices",
      },
      { status: 500 }
    );
  }
}

