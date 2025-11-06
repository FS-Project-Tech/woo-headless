"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { useAuth } from "@/components/AuthProvider";
import { useCheckout } from "@/components/CheckoutProvider";
import Image from "next/image";
import { validateAccessToken, getStoredToken, getCartUrl } from "@/lib/access-token";
import Link from "next/link";

interface FormErrors {
  billing?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    address_1?: string;
    city?: string;
    postcode?: string;
    country?: string;
    state?: string;
  };
  shipping?: {
    first_name?: string;
    last_name?: string;
    address_1?: string;
    city?: string;
    postcode?: string;
    country?: string;
    state?: string;
  };
}

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, updateItemQty, removeItem, clear } = useCart();
  const { user } = useAuth();
  const {
    billing,
    shipping,
    shippingMethod,
    coupon,
    discount,
    paymentMethod,
    shipToDifferentAddress,
    deliveryAuthority,
    deliveryInstructions,
    subscribeNewsletter,
    orderId,
    errors,
    setBilling,
    setShipping,
    setShippingMethod,
    setCoupon,
    setDiscount,
    setPaymentMethod,
    setShipToDifferentAddress,
    setDeliveryAuthority,
    setDeliveryInstructions,
    setSubscribeNewsletter,
    setOrderId,
    setErrors,
    clearCheckout,
  } = useCheckout();

  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [rates, setRates] = useState<any[]>([]);
  const [placing, setPlacing] = useState(false);
  const [enabledPaymentMethods, setEnabledPaymentMethods] = useState<Array<{ id: string; title: string; description?: string; enabled: boolean }>>([]);

  // Ensure component is mounted before accessing browser APIs
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const subtotal = useMemo(() => {
    return items.reduce((s: number, i: any) => s + Number(i.price || 0) * i.qty, 0);
  }, [items]);

  const shippingCost = shippingMethod ? Number(shippingMethod.cost || 0) : 0;
  const gst = useMemo(() => {
    const base = Math.max(0, subtotal - discount) + shippingCost;
    return Number((base * 0.1).toFixed(2));
  }, [subtotal, discount, shippingCost]);

  const total = useMemo(() => {
    return Number((Math.max(0, subtotal - discount) + shippingCost + gst).toFixed(2));
  }, [subtotal, discount, shippingCost, gst]);

  // Validate access token on mount (only after client mount)
  useEffect(() => {
    if (!isMounted || typeof window === "undefined") return;
    
    const token = searchParams.get("token") || getStoredToken();
    
    // Check if token is valid
    if (!validateAccessToken(token, "checkout")) {
      // Redirect to home page if no valid token
      router.push("/");
      return;
    }
    
    // Check if cart has items
    if (items.length === 0) {
      // Redirect to shop if cart is empty
      router.push("/shop");
      return;
    }
    
    // Authorized - allow access
    setIsAuthorized(true);
  }, [isMounted, searchParams, router, items.length]);

  // Fetch enabled payment methods and default country
  useEffect(() => {
    if (!isAuthorized) return;
    
    (async () => {
      try {
        const paymentRes = await fetch('/api/payment-methods', { cache: 'no-store' });
        const paymentData = await paymentRes.json();
        if (paymentData.paymentMethods && Array.isArray(paymentData.paymentMethods)) {
          setEnabledPaymentMethods(paymentData.paymentMethods.filter((m: any) => m.enabled));
        }
      } catch {
        setEnabledPaymentMethods([
          { id: 'stripe', title: 'Credit Card (Stripe)', description: 'Pay with your credit card via Stripe.', enabled: true },
          { id: 'paypal', title: 'PayPal', description: 'Pay via PayPal.', enabled: true },
          { id: 'cod', title: 'Cash on Delivery', description: 'Pay with cash upon delivery.', enabled: true },
          { id: 'bacs', title: 'Direct Bank Transfer', description: 'Make your payment directly into our bank account.', enabled: true },
        ]);
      }

      try {
        const res = await fetch('/api/store-settings', { cache: 'no-store' });
        const data = await res.json();
        const defaultCountry = data.defaultCountry || 'AU';
        
        if (!billing.country) {
          setBilling((prev: any) => ({ ...prev, country: defaultCountry }));
        }
        if (!shipping.country) {
          setShipping((prev: any) => ({ ...prev, country: defaultCountry }));
        }
      } catch {
        if (!billing.country) {
          setBilling((prev: any) => ({ ...prev, country: 'AU' }));
        }
        if (!shipping.country) {
          setShipping((prev: any) => ({ ...prev, country: 'AU' }));
        }
      }
    })();
  }, [isAuthorized, billing.country, shipping.country, setBilling, setShipping]);

  // Auto-fill shipping from billing when "same as billing" is checked
  useEffect(() => {
    if (!shipToDifferentAddress && billing.first_name) {
      setShipping({
        first_name: billing.first_name,
        last_name: billing.last_name,
        address_1: billing.address_1,
        city: billing.city,
        postcode: billing.postcode,
        country: billing.country,
        state: billing.state,
      });
    }
  }, [shipToDifferentAddress, billing, setShipping]);

  // Fetch shipping rates
  useEffect(() => {
    if (!isAuthorized) return;
    
    (async () => {
      try {
        const params = new URLSearchParams();
        if (shipping.country) {
          params.set('country', shipping.country);
          if (shipping.country === 'AU' || shipping.country === 'Australia') {
            params.set('zone', 'Australia');
          }
        } else {
          params.set('country', 'AU');
          params.set('zone', 'Australia');
        }
        
        const res = await fetch(`/api/shipping/rates?${params.toString()}`, { cache: 'no-store' });
        const data = await res.json();
        const rs = Array.isArray(data.rates) ? data.rates : [];
        setRates(rs);
        if (rs.length > 0 && !shippingMethod) {
          setShippingMethod(rs[0]);
        }
      } catch {
        setRates([]);
      }
    })();
  }, [shipping.country, shipping.postcode, shipping.state, isAuthorized, shippingMethod, setShippingMethod]);

  const validateBilling = (): boolean => {
    const newErrors: FormErrors = { billing: {} };
    if (!billing.first_name?.trim()) newErrors.billing!.first_name = "First name is required";
    if (!billing.last_name?.trim()) newErrors.billing!.last_name = "Last name is required";
    if (!billing.email?.trim()) {
      newErrors.billing!.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billing.email)) {
      newErrors.billing!.email = "Invalid email format";
    }
    if (!billing.phone?.trim()) newErrors.billing!.phone = "Phone is required";
    if (!billing.address_1?.trim()) newErrors.billing!.address_1 = "Address is required";
    if (!billing.city?.trim()) newErrors.billing!.city = "City is required";
    if (!billing.postcode?.trim()) newErrors.billing!.postcode = "Postcode is required";
    if (!billing.country?.trim()) newErrors.billing!.country = "Country is required";
    if (!billing.state?.trim()) newErrors.billing!.state = "State is required";

    setErrors(newErrors);
    return Object.keys(newErrors.billing || {}).length === 0;
  };

  const validateShipping = (): boolean => {
    if (!shipToDifferentAddress) return true;
    
    const newErrors: FormErrors = { shipping: {} };
    if (!shipping.first_name?.trim()) newErrors.shipping!.first_name = "First name is required";
    if (!shipping.last_name?.trim()) newErrors.shipping!.last_name = "Last name is required";
    if (!shipping.address_1?.trim()) newErrors.shipping!.address_1 = "Address is required";
    if (!shipping.city?.trim()) newErrors.shipping!.city = "City is required";
    if (!shipping.postcode?.trim()) newErrors.shipping!.postcode = "Postcode is required";
    if (!shipping.country?.trim()) newErrors.shipping!.country = "Country is required";
    if (!shipping.state?.trim()) newErrors.shipping!.state = "State is required";

    setErrors((prev: any) => ({ ...prev, shipping: newErrors.shipping }));
    return Object.keys(newErrors.shipping || {}).length === 0;
  };

  const placeOrder = async () => {
    if (!validateBilling() || !validateShipping()) {
      alert("Please fill in all required fields correctly.");
      return;
    }
    if (!shippingMethod) {
      alert("Please select a shipping method.");
      return;
    }
    if (!paymentMethod) {
      alert("Please select a payment method.");
      return;
    }

    setPlacing(true);
    try {
      const finalShipping = shipToDifferentAddress ? shipping : billing;

      let paymentIntentId: string | null = null;
      let paymentProcessed = false;

      if (paymentMethod === "stripe" || paymentMethod === "stripe_cc" || paymentMethod === "paypal") {
        try {
          const paymentRes = await fetch("/api/payments/process", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              payment_method: paymentMethod,
              amount: total,
              currency: "AUD",
              billing,
              return_url: typeof window !== 'undefined' ? window.location.href : '',
            }),
          });

          const paymentData = await paymentRes.json();
          
          if (!paymentRes.ok || !paymentData.success) {
            alert(paymentData.error || "Payment processing failed. Please try again.");
            setPlacing(false);
            return;
          }

          paymentIntentId = paymentData.payment_intent_id || paymentData.transaction_id || null;
          paymentProcessed = paymentData.requires_payment !== false;
          
          if (paymentData.requires_payment && !paymentIntentId) {
            alert("Payment verification failed. Please try again.");
            setPlacing(false);
            return;
          }
        } catch (paymentError) {
          console.error("Payment processing error:", paymentError);
          alert("Payment processing failed. Please try again.");
          setPlacing(false);
          return;
        }
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_method: paymentMethod,
          payment_method_title: enabledPaymentMethods.find(m => m.id === paymentMethod)?.title || (paymentMethod === "cod" ? "Cash on Delivery" : paymentMethod === "bank_transfer" || paymentMethod === "bacs" ? "Bank Transfer" : paymentMethod === "stripe" ? "Credit Card (Stripe)" : "PayPal"),
          payment_intent_id: paymentIntentId,
          set_paid: paymentProcessed,
          billing,
          shipping: finalShipping,
          line_items: items.map((i) => ({
            product_id: i.productId,
            variation_id: i.variationId || undefined,
            quantity: i.qty,
            // Include per-item meta so Woo shows it in admin and emails
            meta_data: [
              // Delivery Frequency (if present on the cart item)
              ...(i.deliveryFrequency || i.plan
                ? [{ key: "Delivery Frequency", value: String(i.deliveryFrequency || i.plan) }]
                : []),
              // SKU (if present on the cart item)
              ...(i.sku ? [{ key: "SKU", value: String(i.sku) }] : []),
              // Variation (human-readable, if present on the cart item)
              ...(i.variationName ? [{ key: "Variation", value: String(i.variationName) }] : []),
            ],
          })),
          shipping_lines: shippingMethod ? [{ method_id: shippingMethod.method_id || "flat_rate", total: String(shippingMethod.total || shippingMethod.cost || 0) }] : [],
          coupon_lines: discount > 0 ? [{ code: coupon, discount_amount: String(discount) }] : [],
          meta_data: [
            { key: "delivery_authority", value: deliveryAuthority },
            { key: "delivery_instructions", value: deliveryInstructions },
            { key: "subscribe_newsletter", value: subscribeNewsletter },
            { key: "_payment_method", value: paymentMethod },
            { key: "_payment_method_title", value: paymentMethod === "cod" ? "Cash on Delivery" : paymentMethod === "bank_transfer" || paymentMethod === "bacs" ? "Bank Transfer" : paymentMethod === "stripe" ? "Credit Card (Stripe)" : "PayPal" },
          ],
        }),
      });

      if (subscribeNewsletter && billing.email) {
        try {
          await fetch("/api/newsletter/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: billing.email }),
          });
        } catch {}
      }

      const json = await res.json();
      if (res.ok && json && json.id) {
        setOrderId(json.id);
        
        if (user && user.id && billing.email) {
          try {
            await fetch("/api/customers/update-payment-method", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                customerId: user.id,
                paymentMethod: paymentMethod,
                billing: billing,
              }),
            });
          } catch {}
        }
        
        // Get token before clearing cart
        const token = searchParams.get("token") || getStoredToken();
        const orderId = json.id;
        
        console.log("Order created successfully:", orderId);
        console.log("Redirecting to order review with token:", token ? "present" : "missing");
        
        // Clear cart after successful order
        clear();
        
        // Redirect to order review with token and orderId
        // Use window.location.href for reliable redirect (full page reload)
        const reviewUrl = token 
          ? `/checkout/order-review?token=${encodeURIComponent(token)}&orderId=${orderId}`
          : `/checkout/order-review?orderId=${orderId}`;
        
        console.log("Redirecting to:", reviewUrl);
        
        // Use window.location for immediate, reliable redirect
        if (typeof window !== 'undefined') {
          window.location.href = reviewUrl;
        } else {
          router.push(reviewUrl);
        }
      } else {
        alert("Failed to create order");
      }
    } catch (e) {
      alert("Order error");
    } finally {
      setPlacing(false);
    }
  };

  // Show loading if not mounted or not authorized
  if (!isMounted || !isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 py-10 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 mb-2">Redirecting...</div>
          <div className="text-sm text-gray-500">Please add items to cart first</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto w-[85vw] px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Checkout</h1>
          {isMounted && (
            <Link 
              href={getCartUrl()}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              View Cart
            </Link>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Billing Details */}
            <div className="rounded-xl border bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold">Billing Details</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    First Name <span className="text-rose-600">*</span>
                  </label>
                  <input 
                    type="text"
                    value={billing.first_name || ''}
                    onChange={(e) => {
                      setBilling({ ...billing, first_name: e.target.value });
                      if (errors.billing?.first_name) {
                        setErrors((prev: any) => ({ ...prev, billing: { ...prev.billing, first_name: undefined } }));
                      }
                    }}
                    className={`w-full rounded border px-3 py-2 text-sm ${errors.billing?.first_name ? 'border-rose-500' : 'border-gray-300'}`}
                    placeholder="First name"
                  />
                  {errors.billing?.first_name && (
                    <p className="mt-1 text-xs text-rose-600">{errors.billing.first_name}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Last Name <span className="text-rose-600">*</span>
                  </label>
                  <input 
                    type="text"
                    value={billing.last_name || ''}
                    onChange={(e) => {
                      setBilling({ ...billing, last_name: e.target.value });
                      if (errors.billing?.last_name) {
                        setErrors((prev: any) => ({ ...prev, billing: { ...prev.billing, last_name: undefined } }));
                      }
                    }}
                    className={`w-full rounded border px-3 py-2 text-sm ${errors.billing?.last_name ? 'border-rose-500' : 'border-gray-300'}`}
                    placeholder="Last name"
                  />
                  {errors.billing?.last_name && (
                    <p className="mt-1 text-xs text-rose-600">{errors.billing.last_name}</p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Email <span className="text-rose-600">*</span>
                  </label>
                  <input 
                    type="email"
                    value={billing.email || ''}
                    onChange={(e) => {
                      setBilling({ ...billing, email: e.target.value });
                      if (errors.billing?.email) {
                        setErrors((prev: any) => ({ ...prev, billing: { ...prev.billing, email: undefined } }));
                      }
                    }}
                    className={`w-full rounded border px-3 py-2 text-sm ${errors.billing?.email ? 'border-rose-500' : 'border-gray-300'}`}
                    placeholder="email@example.com"
                  />
                  {errors.billing?.email && (
                    <p className="mt-1 text-xs text-rose-600">{errors.billing.email}</p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Phone <span className="text-rose-600">*</span>
                  </label>
                  <input 
                    type="tel"
                    value={billing.phone || ''}
                    onChange={(e) => {
                      setBilling({ ...billing, phone: e.target.value });
                      if (errors.billing?.phone) {
                        setErrors((prev: any) => ({ ...prev, billing: { ...prev.billing, phone: undefined } }));
                      }
                    }}
                    className={`w-full rounded border px-3 py-2 text-sm ${errors.billing?.phone ? 'border-rose-500' : 'border-gray-300'}`}
                    placeholder="Phone number"
                  />
                  {errors.billing?.phone && (
                    <p className="mt-1 text-xs text-rose-600">{errors.billing.phone}</p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Address <span className="text-rose-600">*</span>
                  </label>
                  <input 
                    type="text"
                    value={billing.address_1 || ''}
                    onChange={(e) => {
                      setBilling({ ...billing, address_1: e.target.value });
                      if (errors.billing?.address_1) {
                        setErrors((prev: any) => ({ ...prev, billing: { ...prev.billing, address_1: undefined } }));
                      }
                    }}
                    className={`w-full rounded border px-3 py-2 text-sm ${errors.billing?.address_1 ? 'border-rose-500' : 'border-gray-300'}`}
                    placeholder="Street address"
                  />
                  {errors.billing?.address_1 && (
                    <p className="mt-1 text-xs text-rose-600">{errors.billing.address_1}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    City <span className="text-rose-600">*</span>
                  </label>
                  <input 
                    type="text"
                    value={billing.city || ''}
                    onChange={(e) => {
                      setBilling({ ...billing, city: e.target.value });
                      if (errors.billing?.city) {
                        setErrors((prev: any) => ({ ...prev, billing: { ...prev.billing, city: undefined } }));
                      }
                    }}
                    className={`w-full rounded border px-3 py-2 text-sm ${errors.billing?.city ? 'border-rose-500' : 'border-gray-300'}`}
                    placeholder="City"
                  />
                  {errors.billing?.city && (
                    <p className="mt-1 text-xs text-rose-600">{errors.billing.city}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Postcode <span className="text-rose-600">*</span>
                  </label>
                  <input 
                    type="text"
                    value={billing.postcode || ''}
                    onChange={(e) => {
                      setBilling({ ...billing, postcode: e.target.value });
                      if (errors.billing?.postcode) {
                        setErrors((prev: any) => ({ ...prev, billing: { ...prev.billing, postcode: undefined } }));
                      }
                    }}
                    className={`w-full rounded border px-3 py-2 text-sm ${errors.billing?.postcode ? 'border-rose-500' : 'border-gray-300'}`}
                    placeholder="Postcode"
                  />
                  {errors.billing?.postcode && (
                    <p className="mt-1 text-xs text-rose-600">{errors.billing.postcode}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Country <span className="text-rose-600">*</span>
                  </label>
                  <input 
                    type="text"
                    value={billing.country || ''}
                    onChange={(e) => {
                      setBilling({ ...billing, country: e.target.value });
                      if (errors.billing?.country) {
                        setErrors((prev: any) => ({ ...prev, billing: { ...prev.billing, country: undefined } }));
                      }
                    }}
                    className={`w-full rounded border px-3 py-2 text-sm ${errors.billing?.country ? 'border-rose-500' : 'border-gray-300'}`}
                    placeholder="Country"
                  />
                  {errors.billing?.country && (
                    <p className="mt-1 text-xs text-rose-600">{errors.billing.country}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    State <span className="text-rose-600">*</span>
                  </label>
                  <input 
                    type="text"
                    value={billing.state || ''}
                    onChange={(e) => {
                      setBilling({ ...billing, state: e.target.value });
                      if (errors.billing?.state) {
                        setErrors((prev: any) => ({ ...prev, billing: { ...prev.billing, state: undefined } }));
                      }
                    }}
                    className={`w-full rounded border px-3 py-2 text-sm ${errors.billing?.state ? 'border-rose-500' : 'border-gray-300'}`}
                    placeholder="State"
                  />
                  {errors.billing?.state && (
                    <p className="mt-1 text-xs text-rose-600">{errors.billing.state}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Shipping Address Option */}
            <div className="rounded-xl border bg-white p-6">
              <div className="mb-4 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="ship-to-different"
                  checked={shipToDifferentAddress}
                  onChange={(e) => setShipToDifferentAddress(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                />
                <label htmlFor="ship-to-different" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Ship to a different address?
                </label>
              </div>

              {shipToDifferentAddress && (
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      First Name <span className="text-rose-600">*</span>
                    </label>
                    <input 
                      type="text"
                      value={shipping.first_name || ''}
                      onChange={(e) => {
                        const updated = { ...shipping, first_name: e.target.value };
                        setShipping(updated);
                        if (typeof window !== 'undefined') {
                          try {
                            localStorage.setItem('checkout:shipping', JSON.stringify(updated));
                            window.dispatchEvent(new Event('shippingAddressChanged'));
                          } catch {}
                        }
                        if (errors.shipping?.first_name) {
                          setErrors((prev: any) => ({ ...prev, shipping: { ...prev.shipping, first_name: undefined } }));
                        }
                      }}
                      className={`w-full rounded border px-3 py-2 text-sm ${errors.shipping?.first_name ? 'border-rose-500' : 'border-gray-300'}`}
                      placeholder="First name"
                    />
                    {errors.shipping?.first_name && (
                      <p className="mt-1 text-xs text-rose-600">{errors.shipping.first_name}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Last Name <span className="text-rose-600">*</span>
                    </label>
                    <input 
                      type="text"
                      value={shipping.last_name || ''}
                      onChange={(e) => {
                        const updated = { ...shipping, last_name: e.target.value };
                        setShipping(updated);
                        if (typeof window !== 'undefined') {
                          try {
                            localStorage.setItem('checkout:shipping', JSON.stringify(updated));
                            window.dispatchEvent(new Event('shippingAddressChanged'));
                          } catch {}
                        }
                        if (errors.shipping?.last_name) {
                          setErrors((prev: any) => ({ ...prev, shipping: { ...prev.shipping, last_name: undefined } }));
                        }
                      }}
                      className={`w-full rounded border px-3 py-2 text-sm ${errors.shipping?.last_name ? 'border-rose-500' : 'border-gray-300'}`}
                      placeholder="Last name"
                    />
                    {errors.shipping?.last_name && (
                      <p className="mt-1 text-xs text-rose-600">{errors.shipping.last_name}</p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Address <span className="text-rose-600">*</span>
                    </label>
                    <input 
                      type="text"
                      value={shipping.address_1 || ''}
                      onChange={(e) => {
                        const updated = { ...shipping, address_1: e.target.value };
                        setShipping(updated);
                        if (typeof window !== 'undefined') {
                          try {
                            localStorage.setItem('checkout:shipping', JSON.stringify(updated));
                            window.dispatchEvent(new Event('shippingAddressChanged'));
                          } catch {}
                        }
                        if (errors.shipping?.address_1) {
                          setErrors((prev: any) => ({ ...prev, shipping: { ...prev.shipping, address_1: undefined } }));
                        }
                      }}
                      className={`w-full rounded border px-3 py-2 text-sm ${errors.shipping?.address_1 ? 'border-rose-500' : 'border-gray-300'}`}
                      placeholder="Street address"
                    />
                    {errors.shipping?.address_1 && (
                      <p className="mt-1 text-xs text-rose-600">{errors.shipping.address_1}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      City <span className="text-rose-600">*</span>
                    </label>
                    <input 
                      type="text"
                      value={shipping.city || ''}
                      onChange={(e) => {
                        const updated = { ...shipping, city: e.target.value };
                        setShipping(updated);
                        if (typeof window !== 'undefined') {
                          try {
                            localStorage.setItem('checkout:shipping', JSON.stringify(updated));
                            window.dispatchEvent(new Event('shippingAddressChanged'));
                          } catch {}
                        }
                        if (errors.shipping?.city) {
                          setErrors((prev: any) => ({ ...prev, shipping: { ...prev.shipping, city: undefined } }));
                        }
                      }}
                      className={`w-full rounded border px-3 py-2 text-sm ${errors.shipping?.city ? 'border-rose-500' : 'border-gray-300'}`}
                      placeholder="City"
                    />
                    {errors.shipping?.city && (
                      <p className="mt-1 text-xs text-rose-600">{errors.shipping.city}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Postcode <span className="text-rose-600">*</span>
                    </label>
                    <input 
                      type="text"
                      value={shipping.postcode || ''}
                      onChange={(e) => {
                        const updated = { ...shipping, postcode: e.target.value };
                        setShipping(updated);
                        if (typeof window !== 'undefined') {
                          try {
                            localStorage.setItem('checkout:shipping', JSON.stringify(updated));
                            window.dispatchEvent(new Event('shippingAddressChanged'));
                          } catch {}
                        }
                        if (errors.shipping?.postcode) {
                          setErrors((prev: any) => ({ ...prev, shipping: { ...prev.shipping, postcode: undefined } }));
                        }
                      }}
                      className={`w-full rounded border px-3 py-2 text-sm ${errors.shipping?.postcode ? 'border-rose-500' : 'border-gray-300'}`}
                      placeholder="Postcode"
                    />
                    {errors.shipping?.postcode && (
                      <p className="mt-1 text-xs text-rose-600">{errors.shipping.postcode}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Country <span className="text-rose-600">*</span>
                    </label>
                    <input 
                      type="text"
                      value={shipping.country || ''}
                      onChange={(e) => {
                        const updated = { ...shipping, country: e.target.value };
                        setShipping(updated);
                        if (typeof window !== 'undefined') {
                          try {
                            localStorage.setItem('checkout:shipping', JSON.stringify(updated));
                            window.dispatchEvent(new Event('shippingAddressChanged'));
                          } catch {}
                        }
                        if (errors.shipping?.country) {
                          setErrors((prev: any) => ({ ...prev, shipping: { ...prev.shipping, country: undefined } }));
                        }
                      }}
                      className={`w-full rounded border px-3 py-2 text-sm ${errors.shipping?.country ? 'border-rose-500' : 'border-gray-300'}`}
                      placeholder="Country"
                    />
                    {errors.shipping?.country && (
                      <p className="mt-1 text-xs text-rose-600">{errors.shipping.country}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      State <span className="text-rose-600">*</span>
                    </label>
                    <input 
                      type="text"
                      value={shipping.state || ''}
                      onChange={(e) => {
                        const updated = { ...shipping, state: e.target.value };
                        setShipping(updated);
                        if (typeof window !== 'undefined') {
                          try {
                            localStorage.setItem('checkout:shipping', JSON.stringify(updated));
                            window.dispatchEvent(new Event('shippingAddressChanged'));
                          } catch {}
                        }
                        if (errors.shipping?.state) {
                          setErrors((prev: any) => ({ ...prev, shipping: { ...prev.shipping, state: undefined } }));
                        }
                      }}
                      className={`w-full rounded border px-3 py-2 text-sm ${errors.shipping?.state ? 'border-rose-500' : 'border-gray-300'}`}
                      placeholder="State"
                    />
                    {errors.shipping?.state && (
                      <p className="mt-1 text-xs text-rose-600">{errors.shipping.state}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Delivery Authority */}
            <div className="rounded-xl border bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold">Delivery Authority</h2>
              <div className="space-y-3">
                <label className={`flex cursor-pointer items-center gap-3 rounded border p-3 hover:bg-gray-50 transition-colors ${deliveryAuthority === "with_signature" ? "border-gray-900 bg-gray-50" : "border-gray-300"}`}>
                  <input 
                    type="radio" 
                    name="delivery-authority" 
                    value="with_signature" 
                    checked={deliveryAuthority === "with_signature"} 
                    onChange={(e) => setDeliveryAuthority(e.target.value as "with_signature" | "without_signature")} 
                    className="h-4 w-4" 
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">With Signature</div>
                    <div className="text-xs text-gray-600">Require signature on delivery</div>
                  </div>
                </label>

                <label className={`flex cursor-pointer items-center gap-3 rounded border p-3 hover:bg-gray-50 transition-colors ${deliveryAuthority === "without_signature" ? "border-gray-900 bg-gray-50" : "border-gray-300"}`}>
                  <input 
                    type="radio" 
                    name="delivery-authority" 
                    value="without_signature" 
                    checked={deliveryAuthority === "without_signature"} 
                    onChange={(e) => setDeliveryAuthority(e.target.value as "with_signature" | "without_signature")} 
                    className="h-4 w-4" 
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">Without Signature</div>
                    <div className="text-xs text-gray-600">Leave at door (no signature required)</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Delivery Instructions */}
            <div className="rounded-xl border bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold">Delivery Instructions</h2>
              <textarea
                value={deliveryInstructions}
                onChange={(e) => setDeliveryInstructions(e.target.value)}
                placeholder="Add any special delivery instructions (e.g., leave at front door, call on arrival, etc.)"
                rows={4}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>

            {/* Newsletter Subscription */}
            <div className="rounded-xl border bg-white p-6">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={subscribeNewsletter}
                  onChange={(e) => setSubscribeNewsletter(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                />
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-900">Subscribe to our newsletter</div>
                  <div className="mt-1 text-xs text-gray-600">Get updates on new products, special offers, and more</div>
                </div>
              </label>
            </div>
        </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Order Summary */}
            <div className="rounded-xl border bg-white p-6 sticky top-4">
              <h2 className="mb-4 text-lg font-semibold">Order Summary</h2>
              <div className="mb-4 space-y-3 border-b pb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 text-sm">
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded bg-gray-100">
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt={item.name} fill sizes="64px" className="object-cover" />
                          ) : (
                            <div className="grid h-full w-full place-items-center text-xs text-gray-400">No Img</div>
                          )}
                        </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900">{item.name}</div>
                      {item.attributes && Object.keys(item.attributes).length > 0 && (
                        <div className="text-xs text-gray-600">
                          {Object.entries(item.attributes).map(([k, v]) => `${k}: ${v}`).join(", ")}
                        </div>
                      )}
                      {item.sku && <div className="text-xs text-gray-600">SKU: {item.sku}</div>}
                      <div className="mt-1 text-xs text-gray-600">Qty: {item.qty} × ${item.price}</div>
                        </div>
                      </div>
                ))}
                </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">${shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">GST (10%)</span>
                  <span className="font-medium">${gst.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex items-center justify-between text-green-600">
                    <span>Discount</span>
                    <span>−${discount.toFixed(2)}</span>
          </div>
        )}
                <div className="mt-4 border-t pt-3">
                  <div className="flex items-center justify-between text-base">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-lg">${total.toFixed(2)}</span>
              </div>
            </div>
              </div>
            </div>

            {/* Shipping Method */}
            <div className="rounded-xl border bg-white p-6 sticky top-4">
              <h2 className="mb-4 text-lg font-semibold">Shipping Method</h2>
              {rates.length === 0 ? (
                <div className="text-sm text-gray-600">No rates available</div>
              ) : (
                <div className="space-y-2">
                  {rates.map((r) => (
                    <label key={r.id} className={`flex cursor-pointer items-center gap-2 rounded border p-2 text-xs hover:bg-gray-50 transition-colors ${shippingMethod?.id === r.id ? "border-gray-900 bg-gray-50" : "border-gray-300"}`}>
                      <input 
                        type="radio" 
                        name="shipping-sidebar" 
                        value={r.id} 
                        checked={shippingMethod?.id === r.id} 
                        onChange={() => setShippingMethod(r)} 
                        className="h-3 w-3" 
                      />
                      <span className="flex-1 text-xs">
                        <span className="font-medium">{r.label}</span>
                        <span className="ml-1 text-gray-500">({r.zone})</span>
                      </span>
                      <span className="font-semibold text-xs">${Number(r.cost || 0).toFixed(2)}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="rounded-xl border bg-white p-6 sticky top-4">
              <h2 className="mb-4 text-lg font-semibold">Payment Method</h2>
              {enabledPaymentMethods.length === 0 ? (
                <div className="py-4 text-center text-sm text-gray-500">Loading payment methods...</div>
              ) : (
                <div className="space-y-3">
                  {enabledPaymentMethods.map((method) => {
                    const getIcon = (id: string) => {
                      if (id === "stripe" || id === "stripe_cc") {
                        return (
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        );
                      } else if (id === "paypal") {
                        return (
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        );
                      } else if (id === "bacs" || id === "bank_transfer") {
                        return (
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                          </svg>
                        );
                      } else {
                        return (
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        );
                      }
                    };

                    return (
                      <label 
                        key={method.id} 
                        className={`flex cursor-pointer items-center gap-3 rounded border p-3 hover:bg-gray-50 transition-colors ${paymentMethod === method.id ? "border-gray-900 bg-gray-50" : "border-gray-300"}`}
                      >
                        <input 
                          type="radio" 
                          name="payment-method" 
                          value={method.id} 
                          checked={paymentMethod === method.id} 
                          onChange={(e) => {
                            setPaymentMethod(e.target.value);
                            if (user && user.id && billing.email) {
                              fetch("/api/customers/update-payment-method", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  customerId: user.id,
                                  paymentMethod: e.target.value,
                                  billing: billing,
                                }),
                              }).catch(() => {});
                            }
                          }} 
                          className="h-4 w-4" 
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{method.title}</div>
                          {method.description && (
                            <div className="text-xs text-gray-600">{method.description}</div>
                          )}
              </div>
                        {getIcon(method.id)}
                      </label>
                    );
                  })}
          </div>
        )}
            </div>

            {/* Pay Now Button */}
            <div className="rounded-xl border bg-white p-6">
              <button 
                onClick={placeOrder}
                disabled={placing || !paymentMethod || items.length === 0}
                className="w-full rounded-md bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-black disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {placing ? "Processing..." : "Pay Now"}
              </button>
            </div>
          </div>
          </div>
      </div>
    </div>
  );
}
