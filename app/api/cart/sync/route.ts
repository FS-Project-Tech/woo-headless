import { NextResponse } from "next/server";
import { syncCartToWooCommerce, validateCartItems } from "@/lib/cart-sync";
import type { CartItem } from "@/lib/types/cart";

/**
 * POST /api/cart/sync
 * Sync cart with WooCommerce and get validated prices/totals
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, couponCode } = body;

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: "Invalid items array" },
        { status: 400 }
      );
    }

    // Validate cart items first
    const validation = await validateCartItems(items as CartItem[]);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "Cart validation failed",
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    // Sync with WooCommerce
    const cartData = await syncCartToWooCommerce(items as CartItem[], couponCode);

    if (!cartData) {
      return NextResponse.json(
        { error: "Failed to sync cart" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      cart: cartData,
    });
  } catch (error: any) {
    console.error("Cart sync error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to sync cart",
      },
      { status: 500 }
    );
  }
}

