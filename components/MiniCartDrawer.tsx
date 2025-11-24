"use client";

import { useCart } from "@/components/CartProvider";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import { useEffect, useMemo, useState, useCallback, memo } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import CouponInput from "./CouponInput";
import { useCoupon } from "./CouponProvider";
import ShippingOptions from "./ShippingOptions";
import { useShippingAddress } from "@/hooks/useShippingAddress";
import { parseCartTotal, calculateTotal } from "@/lib/cart-utils";
import { formatPrice } from "@/lib/format-utils";
import { getDeliveryFrequencyLabel } from "@/lib/delivery-utils";

// Dynamically import RequestQuoteModal - only needed when quote button is clicked
// Using a function to ensure stable module resolution during HMR
const RequestQuoteModal = dynamic(
  () => import("@/components/RequestQuoteModal"),
  {
    ssr: false, // Client-side only modal
    loading: () => null, // No loading state needed for modal
  }
);

// Memoized cart item component to prevent unnecessary re-renders
const CartItem = memo(({ item, onRemove, onUpdateQty }: { item: any; onRemove: (id: string) => void; onUpdateQty: (id: string, qty: number) => void }) => {
  const handleQtyChange = (newQty: number) => {
    const qty = Math.max(1, Math.floor(newQty));
    onUpdateQty(item.id, qty);
  };

  const handleDecrement = () => {
    if (item.qty > 1) {
      onUpdateQty(item.id, item.qty - 1);
    }
  };

  const handleIncrement = () => {
    onUpdateQty(item.id, item.qty + 1);
  };

  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-gray-200">
        {item.imageUrl && item.imageUrl.trim() !== '' ? (
          <Image src={item.imageUrl} alt={item.name} fill sizes="64px" className="object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-xs text-gray-400">No Image</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-0.5">{item.name}</h3>
        {item.sku && (
          <p className="text-xs text-gray-500 mb-1">SKU: {item.sku}</p>
        )}
        {item.attributes && Object.keys(item.attributes).length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {Object.entries(item.attributes).map(([k, v]) => (
              <span key={k} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-200 text-gray-700">
                {k}: {v}
              </span>
            ))}
          </div>
        )}
        {item.deliveryPlan && item.deliveryPlan !== 'none' && (
          <div className="text-xs text-gray-600 mb-1.5">
            <span className="inline-flex items-center gap-1">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {getDeliveryFrequencyLabel(item.deliveryPlan)}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between mt-1.5 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">Qty:</span>
            <div className="flex items-center border border-gray-300 rounded-md">
              <button
                onClick={handleDecrement}
                disabled={item.qty <= 1}
                className="px-2 py-1 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Decrease quantity"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <input
                type="number"
                min="1"
                value={item.qty}
                onChange={(e) => handleQtyChange(Number(e.target.value))}
                className="w-12 text-center text-sm font-medium text-gray-900 border-0 focus:ring-0 focus:outline-none py-1"
              />
              <button
                onClick={handleIncrement}
                className="px-2 py-1 text-gray-600 hover:bg-gray-200 transition-colors"
                aria-label="Increase quantity"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">{formatPrice(Number(item.price) * item.qty)}</span>
            <button 
              onClick={() => onRemove(item.id)} 
              className="rounded p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" 
              aria-label="Remove item"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

CartItem.displayName = 'CartItem';

export default function MiniCartDrawer() {
    const { isOpen, close, items, total, removeItem, updateItemQty, clear } = useCart();
    const { user } = useAuth();
    const { discount, appliedCoupon, calculateDiscount } = useCoupon();

    const [selectedRateId, setSelectedRateId] = useState<string>("");
    const [selectedShippingRate, setSelectedShippingRate] = useState<{ cost: number; label: string } | null>(null);
    const [showQuoteModal, setShowQuoteModal] = useState(false);
    const { country: shippingCountry, zone: shippingZone } = useShippingAddress();

    const subtotal = useMemo(() => parseCartTotal(total), [total]);
    const shippingAmount = selectedShippingRate ? selectedShippingRate.cost : 0;
    const couponDiscount = discount || 0;
    const grandTotal = useMemo(() => calculateTotal(subtotal, shippingAmount, couponDiscount), [subtotal, shippingAmount, couponDiscount]);
    
    // Memoize handlers to prevent CartItem re-renders
    const handleRemove = useCallback((id: string) => {
        removeItem(id);
    }, [removeItem]);

    const handleUpdateQty = useCallback((id: string, qty: number) => {
        updateItemQty(id, qty);
    }, [updateItemQty]);
    

    // Combined discount effects
    useEffect(() => {
        if (appliedCoupon && items.length > 0 && isOpen) {
            calculateDiscount(items, subtotal);
        }
    }, [items, total, appliedCoupon, calculateDiscount, isOpen, subtotal]);

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
				<aside className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl transition-transform duration-300 ease-out flex flex-col overflow-hidden ${isOpen ? "translate-x-0" : "translate-x-full"}`} suppressHydrationWarning>
					{/* Header - Compact */}
					<div className="bg-gradient-to-r from-gray-900 to-gray-800 px-4 py-3 flex items-center justify-between flex-shrink-0" suppressHydrationWarning>
						<div>
							<h2 className="text-base font-bold text-white">Cart</h2>
							<p className="text-xs text-gray-300">{items.length} {items.length === 1 ? 'item' : 'items'}</p>
						</div>
						<button 
							onClick={close} 
							aria-label="Close" 
							className="rounded p-1.5 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
						>
							<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>

					{/* Cart Items - Scrollable */}
					<div className="flex-1 overflow-y-auto min-h-0" suppressHydrationWarning>
						{items.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-16 px-4 text-center" suppressHydrationWarning>
								<div className="mb-3 rounded-full bg-gray-100 p-5">
									<svg className="h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
									</svg>
								</div>
								<p className="text-gray-500 font-medium mb-0.5">Your cart is empty</p>
								<p className="text-sm text-gray-400">Add items to get started</p>
							</div>
						) : (
							<div className="p-3 space-y-2">
								{items.map((it) => (
									<CartItem key={it.id} item={it} onRemove={handleRemove} onUpdateQty={handleUpdateQty} />
								))}
							</div>
						)}
					</div>

					{/* Summary Section - Fixed at bottom, Compact */}
					{items.length > 0 && (
						<div className="border-t bg-gray-50 flex-shrink-0" suppressHydrationWarning>
							<div className="p-3 space-y-3">
								{/* Shipping Options - Always Visible */}
								{isOpen && items.length > 0 && (
									<ShippingOptions
										country={shippingCountry}
										zone={shippingZone}
										subtotal={subtotal}
										items={items}
										selectedRateId={selectedRateId}
										onRateChange={(rateId, rate) => {
											setSelectedRateId(rateId);
											setSelectedShippingRate({ cost: rate.cost, label: rate.label });
										}}
										showLabel={true}
										className=""
									/>
								)}

								{/* Coupon - Compact */}
								<CouponInput />

								{/* Totals - Compact */}
								<div className="bg-white rounded-lg border border-gray-200 p-3 space-y-1.5">
									<div className="flex items-center justify-between text-xs">
										<span className="text-gray-600">Subtotal</span>
										<span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
									</div>
									<div className="flex items-center justify-between text-xs">
										<span className="text-gray-600">Shipping</span>
										<span className="font-medium text-gray-900">{formatPrice(shippingAmount)}</span>
									</div>
									{couponDiscount > 0 && (
										<div className="flex items-center justify-between text-xs text-emerald-600">
											<span>Discount</span>
											<span className="font-medium">−{formatPrice(couponDiscount)}</span>
										</div>
									)}
									<div className="pt-1.5 border-t border-gray-200">
										<div className="flex items-center justify-between">
											<span className="text-sm font-bold text-gray-900">Total</span>
											<span className="text-lg font-bold text-teal-600">{formatPrice(grandTotal)}</span>
										</div>
									</div>
								</div>

								{/* Action Buttons - Compact */}
								<div className="flex items-center gap-2">
									<button 
										onClick={clear} 
										className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
									>
										Clear
									</button>
									{user && (
										<button 
											onClick={() => setShowQuoteModal(true)} 
											className="flex-1 rounded-lg border-2 border-teal-600 bg-white px-3 py-2 text-xs font-semibold text-teal-600 hover:bg-teal-50 transition-colors"
										>
											Quote
										</button>
									)}
								</div>
								
								{/* Checkout Button - Compact */}
								<Link
									href="/checkout"
									onClick={close}
									className="block w-full rounded-lg bg-gradient-to-r from-gray-900 to-gray-800 px-3 py-2.5 text-center text-sm font-semibold text-white hover:from-black hover:to-gray-900 transition-all shadow-md hover:shadow-lg"
								>
									Checkout
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
				shippingMethod={selectedShippingRate?.label || ''}
				discount={couponDiscount}
				grandTotal={grandTotal}
			/>
		</>
	);
}
