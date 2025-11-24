"use client";

import type { WooCommerceProduct, WooCommerceVariation } from "@/lib/woocommerce";
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import VariationSwatches from "@/components/VariationSwatches";
import ProductVariations from "@/components/ProductVariations";
import RecurringSelect, { RecurringPlan } from "@/components/RecurringSelect";
import ServiceFeatures from "@/components/ServiceFeatures";
import { useCart } from "@/components/CartProvider";
import { useWishlist } from "@/hooks/useWishlist";
import { useToast } from "@/components/ToastProvider";
import { useAuth } from "@/components/AuthProvider";

function pushViewedProduct(productId: number, categoryIds: number[]) {
    try {
        if (typeof window === 'undefined') return;
        const key = '_viewed_products';
        const raw = window.localStorage.getItem(key);
        const list: Array<{ id: number; cats: number[] }> = raw ? JSON.parse(raw) : [];
        const next = [{ id: productId, cats: categoryIds }, ...list.filter((x) => x.id !== productId)].slice(0, 20);
        window.localStorage.setItem(key, JSON.stringify(next));
    } catch {}
}

export default function ProductDetailPanel({ product, variations }: { product: WooCommerceProduct; variations: WooCommerceVariation[] }) {
	const [plan, setPlan] = useState<RecurringPlan>("none");
	const [selected, setSelected] = useState<{ [name: string]: string }>({});
	const [currentSku, setCurrentSku] = useState<string | null>(product.sku || null);
	const [matchedVariation, setMatchedVariation] = useState<WooCommerceVariation | null>(null);
	const matched = useMemo(() => matchVariation(variations, selected), [variations, selected]);

// variable attribute definitions for swatches
const attributes = useMemo(() => {
    return (product.attributes || [])
        .filter((a: any) => (a?.variation ?? false) && Array.isArray(a.options))
        .map((a: any) => ({ name: a.name as string, options: a.options as string[] }));
}, [product.attributes]);

	const brand = findBrand(product);

	const displayPrice = matchedVariation?.price || matched?.price || product.price;
	const displayRegular = matchedVariation?.regular_price || matched?.regular_price || product.regular_price;
	const onSale = matchedVariation ? matchedVariation.on_sale : (matched ? matched.on_sale : product.on_sale);
    const { addItem, open: openCart } = useCart();
    const { wishlist, addToWishlist, removeFromWishlist, isAdding, isRemoving } = useWishlist();
    const { success, error: showError } = useToast();
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [quantity, setQuantity] = useState<number>(1);
    const [wishlisted, setWishlisted] = useState<boolean>(false);
    const [addingToCart, setAddingToCart] = useState(false);

	// Check if product is in wishlist on mount and when wishlist changes
	useEffect(() => {
		setWishlisted(wishlist.includes(product.id));
	}, [wishlist, product.id]);

    // Track viewed product in localStorage
    useEffect(() => {
        const catIds = (product.categories || []).map((c) => c.id);
        pushViewedProduct(product.id, catIds);
    }, [product.id, product.categories]);

	const handleWishlistToggle = async () => {
		if (isAdding || isRemoving) return;

		// Check if user is logged in (wait for auth to finish loading)
		if (authLoading) {
			return; // Wait for auth to load
		}
		if (!user) {
			showError("Please login to add items to your wishlist");
			// Use window.location.href instead of router.push to avoid extension interference
			window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
			return;
		}

		try {
			if (wishlisted) {
				await removeFromWishlist(product.id);
				setWishlisted(false);
				success("Product removed from wishlist");
			} else {
				await addToWishlist(product.id);
				setWishlisted(true);
				success("Product added to wishlist");
			}
		} catch (error: any) {
			// Handle extension interference gracefully
			if (error?.message?.includes('chrome-extension') ||
				error?.message?.includes('Failed to fetch')) {
				showError("Action blocked by browser extension. Please try again.");
			} else {
				console.error('Wishlist error:', error);
				const errorMessage = error?.message || error?.error || "Failed to update wishlist";
				showError(errorMessage);
			}
		}
	};

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
				<div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
					<span>SKU: {currentSku || product.sku || "N/A"}</span>
					{brand && <span>Brand: {brand}</span>}
					{product.categories && product.categories.length > 0 && (
						<span>Category: {product.categories.map((c) => c.name).join(", ")}</span>
					)}
				</div>
			</div>

			<div className="flex items-center gap-4">
				{/* GST-aware pricing */}
				<div className="text-gray-900">
					{(() => {
						const raw = Number(displayPrice || 0);
						const reg = Number(displayRegular || 0);
						const taxClassSlug = String(product.tax_class || "").toLowerCase().replace(/\s+/g, "-");
						const isGst10 = taxClassSlug === "gst-10" || taxClassSlug === "gst10" || taxClassSlug === "gst";
						const isGstFree = taxClassSlug === "gst-free" || taxClassSlug === "gstfree";

						if (!isNaN(raw) && raw > 0) {
							if (isGst10) {
								const excl = raw;
								const incl = raw * 1.10;
								return (
									<div className="space-y-0.5">
										<div className="text-2xl font-semibold text-[#1f605f]">Incl. GST: ${incl.toFixed(2)}</div>
										<div className="text-sm text-[#1f605f]">Excl. GST: ${excl.toFixed(2)}</div>
									</div>
								);
							}
							if (isGstFree) {
								return (
									<div className="space-y-1">
										<div className="text-2xl font-semibold text-[#1f605f]">${raw.toFixed(2)}</div>
										<div className="text-[11px] inline-flex items-center rounded bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">GST FREE</div>
									</div>
								);
							}
						}
						return <span className="text-2xl font-semibold text-[#1f605f]">${displayPrice}</span>;
					})()}
				</div>
				{/* Regular price and sale badge */}
				<div className="flex items-center gap-3">
					{displayRegular && displayRegular !== displayPrice && (
						<span className="text-lg text-gray-500 line-through">${displayRegular}</span>
					)}
					{onSale && <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">Sale</span>}
				</div>
			</div>

			{/* Variations as swatches (inline) */}
            {attributes.length > 0 && (
				<ProductVariations
					attributes={attributes}
					variations={variations}
					onVariationChange={(variation, selectedAttributes) => {
						setMatchedVariation(variation);
						setSelected(selectedAttributes);
						// Reset SKU to product SKU if no variation matched
						if (!variation) {
							setCurrentSku(product.sku || null);
						}
					}}
					onSkuChange={(sku) => {
						setCurrentSku(sku || product.sku || null);
					}}
					style="swatches"
				/>
			)}

			<RecurringSelect onChange={setPlan} value={plan} />

            {/* Quantity */}
            <div className="flex items-center gap-3">
                <label className="text-sm text-gray-700">Quantity</label>
                <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                    className="w-24 rounded border px-3 py-2"
                />
            </div>

            {/* Consult Before Buying Button */}
            <div className="pt-2">
                <Link
                    href={`/products/${product.slug}/consult`}
                    className="block w-full text-center rounded-md border-2 border-[#1f605f] bg-transparent px-4 py-3 text-sm font-medium text-[#1f605f] transition hover:bg-[#1f605f] hover:text-white mb-3"
                >
                    Consult Before Buying
                </Link>
            </div>

            <div className="pt-2 flex items-center gap-3">
				<button
					onClick={async () => {
						if (addingToCart) return;
						if (attributes.length > 0 && !isAllSelected(selected, attributes)) return;

						setAddingToCart(true);
						try {
							// Simulate API call delay (replace with actual cart API call if needed)
							await new Promise(resolve => setTimeout(resolve, 500));

							const variationId = matchedVariation?.id || matched?.id;
							addItem({
								productId: product.id,
								variationId,
								name: product.name,
								slug: product.slug,
								imageUrl: product.images?.[0]?.src,
								price: (matchedVariation?.price || matched?.price || product.price) || "0",
								qty: quantity,
								sku: matchedVariation?.sku || matched?.sku || product.sku || undefined,
								attributes: selected,
								deliveryPlan: plan,
							});

							// Open mini cart drawer
							openCart();
							
							// Show success toast
							success("Product added to cart");
						} catch (error) {
							console.error('Error adding to cart:', error);
						} finally {
							setAddingToCart(false);
						}
					}}
                    disabled={attributes.length > 0 && !isAllSelected(selected, attributes) || addingToCart}
                    className="btn-brand flex-1 rounded-md px-4 py-3 text-white transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
				>
					{addingToCart ? (
						<>
							<svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
								<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
								<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							<span>Adding...</span>
						</>
					) : (
						<span>Add to Cart</span>
					)}
				</button>
                <button
                    aria-label="Add to wishlist"
                    onClick={handleWishlistToggle}
                    disabled={isAdding || isRemoving}
                    className={`rounded p-3 transition ${wishlisted ? "text-rose-600" : "text-gray-600 hover:bg-gray-50"} ${isAdding || isRemoving ? "opacity-50 cursor-not-allowed" : ""}`}
                    title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                >
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
                    </svg>
                </button>
            </div>
            {attributes.length > 0 && !isAllSelected(selected, attributes) && (
                <p className="text-sm text-red-600">Please select all variations before adding to cart.</p>
            )}

			{/* Service Features Section */}
			<div className="pt-6 border-t border-gray-200">
				<ServiceFeatures />
			</div>

		</div>
	);
}

function matchVariation(variations: WooCommerceVariation[], selected: { [name: string]: string }) {
	const names = Object.keys(selected);
	if (names.length === 0) return null;
	return (
		variations.find((v) => names.every((n) => v.attributes.some((a) => eq(a.name, n) && eq(a.option, selected[n])))) || null
	);
}

function findBrand(product: WooCommerceProduct): string | null {
	// Try to read brand from attributes commonly named 'Brand' or 'pa_brand'
	const attr = (product.attributes || []).find((a: any) => eq(a.name, "brand") || eq(a.name, "pa_brand") || eq(a.name, "Brand"));
	if (attr) {
		const opts = (attr.options as string[]) || [];
		if (opts.length > 0) return opts[0];
	}
	return null;
}

function eq(a?: string, b?: string) {
	return (a || "").toLowerCase() === (b || "").toLowerCase();
}

function renderFeatures(product: WooCommerceProduct) {
	const meta = (product as any).meta_data as Array<{ key: string; value: any }> | undefined;
	const keys = ["features", "benefits", "features_and_benefits"];
	const found = meta?.find((m) => keys.includes(String(m.key).toLowerCase()));
	if (found) {
		if (typeof found.value === "string") {
			return <div dangerouslySetInnerHTML={{ __html: found.value }} />;
		}
		if (Array.isArray(found.value)) {
			return (
				<ul className="list-disc pl-5">
					{found.value.map((v: any, i: number) => (
						<li key={i}>{String(v)}</li>
					))}
				</ul>
			);
		}
	}
	return (
		<ul className="list-disc pl-5">
			{product.categories?.length ? <li>Categories: {product.categories.map((c) => c.name).join(", ")}</li> : null}
			{product.tags?.length ? <li>Tags: {product.tags.map((t) => t.name).join(", ")}</li> : null}
			{!product.categories?.length && !product.tags?.length ? <li>No features available.</li> : null}
		</ul>
	);
}

function isAllSelected(selected: { [name: string]: string }, attrs: { name: string; options: string[] }[]) {
	if (!attrs || attrs.length === 0) return true;
	return attrs.every((a) => !!selected[a.name]);
}
