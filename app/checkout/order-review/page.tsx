"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { validateAccessToken, getStoredToken } from "@/lib/access-token";
import Link from "next/link";
import Image from "next/image";

export default function OrderReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [orderId, setOrderId] = useState<string | null>(null);

  // Ensure component is mounted before accessing browser APIs
  useEffect(() => {
    setIsMounted(true);
    // Get orderId after mount to avoid hydration mismatch
    const id = searchParams.get("orderId");
    setOrderId(id);
  }, [searchParams]);

  // Validate access token on mount (only after client mount)
  useEffect(() => {
    if (!isMounted || typeof window === "undefined") return;
    
    console.log("Order review page - orderId:", orderId);
    console.log("Order review page - searchParams:", Object.fromEntries(searchParams.entries()));
    
    // Check orderId first - if present, we allow access
    if (!orderId) {
      // No orderId - redirect to shop
      console.warn("No orderId found, redirecting to shop");
      router.push("/shop");
      return;
    }
    
    // If we have orderId, authorize immediately (orderId is proof of successful order)
    console.log("OrderId present, authorizing access");
    setIsAuthorized(true);
    
    // Token validation is optional - we don't block if token is missing/invalid when orderId exists
    const token = searchParams.get("token");
    if (token) {
      // Validate token if present, but don't block if invalid
      const isValid = validateAccessToken(token, "checkout");
      if (!isValid) {
        console.warn("Token invalid but orderId present - allowing access");
      } else {
        console.log("Token validated successfully");
      }
    } else {
      console.log("No token in URL, but orderId present - allowing access");
    }
  }, [isMounted, searchParams, router, orderId]);

  // Fetch order data
  useEffect(() => {
    if (!isAuthorized || !orderId) return;
    
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setOrderData(data);
        } else {
          console.error("Failed to fetch order:", res.status, res.statusText);
          // If order not found, still show the page with orderId
          setOrderData({ id: orderId });
        }
      } catch (error) {
        console.error("Error fetching order:", error);
        // Even if fetch fails, show the page with orderId
        setOrderData({ id: orderId });
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthorized, orderId]);

  if (!isMounted || !isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 py-10 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 mb-2">Redirecting...</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-10 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 mb-2">Loading order details...</div>
        </div>
      </div>
    );
  }

  // If no orderData but we have orderId, show basic confirmation
  const displayOrderId = orderData?.id || orderId;
  
  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto w-[85vw] px-4 sm:px-6 lg:px-8">
        {/* Success Header */}
        <div className="rounded-xl border bg-white p-8 mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900">Thank you for your order!</h2>
          <p className="mt-2 text-gray-600">Your order <span className="font-semibold">#{displayOrderId}</span> has been placed successfully.</p>
          {orderData?.date_created && (
            <p className="mt-1 text-sm text-gray-500">Order placed on {formatDate(orderData.date_created)}</p>
          )}
        </div>

        {/* Order Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Items (2/3 width on large screens) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="rounded-xl border bg-white p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
              {orderData?.line_items && orderData.line_items.length > 0 ? (
                <div className="space-y-4">
                  {orderData.line_items.map((item: any, index: number) => (
                    <div key={item.id || index} className="flex gap-4 pb-4 border-b border-gray-200 last:border-0 last:pb-0">
                      {item.image && (
                        <div className="relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200">
                          <Image
                            src={item.image.src || item.image}
                            alt={item.name || "Product"}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        {item.sku && (
                          <p className="text-sm text-gray-500 mt-1">SKU: {item.sku}</p>
                        )}
                        {item.variation && item.variation.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {item.variation.map((variation: any, vIdx: number) => (
                              <span key={vIdx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                {variation.attribute}: {variation.value}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-sm text-gray-600">Quantity: {item.quantity}</span>
                          <span className="font-semibold text-gray-900">${item.total}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No items found in this order.</p>
              )}
            </div>

            {/* Order Notes */}
            {orderData?.customer_note && (
              <div className="rounded-xl border bg-white p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Order Notes</h3>
                <p className="text-gray-600 text-sm whitespace-pre-wrap">{orderData.customer_note}</p>
              </div>
            )}
          </div>

          {/* Right Column - Order Summary (1/3 width on large screens) */}
          <div className="space-y-6">
            {/* Order Information */}
            <div className="rounded-xl border bg-white p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Order Number:</span>
                  <p className="font-medium text-gray-900 mt-1">#{displayOrderId}</p>
                </div>
                {orderData?.status && (
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <p className="font-medium text-gray-900 mt-1 capitalize">{orderData.status.replace(/-/g, " ")}</p>
                  </div>
                )}
                {orderData?.date_created && (
                  <div>
                    <span className="text-gray-600">Date:</span>
                    <p className="font-medium text-gray-900 mt-1">{formatDate(orderData.date_created)}</p>
                  </div>
                )}
                {orderData?.payment_method_title && (
                  <div>
                    <span className="text-gray-600">Payment Method:</span>
                    <p className="font-medium text-gray-900 mt-1">{orderData.payment_method_title}</p>
                  </div>
                )}
                {orderData?.transaction_id && (
                  <div>
                    <span className="text-gray-600">Transaction ID:</span>
                    <p className="font-medium text-gray-900 mt-1 font-mono text-xs">{orderData.transaction_id}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Billing Address */}
            {orderData?.billing && (
              <div className="rounded-xl border bg-white p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing Address</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p className="font-medium text-gray-900">{orderData.billing.first_name} {orderData.billing.last_name}</p>
                  {orderData.billing.company && <p>{orderData.billing.company}</p>}
                  <p>{orderData.billing.address_1}</p>
                  {orderData.billing.address_2 && <p>{orderData.billing.address_2}</p>}
                  <p>
                    {orderData.billing.city}, {orderData.billing.state} {orderData.billing.postcode}
                  </p>
                  <p>{orderData.billing.country}</p>
                  {orderData.billing.email && (
                    <p className="mt-2 pt-2 border-t border-gray-200">
                      <span className="font-medium text-gray-700">Email:</span> {orderData.billing.email}
                    </p>
                  )}
                  {orderData.billing.phone && (
                    <p>
                      <span className="font-medium text-gray-700">Phone:</span> {orderData.billing.phone}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Shipping Address */}
            {orderData?.shipping && orderData.shipping.address_1 && (
              <div className="rounded-xl border bg-white p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p className="font-medium text-gray-900">{orderData.shipping.first_name} {orderData.shipping.last_name}</p>
                  {orderData.shipping.company && <p>{orderData.shipping.company}</p>}
                  <p>{orderData.shipping.address_1}</p>
                  {orderData.shipping.address_2 && <p>{orderData.shipping.address_2}</p>}
                  <p>
                    {orderData.shipping.city}, {orderData.shipping.state} {orderData.shipping.postcode}
                  </p>
                  <p>{orderData.shipping.country}</p>
                </div>
              </div>
            )}

            {/* Order Totals */}
            <div className="rounded-xl border bg-white p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Totals</h3>
              <div className="space-y-2 text-sm">
                {orderData?.total && (
                  <>
                    {orderData.subtotal && (
                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal:</span>
                        <span>${orderData.subtotal}</span>
                      </div>
                    )}
                    {orderData.discount_total && parseFloat(orderData.discount_total) > 0 && (
                      <div className="flex justify-between text-gray-600">
                        <span>Discount:</span>
                        <span className="text-green-600">-${orderData.discount_total}</span>
                      </div>
                    )}
                    {orderData.shipping_total && parseFloat(orderData.shipping_total) > 0 && (
                      <div className="flex justify-between text-gray-600">
                        <span>Shipping:</span>
                        <span>${orderData.shipping_total}</span>
                      </div>
                    )}
                    {orderData.total_tax && parseFloat(orderData.total_tax) > 0 && (
                      <div className="flex justify-between text-gray-600">
                        <span>Tax:</span>
                        <span>${orderData.total_tax}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-gray-200 font-semibold text-gray-900">
                      <span>Total:</span>
                      <span>${orderData.total}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/shop" 
            className="inline-block rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-black transition-colors text-center"
          >
            Continue Shopping
          </Link>
          {orderId && (
            <Link 
              href={`/my-account/orders/${orderId}`}
              className="inline-block rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors text-center"
            >
              View Order in Account
            </Link>
          )}
          <Link 
            href="/" 
            className="inline-block rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors text-center"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

