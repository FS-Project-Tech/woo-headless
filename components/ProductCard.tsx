"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, type MouseEvent } from "react";
import { useCart } from "@/components/CartProvider";
import { useToast } from "@/components/ToastProvider";
import { useWishlist } from "@/components/WishlistProvider";
import { formatPriceWithLabel } from "@/lib/format-utils";

export interface ProductCardProps {
	id: number;
	slug: string;
	name: string;
	sku?: string | null;
	price: string;
	sale_price?: string;
	regular_price?: string;
	on_sale?: boolean;
	imageUrl?: string;
	imageAlt?: string;
	/** WooCommerce tax class slug or name, e.g. 'gst-10', 'gst-free' */
	tax_class?: string;
	/** WooCommerce tax status, e.g. 'taxable', 'none' */
	tax_status?: string;
	average_rating?: string;
	rating_count?: number;
}

export default function ProductCard(props: ProductCardProps) {
	const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
	const { addItem, open: openCart } = useCart();
	const { success, error: showError } = useToast();
	const [wishlisted, setWishlisted] = useState<boolean>(false);
	const [wishlistLoading, setWishlistLoading] = useState(false);
	const [addingToCart, setAddingToCart] = useState(false);

	// Check if product is in wishlist on mount and when wishlist changes
	useEffect(() => {
		setWishlisted(isInWishlist(props.id));
	}, [isInWishlist, props.id]);

	const handleWishlistToggle = async (e: MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();
		e.stopPropagation();
		if (wishlistLoading) return;

		setWishlistLoading(true);
		try {
			if (wishlisted) {
				await removeFromWishlist(props.id);
				setWishlisted(false);
			} else {
				await addToWishlist(props.id);
				setWishlisted(true);
			}
		} catch (error) {
			console.error('Wishlist error:', error);
		} finally {
			setWishlistLoading(false);
		}
	};

	const handleAddToCart = async () => {
		if (addingToCart) return;

		setAddingToCart(true);
		try {
			await new Promise((resolve) => setTimeout(resolve, 250));

			addItem({
				productId: props.id,
				name: props.name,
				slug: props.slug,
				imageUrl: props.imageUrl,
				price: props.sale_price || props.price || "0",
				qty: 1,
				sku: props.sku || undefined,
				tax_class: props.tax_class || undefined,
				tax_status: props.tax_status || undefined,
			});

			openCart();
			success("Product added to cart");
		} catch (error) {
			console.error("Error adding to cart:", error);
			showError("Failed to add product to cart");
		} finally {
			setAddingToCart(false);
		}
	};

	// minimal subtitle, use SKU or blank to mimic variant line
	const subtitle = props.sku || "";
	const productUrl = `/products/${props.slug}`;

	return (
		<div className="group relative flex h-full min-h-[360px] md:min-h-[420px] flex-col rounded-xl border border-gray-300 bg-white">
			{/* Image area */}
			<Link href={productUrl} className="block overflow-hidden rounded-t-xl">
				<div className="relative aspect-square">
					{props.imageUrl ? (
						<Image
							src={props.imageUrl}
							alt={props.imageAlt || props.name}
							fill
							sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
							className="object-cover"
							priority={false}
						/>
					) : (
						<div className="absolute inset-0 grid place-items-center text-gray-400">No Image</div>
					)}
					{/* Sale badge with discount % */}
					{(() => {
						const regular = Number(props.regular_price || 0);
						const sale = Number(props.sale_price || props.price || 0);
						const isSale = !!props.on_sale && regular > 0 && sale > 0 && sale < regular;
						if (!isSale) return null;
						const pct = Math.round(((regular - sale) / regular) * 100);
						return (
							<span className="absolute left-2 top-2 rounded bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">Sale {pct}%</span>
						);
					})()}
				</div>
			</Link>

			{/* Inline wishlist will appear next to price; removed overlay */}

			{/* Text area */}
			<div className="flex flex-1 flex-col space-y-2 px-3 pt-3 pb-3 md:px-4 md:pt-4 md:pb-4">
				{/* Info block with fixed min-height to align pricing across cards */}
				<div className="min-h-[72px] md:min-h-[88px]">
					<Link href={productUrl} className="text-sm md:text-base font-medium text-[#333333]">
						{props.name}
					</Link>
					{subtitle && <div className="text-[11px] md:text-xs text-gray-500">SKU: {subtitle}</div>}
					{/* Ratings (reserved space even if empty) */}
					<div className="h-5">
						{(() => {
							const count = Number(props.rating_count || 0);
							const avg = Math.max(0, Math.min(5, Number(props.average_rating || 0)));
							if (!count || isNaN(avg)) return null;
							return (
								<div className="flex items-center gap-1 text-amber-500">
									{Array.from({ length: 5 }).map((_, i) => (
										<svg key={i} className={`h-3.5 w-3.5 md:h-4 md:w-4 ${i < Math.round(avg) ? "fill-current" : ""}`} viewBox="0 0 20 20" aria-hidden="true">
											<path d="M10 15l-5.878 3.09 1.123-6.545L.49 6.91l6.564-.954L10 0l2.946 5.956 6.564.954-4.755 4.635 1.123 6.545z" />
										</svg>
									))}
									<span className="ml-1 text-[11px] md:text-xs text-gray-600">({count})</span>
								</div>
							);
						})()}
					</div>
				</div>
				{/* Pricing + actions pinned to bottom */}
				<div className="mt-auto">
					{/* Pricing with WooCommerce tax class mapping */}
					<div className="mb-3 text-[13px] md:text-sm text-gray-900">
						{(() => {
							const reg = Number(props.regular_price || 0);
							const sale = Number(props.sale_price || props.price || 0);
							const raw = sale; // effective current price
							if (isNaN(raw) || raw <= 0) return <span className="font-semibold">$0.00</span>;

							const priceInfo = formatPriceWithLabel(raw, props.tax_class, props.tax_status);
							const isOnSale = props.on_sale && reg > 0 && reg > raw;

							if (priceInfo.taxType === "gst_free") {
								return (
									<div className="space-y-0.5">
										{isOnSale && (
											<div className="text-xs text-gray-500 line-through">${reg.toFixed(2)}</div>
										)}
										<div className="text-sm md:text-base font-bold text-emerald-700">
											{priceInfo.label}: {priceInfo.price}
										</div>
										{isOnSale && (
											<div className="mt-1 inline-flex items-center rounded bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">On Sale</div>
										)}
									</div>
								);
							}

							return (
								<div className="space-y-0.5">
									{isOnSale && (
										<div className="text-xs text-gray-500 line-through">${reg.toFixed(2)}</div>
									)}
									<div className="text-sm md:text-base font-bold text-emerald-700">
										{priceInfo.label}: {priceInfo.price}
									</div>
									{priceInfo.exclPrice ? (
										<div className="text-[11px] md:text-xs text-gray-600">Excl. GST: {priceInfo.exclPrice}</div>
									) : null}
									{isOnSale && (
										<div className="mt-1 inline-flex items-center rounded bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">On Sale</div>
									)}
								</div>
							);
						})()}
					</div>
					{/* Actions: Add to cart (left) and Wishlist (right) */}
					<div className="flex items-center justify-between gap-3">
						<button
							onClick={handleAddToCart}
							disabled={addingToCart}
							className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1f605f] px-4 py-2.5 text-xs md:text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{addingToCart ? (
								<>
									<svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
										<path
											className="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										></path>
									</svg>
									Adding…
								</>
							) : (
								<>
									<svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.5 6h12.2M7 13L5 5m2 14a1 1 0 110-2 1 1 0 010 2zm9 0a1 1 0 110-2 1 1 0 010 2z" />
									</svg>
									Add to cart
								</>
							)}
						</button>
						<button
							aria-label="Wishlist"
							onClick={handleWishlistToggle}
							disabled={wishlistLoading}
							className={`inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-gray-300 hover:text-rose-500 ${wishlistLoading ? "cursor-not-allowed opacity-50" : ""}`}
							title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
						>
							<svg viewBox="0 0 24 24" className="h-5 w-5" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
							</svg>
						</button>
					</div>
				</div>

			</div>

		</div>
	);
}