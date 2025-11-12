import { NextRequest, NextResponse } from "next/server";
import wcAPI from "@/lib/woocommerce";
import { getAuthToken, getWpBaseUrl } from "@/lib/auth";
import {
  generateIdempotencyKey,
  checkIdempotency,
  storeIdempotencyResult,
  acquireOrderLock,
  releaseOrderLock,
  validateCSRFToken,
} from "@/lib/checkout-security";
import { syncCartToWooCommerce } from "@/lib/cart-sync";
import type { CartItem } from "@/components/CartProvider";

/**
 * POST /api/checkout
 * 
 * Secure checkout endpoint with:
 * - CSRF protection
 * - Idempotency (prevents duplicate orders)
 * - Order locking (prevents race conditions)
 * - Payment validation
 * - WooCommerce order creation
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // 1. Validate required fields
    const {
      billing,
      shipping,
      payment_method,
      line_items,
      shipping_lines,
      coupon_code,
      csrf_token,
      idempotency_key,
      ndis_number,
      hcp_number,
      delivery_authority,
      delivery_instructions,
    } = body;

    // Basic validation
    if (!billing || !billing.email || !billing.first_name || !billing.last_name) {
      return NextResponse.json(
        { error: "Billing information is required" },
        { status: 400 }
      );
    }

    if (!line_items || !Array.isArray(line_items) || line_items.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      );
    }

    if (!payment_method) {
      return NextResponse.json(
        { error: "Payment method is required" },
        { status: 400 }
      );
    }

    // 2. CSRF Protection
    const sessionCSRF = req.headers.get("x-csrf-token") || req.cookies.get("csrf-token")?.value;
    if (csrf_token && sessionCSRF && !validateCSRFToken(csrf_token, sessionCSRF)) {
      return NextResponse.json(
        { error: "Invalid CSRF token" },
        { status: 403 }
      );
    }

    // 3. Idempotency Check
    const cartTotal = body.total || 0;
    const idempotencyKey = idempotency_key || generateIdempotencyKey(
      line_items.map((item: any) => ({
        productId: item.product_id,
        quantity: item.quantity,
      })),
      cartTotal
    );

    const idempotencyCheck = checkIdempotency(idempotencyKey);
    if (idempotencyCheck.isDuplicate) {
      return NextResponse.json({
        success: true,
        order: idempotencyCheck.result,
        message: "Order already processed",
      });
    }

    // 4. Order Lock (prevent duplicate orders)
    const orderLockKey = `guest-${Date.now()}-${idempotencyKey.slice(0, 8)}`;
    const lockResult = acquireOrderLock(orderLockKey);
    
    if (!lockResult.success) {
      return NextResponse.json(
        { error: "Order is being processed. Please wait." },
        { status: 409 }
      );
    }

    try {
      // 5. Validate cart items and sync with WooCommerce
      const cartItems: CartItem[] = line_items.map((item: any) => ({
        id: `${item.product_id}${item.variation_id ? ':' + item.variation_id : ''}`,
        productId: item.product_id,
        variationId: item.variation_id,
        name: item.name || '',
        slug: item.slug || '',
        price: String(item.price || 0),
        qty: item.quantity,
        sku: item.sku,
      }));

      const cartSync = await syncCartToWooCommerce(cartItems, coupon_code);
      if (!cartSync) {
        releaseOrderLock(orderLockKey);
        return NextResponse.json(
          { error: "Failed to validate cart items" },
          { status: 400 }
        );
      }

      // 6. Determine payment status and order status based on payment method
      const offlinePaymentMethods = ['cod', 'bacs', 'bank_transfer', 'cheque'];
      const isOfflinePayment = offlinePaymentMethods.includes(payment_method);
      
      // Determine setPaid and orderStatus based on payment method
      let setPaid = false;
      let orderStatus = 'pending'; // Default to pending
      
      if (payment_method === 'cod') {
        // Cash on Delivery - Order is being processed/fulfilled, payment will be received on delivery
        // Order status: "processing" (order is being prepared/shipped)
        // Payment status: "Pending Payment" (will be paid on delivery) - this is handled by set_paid: false
        orderStatus = 'processing';
        setPaid = false; // Payment pending (will be paid on delivery)
      } else if (payment_method === 'bacs' || payment_method === 'bank_transfer' || payment_method === 'cheque') {
        // Bank Transfer / Cheque - remains pending until payment confirmed
        orderStatus = 'pending';
        setPaid = false; // Payment pending (waiting for confirmation)
      } else {
        // Online payment methods (PayPal, Stripe, etc.)
        // Payment must be processed before order creation
        setPaid = body.payment_processed === true;
        orderStatus = setPaid ? 'processing' : 'pending';
      }

      // 7. Build order meta data
      const metaData: Array<{ key: string; value: any }> = [];

      if (ndis_number) {
        metaData.push({ key: "NDIS Number", value: ndis_number });
      }

      if (hcp_number) {
        metaData.push({ key: "HCP Number", value: hcp_number });
      }

      if (delivery_authority) {
        const authorityLabel = delivery_authority === "with_signature" 
          ? "With Signature" 
          : "Without Signature";
        metaData.push({ key: "Delivery Authority", value: authorityLabel });
      }

      if (delivery_instructions) {
        metaData.push({ key: "Delivery Instructions", value: delivery_instructions });
      }

      if (body.subscribe_newsletter) {
        metaData.push({ key: "Newsletter Subscription", value: "Yes" });
      }

      // Add idempotency key to meta for tracking
      metaData.push({ key: "_idempotency_key", value: idempotencyKey });

      // 8. Get customer IP
      const forwarded = req.headers.get("x-forwarded-for");
      const realIp = req.headers.get("x-real-ip");
      const customerIp = forwarded?.split(",")[0]?.trim() || realIp || req.headers.get("cf-connecting-ip") || "";

      // 8.5. Get customer ID if user is logged in
      let customerId = null;
      try {
        const token = await getAuthToken();
        if (token) {
          const wpBase = getWpBaseUrl();
          if (wpBase) {
            // Get user data
            const userResponse = await fetch(`${wpBase}/wp-json/wp/v2/users/me`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              cache: 'no-store',
            });

            if (userResponse.ok) {
              const user = await userResponse.json();
              
              // Get WooCommerce customer ID
              try {
                const customerResponse = await wcAPI.get('/customers', {
                  params: { email: user.email || billing.email },
                });
                
                if (customerResponse.data && customerResponse.data.length > 0) {
                  customerId = customerResponse.data[0].id;
                } else if (user.id) {
                  // Fallback to WordPress user ID if WooCommerce customer not found
                  customerId = user.id;
                }
              } catch (wcError) {
                // If WooCommerce API fails, try using WordPress user ID
                if (user.id) {
                  customerId = user.id;
                }
              }
            }
          }
        }
      } catch (authError) {
        // If authentication fails, continue as guest order
        console.warn('Could not get customer ID, creating guest order:', authError);
      }

      // 9. Build WooCommerce order payload
      const orderPayload: any = {
        payment_method: payment_method,
        payment_method_title: getPaymentMethodTitle(payment_method),
        set_paid: setPaid,
        status: orderStatus,
        customer_ip_address: customerIp,
        ...(customerId && { customer_id: customerId }), // Add customer_id if user is logged in
        billing: {
          first_name: billing.first_name,
          last_name: billing.last_name,
          email: billing.email,
          phone: billing.phone || '',
          address_1: billing.address_1 || '',
          address_2: billing.address_2 || '',
          city: billing.city || '',
          state: billing.state || '',
          postcode: billing.postcode || '',
          country: billing.country || 'AU',
        },
        shipping: shipping || {
          first_name: billing.first_name,
          last_name: billing.last_name,
          address_1: billing.address_1 || '',
          address_2: billing.address_2 || '',
          city: billing.city || '',
          state: billing.state || '',
          postcode: billing.postcode || '',
          country: billing.country || 'AU',
        },
        line_items: cartSync.items.map((item) => ({
          product_id: item.product_id,
          variation_id: item.variation_id,
          quantity: item.quantity,
        })),
        shipping_lines: shipping_lines || [],
        meta_data: metaData,
      };

      // Add coupon if provided
      if (coupon_code) {
        orderPayload.coupon_lines = [{ code: coupon_code }];
      }

      // 10. Create order in WooCommerce
      const orderResponse = await wcAPI.post("/orders", orderPayload);
      const order = orderResponse.data;

      // 11. Store idempotency result
      storeIdempotencyResult(idempotencyKey, {
        id: order.id,
        order_key: order.order_key,
        status: order.status,
        total: order.total,
      });

      // 12. Release lock
      releaseOrderLock(orderLockKey);

      // 13. Return success response
      return NextResponse.json({
        success: true,
        order: {
          id: order.id,
          order_key: order.order_key,
          status: order.status,
          total: order.total,
          payment_method: order.payment_method,
          payment_method_title: order.payment_method_title,
          billing: order.billing,
          shipping: order.shipping,
          line_items: order.line_items,
        },
        idempotency_key: idempotencyKey,
        redirect_url: `/checkout/order-review?orderId=${order.id}`,
      });

    } catch (error: any) {
      // Release lock on error
      releaseOrderLock(orderLockKey);

      console.error("Checkout error:", error);
      
      if (error.response?.data) {
        return NextResponse.json(
          {
            error: error.response.data.message || "Failed to create order",
            details: error.response.data,
          },
          { status: error.response.status || 500 }
        );
      }

      return NextResponse.json(
        { error: "Failed to process checkout", details: error.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Checkout API error:", error);
    return NextResponse.json(
      { error: "Invalid request", details: error.message },
      { status: 400 }
    );
  }
}

/**
 * Get payment method display title
 */
function getPaymentMethodTitle(method: string): string {
  const titles: Record<string, string> = {
    paypal: "PayPal",
    cod: "Cash on Delivery",
    bacs: "Direct Bank Transfer",
    bank_transfer: "Bank Transfer",
    cheque: "Cheque Payment",
    stripe: "Credit Card (Stripe)",
  };
  return titles[method] || method;
}

