import { NextResponse } from "next/server";
import { validateCartItems } from "@/lib/cart-sync";
import type { CartItem } from "@/lib/types/cart";

/**
 * POST /api/cart/validate
 * Validate cart items (stock, availability, prices)
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

    const validation = await validateCartItems(items as CartItem[]);

    return NextResponse.json({
      valid: validation.valid,
      errors: validation.errors,
    });
  } catch (error: any) {
    console.error("Cart validation error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to validate cart",
        valid: false,
        errors: [],
      },
      { status: 500 }
    );
  }
}

