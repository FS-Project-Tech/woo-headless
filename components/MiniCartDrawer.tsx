"use client";

import { useCart } from "@/components/CartProvider";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import RequestQuoteModal from "@/components/RequestQuoteModal";

interface ShippingRate { id: string; label: string; cost: number }

export default function MiniCartDrawer() {
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
    const [showQuoteModal, setShowQuoteModal] = useState(false);

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
                    if (address.country === 'AU' || address.country === 'Australia') {
                        setShippingZone('Australia');
                    } else {
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
    }, [isOpen, shippingCountry, shippingZone]);

    useEffect(() => {
        setDiscount((d) => d > subtotal + shippingAmount ? subtotal + shippingAmount : d);
    }, [subtotal, shippingAmount]);

    const applyCoupon = () => {
        const code = coupon.trim().toUpperCase();
        if (!code) return;
        if (code === "SAVE10") {
            const d = parseFloat((subtotal * 0.10).toFixed(2));
            setDiscount(d);
            setAppliedCoupon(code);
            try { sessionStorage.setItem("applied_coupon", code); } catch {}
        } else if (code === "FREESHIP") {
            setDiscount(0);
            setAppliedCoupon(code);
            try { sessionStorage.setItem("applied_coupon", code); } catch {}
            if (rates.length > 0) setSelectedRateId(rates[0].id);
        } else {
            setDiscount(0);
            setAppliedCoupon(code);
            try { sessionStorage.setItem("applied_coupon", code); } catch {}
        }
    };

	return (
		<>
			<div className={`fixed inset-0 z-50 ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`} aria-hidden={!isOpen} suppressHydrationWarning>
				{/* Backdrop */}
				<div
					className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}
					onClick={close}
					suppressHydrationWarning
				/>
				
				{/* Panel */}
				<aside className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"}`} suppressHydrationWarning>
					{/* Header */}
					<div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-4 flex items-center justify-between" suppressHydrationWarning>
						<div>
							<h2 className="text-lg font-bold text-white">Shopping Cart</h2>
							<p className="text-xs text-gray-300 mt-0.5">{items.length} {items.length === 1 ? 'item' : 'items'}</p>
						</div>
						<button 
							onClick={close} 
							aria-label="Close" 
							className="rounded-lg p-2 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
						>
							<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>

					{/* Cart Items */}
					<div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 420px)' }} suppressHydrationWarning>
						{items.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-20 px-4 text-center" suppressHydrationWarning>
								<div className="mb-4 rounded-full bg-gray-100 p-6">
									<svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
									</svg>
								</div>
								<p className="text-gray-500 font-medium mb-1">Your cart is empty</p>
								<p className="text-sm text-gray-400">Add items to get started</p>
							</div>
						) : (
							<div className="p-4 space-y-3">
								{items.map((it) => (
									<div key={it.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
										<div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-200">
											{it.imageUrl ? (
												<Image src={it.imageUrl} alt={it.name} fill sizes="80px" className="object-cover" />
											) : (
												<div className="grid h-full w-full place-items-center text-xs text-gray-400">No Image</div>
											)}
										</div>
										<div className="flex-1 min-w-0">
											<h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">{it.name}</h3>
											{it.sku && (
												<p className="text-xs text-gray-500 mb-1">SKU: {it.sku}</p>
											)}
											{it.attributes && Object.keys(it.attributes).length > 0 && (
												<div className="flex flex-wrap gap-2 mb-2">
													{Object.entries(it.attributes).map(([k, v]) => (
														<span key={k} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700">
															{k}: {v}
														</span>
													))}
												</div>
											)}
											{it.deliveryPlan && it.deliveryPlan !== 'none' && (
												<div className="text-xs text-gray-600 mb-2">
													<span className="inline-flex items-center gap-1">
														<svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
														</svg>
														{it.deliveryPlan === '7' ? 'Every 7 days' : it.deliveryPlan === '14' ? 'Every 14 days' : 'Every month'}
													</span>
												</div>
											)}
											<div className="flex items-center justify-between mt-2">
												<span className="text-sm font-semibold text-gray-900">${it.price} × {it.qty}</span>
												<button 
													onClick={() => removeItem(it.id)} 
													className="rounded-lg p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" 
													aria-label="Remove item"
												>
													<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
													</svg>
												</button>
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</div>

					{/* Summary Section */}
					{items.length > 0 && (
						<div className="border-t bg-gray-50" suppressHydrationWarning>
							<div className="p-4 space-y-4">
								{/* Shipping Options */}
								<div>
									<label className="block text-sm font-semibold text-gray-900 mb-2">Shipping Options</label>
									{loadingRates && (
										<div className="flex items-center gap-2 text-sm text-gray-500">
											<svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
												<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
												<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
											</svg>
											<span>Loading rates…</span>
										</div>
									)}
									{!loadingRates && rates.length === 0 && (
										<div className="text-sm text-gray-500">No shipping rates found</div>
									)}
									<div className="space-y-2 mt-2">
										{rates.map((r) => (
											<label key={r.id} className="flex cursor-pointer items-center gap-3 p-3 rounded-lg border-2 transition-all hover:bg-white hover:border-teal-300" style={{ borderColor: selectedRateId === r.id ? '#14b8a6' : '#e5e7eb' }}>
												<input 
													type="radio" 
													name="shipping-rate" 
													value={r.id} 
													checked={selectedRateId === r.id} 
													onChange={() => setSelectedRateId(r.id)} 
													className="h-4 w-4 text-teal-600 focus:ring-teal-500" 
												/>
												<span className="flex-1 text-sm font-medium text-gray-900">{r.label}</span>
												<span className="text-sm font-semibold text-gray-900">${r.cost.toFixed(2)}</span>
											</label>
										))}
									</div>
								</div>

								{/* Coupon */}
								<div>
									<label className="block text-sm font-semibold text-gray-900 mb-2">Coupon Code</label>
									<div className="flex gap-2">
										<input 
											value={coupon} 
											onChange={(e) => setCoupon(e.target.value)} 
											placeholder="Enter code" 
											className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" 
										/>
										<button 
											onClick={applyCoupon} 
											className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black transition-colors"
										>
											Apply
										</button>
									</div>
									{appliedCoupon && (
										<div className="mt-2 flex items-center gap-2 text-xs">
											<span className="inline-flex items-center px-2 py-1 rounded bg-emerald-100 text-emerald-800 font-medium">
												✓ Applied: {appliedCoupon}
											</span>
											{discount > 0 && (
												<span className="text-emerald-600 font-semibold">−${discount.toFixed(2)}</span>
											)}
										</div>
									)}
								</div>

								{/* Totals */}
								<div className="bg-white rounded-lg border border-gray-200 p-4 space-y-2">
									<div className="flex items-center justify-between text-sm">
										<span className="text-gray-600">Subtotal</span>
										<span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
									</div>
									<div className="flex items-center justify-between text-sm">
										<span className="text-gray-600">Shipping</span>
										<span className="font-medium text-gray-900">${shippingAmount.toFixed(2)}</span>
									</div>
									{discount > 0 && (
										<div className="flex items-center justify-between text-sm text-emerald-600">
											<span>Discount</span>
											<span className="font-medium">−${discount.toFixed(2)}</span>
										</div>
									)}
									<div className="pt-2 border-t border-gray-200">
										<div className="flex items-center justify-between">
											<span className="text-base font-bold text-gray-900">Total</span>
											<span className="text-xl font-bold text-teal-600">${grandTotal.toFixed(2)}</span>
										</div>
									</div>
								</div>

								{/* Action Buttons */}
								<div className="flex items-center gap-2 pt-2">
									<button 
										onClick={clear} 
										className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
									>
										Clear Cart
									</button>
									{user && (
										<button 
											onClick={() => setShowQuoteModal(true)} 
											className="flex-1 rounded-lg border-2 border-teal-600 bg-white px-4 py-2.5 text-sm font-semibold text-teal-600 hover:bg-teal-50 transition-colors"
										>
											Request Quote
										</button>
									)}
								</div>
								
								{/* Checkout Button */}
								<Link
									href="/checkout"
									onClick={close}
									className="block w-full rounded-lg bg-gradient-to-r from-gray-900 to-gray-800 px-4 py-3 text-center text-sm font-semibold text-white hover:from-black hover:to-gray-900 transition-all shadow-lg hover:shadow-xl"
								>
									Proceed to Checkout
								</Link>
							</div>
						</div>
					)}
				</aside>
			</div>

			{/* Request Quote Modal */}
			<RequestQuoteModal 
				isOpen={showQuoteModal} 
				onClose={() => setShowQuoteModal(false)}
				shippingAmount={shippingAmount}
				shippingMethod={selectedRate?.label || ''}
				discount={discount}
				grandTotal={grandTotal}
			/>
		</>
	);
}
