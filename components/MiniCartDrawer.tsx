"use client";

import { useCart } from "@/components/CartProvider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/components/AuthProvider";
import { getCheckoutUrl } from "@/lib/access-token";

interface ShippingRate { id: string; label: string; cost: number }

export default function MiniCartDrawer() {
    const router = useRouter();
    const { isOpen, close, items, total, removeItem, clear } = useCart();
    const { user } = useAuth();

    const [rates, setRates] = useState<ShippingRate[]>([]);
    const [selectedRateId, setSelectedRateId] = useState<string>("");
    const [loadingRates, setLoadingRates] = useState(false);
    const [coupon, setCoupon] = useState<string>("");
    const [appliedCoupon, setAppliedCoupon] = useState<string>("");
    const [discount, setDiscount] = useState<number>(0);
    const [shippingCountry, setShippingCountry] = useState<string>("AU");
    const [shippingZone, setShippingZone] = useState<string>("Australia");

    const subtotal = useMemo(() => parseFloat(total || "0"), [total]);
    const selectedRate = useMemo(() => rates.find(r => r.id === selectedRateId) || null, [rates, selectedRateId]);
    const shippingAmount = selectedRate ? selectedRate.cost : 0;
    const grandTotal = useMemo(() => Math.max(0, subtotal + shippingAmount - discount), [subtotal, shippingAmount, discount]);
    
    // Load shipping address from localStorage on mount
    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const saved = localStorage.getItem('checkout:shipping');
            if (saved) {
                const address = JSON.parse(saved);
                if (address.country) {
                    setShippingCountry(address.country);
                    // Map country to zone name (default to Australia)
                    if (address.country === 'AU' || address.country === 'Australia') {
                        setShippingZone('Australia');
                    } else {
                        // For other countries, try to find matching zone or default to first available
                        setShippingZone('');
                    }
                }
            }
        } catch {}
    }, []);

    // Listen for address changes from checkout
    useEffect(() => {
        if (typeof window === 'undefined') return;
        
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'checkout:shipping') {
                try {
                    const address = e.newValue ? JSON.parse(e.newValue) : null;
                    if (address && address.country) {
                        setShippingCountry(address.country);
                        if (address.country === 'AU' || address.country === 'Australia') {
                            setShippingZone('Australia');
                        } else {
                            setShippingZone('');
                        }
                    }
                } catch {}
            }
        };

        window.addEventListener('storage', handleStorageChange);
        
        // Also listen for custom event (for same-tab updates)
        const handleAddressChange = () => {
            try {
                const saved = localStorage.getItem('checkout:shipping');
                if (saved) {
                    const address = JSON.parse(saved);
                    if (address && address.country) {
                        setShippingCountry(address.country);
                        if (address.country === 'AU' || address.country === 'Australia') {
                            setShippingZone('Australia');
                        } else {
                            setShippingZone('');
                        }
                    }
                }
            } catch {}
        };

        window.addEventListener('shippingAddressChanged', handleAddressChange);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('shippingAddressChanged', handleAddressChange);
        };
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        // Fetch shipping rates based on country/zone
        (async () => {
            try {
                setLoadingRates(true);
                const params = new URLSearchParams();
                if (shippingCountry) params.set('country', shippingCountry);
                if (shippingZone) params.set('zone', shippingZone);
                
                const res = await fetch(`/api/shipping/rates?${params.toString()}`, { cache: 'no-store' });
                const json = await res.json();
                const fetched: ShippingRate[] = Array.isArray(json.rates) ? json.rates : [];
                setRates(fetched);
                if (fetched.length > 0) {
                    setSelectedRateId(fetched[0].id);
                } else {
                    setSelectedRateId("");
                }
            } catch {
                setRates([]);
                setSelectedRateId("");
            } finally {
                setLoadingRates(false);
            }
        })();
    }, [isOpen, user, shippingCountry, shippingZone]);

    useEffect(() => {
        // Ensure discount does not exceed subtotal + shipping
        setDiscount((d) => d > subtotal + shippingAmount ? subtotal + shippingAmount : d);
    }, [subtotal, shippingAmount]);

    const applyCoupon = () => {
        const code = coupon.trim().toUpperCase();
        if (!code) return;
        // Example logic: SAVE10 => 10% off products
        if (code === "SAVE10") {
            const d = parseFloat((subtotal * 0.10).toFixed(2));
            setDiscount(d);
            setAppliedCoupon(code);
            try { sessionStorage.setItem("applied_coupon", code); } catch {}
        } else if (code === "FREESHIP") {
            // Simulate free shipping by zeroing out shipping
            setDiscount(0);
            setAppliedCoupon(code);
            try { sessionStorage.setItem("applied_coupon", code); } catch {}
            // Optionally, select the cheapest rate to avoid confusion
            if (rates.length > 0) setSelectedRateId(rates[0].id);
        } else {
            // Unknown coupon resets
            setDiscount(0);
            setAppliedCoupon(code);
            try { sessionStorage.setItem("applied_coupon", code); } catch {}
        }
    };

    // Checkout flow removed per request; cart UI only.

	return (
		<div className={`fixed inset-0 z-50 ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`} aria-hidden={!isOpen}>
			{/* Backdrop */}
			<div
				className={`absolute inset-0 bg-black/40 transition-opacity ${isOpen ? "opacity-100" : "opacity-0"}`}
				onClick={close}
			/>
			{/* Panel */}
			<aside className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transition-transform ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
				<div className="flex items-center justify-between border-b px-4 py-3">
					<h2 className="text-base font-semibold">Your Cart</h2>
					<button onClick={close} aria-label="Close" className="rounded p-2 hover:bg-gray-50">✕</button>
				</div>

                <div className="max-h-[calc(100vh-320px)] overflow-y-auto p-4">
					{items.length === 0 ? (
						<div className="py-20 text-center text-gray-500">Cart empty</div>
					) : (
						<ul className="space-y-4">
							{items.map((it) => (
								<li key={it.id} className="flex items-start gap-3">
									<div className="relative h-16 w-16 overflow-hidden rounded bg-gray-100">
										{it.imageUrl ? (
											<Image src={it.imageUrl} alt={it.name} fill sizes="64px" className="object-cover" />
										) : (
											<div className="grid h-full w-full place-items-center text-xs text-gray-400">No Image</div>
										)}
									</div>
									<div className="flex-1">
										<div className="line-clamp-2 text-sm font-medium text-gray-900">{it.name}</div>
										<div className="mt-1 text-xs text-gray-500">SKU: {it.sku || "N/A"}</div>
										{it.attributes && Object.keys(it.attributes).length > 0 && (
											<div className="mt-1 text-xs text-gray-600">
												{Object.entries(it.attributes).map(([k, v]) => (
													<span key={k} className="mr-3">{k}: <span className="font-medium text-gray-800">{v}</span></span>
												))}
											</div>
										)}
										{it.deliveryPlan && it.deliveryPlan !== 'none' && (
											<div className="mt-1 text-xs text-gray-600">Delivery: {it.deliveryPlan === '7' ? 'Every 7 days' : it.deliveryPlan === '14' ? 'Every 14 days' : 'Every month'}</div>
										)}
										<div className="mt-1 text-sm text-gray-900">${it.price} × {it.qty}</div>
									</div>
									<button onClick={() => removeItem(it.id)} className="rounded p-2 text-gray-600 hover:bg-gray-50" aria-label="Remove">✕</button>
								</li>
							))}
						</ul>
					)}
				</div>

				{/* Summary */}
				<div className="border-t px-4 py-3 space-y-3">
					{items.length > 0 && (
						<>
							{/* Shipping */}
							<div>
								<div className="mb-1 text-sm font-medium text-gray-700">Shipping options</div>
								{loadingRates && <div className="text-sm text-gray-500">Loading rates…</div>}
								{!loadingRates && rates.length === 0 && (
									<div className="text-sm text-gray-500">No shipping rates found</div>
								)}
								<div className="space-y-2">
									{rates.map((r) => (
										<label key={r.id} className="flex cursor-pointer items-center gap-3 text-sm">
											<input type="radio" name="shipping-rate" value={r.id} checked={selectedRateId === r.id} onChange={() => setSelectedRateId(r.id)} className="h-4 w-4" />
											<span className="flex-1">{r.label}</span>
											<span className="font-medium">${r.cost.toFixed(2)}</span>
										</label>
									))}
								</div>
							</div>

							{/* Coupon */}
							<div>
								<label className="mb-1 block text-sm font-medium text-gray-700">Coupon</label>
								<div className="flex gap-2">
									<input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="Enter code" className="flex-1 rounded border px-3 py-2 text-sm" />
									<button onClick={applyCoupon} className="rounded bg-gray-900 px-3 py-2 text-sm text-white hover:bg-black">Apply</button>
								</div>
								{appliedCoupon && (
									<div className="mt-1 text-xs text-gray-600">Applied: <span className="font-medium">{appliedCoupon}</span> {discount > 0 ? `(−$${discount.toFixed(2)})` : null}</div>
								)}
							</div>

							{/* Totals */}
							<div className="space-y-1 text-sm">
								<div className="flex items-center justify-between"><span className="text-gray-600">Subtotal</span><span className="font-medium">${subtotal.toFixed(2)}</span></div>
								<div className="flex items-center justify-between"><span className="text-gray-600">Shipping</span><span className="font-medium">${shippingAmount.toFixed(2)}</span></div>
								{discount > 0 && <div className="flex items-center justify-between text-rose-600"><span>Discount</span><span>−${discount.toFixed(2)}</span></div>}
								<div className="mt-1 flex items-center justify-between text-base"><span className="font-semibold">Total</span><span className="font-bold">${grandTotal.toFixed(2)}</span></div>
							</div>

							<div className="flex items-center justify-between gap-2 pt-1">
								<button onClick={clear} className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50">Clear</button>
								<div className="flex-1" />
								{user && (
									<button onClick={() => window.location.href = "/account?request_quote=1"} className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50">Request a quote</button>
								)}
							</div>
						</>
					)}

                    <div className="flex items-center justify-between gap-2">
                        <button
                            onClick={() => {
                                close();
                                // Generate token and navigate to checkout
                                const checkoutUrl = getCheckoutUrl();
                                router.push(checkoutUrl);
                            }}
                            className="flex-1 rounded-md bg-gray-900 px-3 py-2 text-center text-sm font-medium text-white hover:bg-black"
                        >
                            Checkout
                        </button>
                    </div>
				</div>
			</aside>
		</div>
	);
}
