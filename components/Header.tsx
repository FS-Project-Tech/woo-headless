"use client";

import PrefetchLink from "@/components/PrefetchLink";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/components/CartProvider";
import { useWishlist } from "@/hooks/useWishlist";
import { useRouter } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import { useToast } from "@/components/ToastProvider";
import { useAuth } from "@/components/AuthProvider";

export default function Header() {
	const [open, setOpen] = useState(false);
	const [isMounted, setIsMounted] = useState(false);
	const [userMenuOpen, setUserMenuOpen] = useState(false);
	const { open: openCart, items } = useCart();
	const { wishlist } = useWishlist();
	const { info } = useToast();
	const { user, loading, logout } = useAuth();
    const router = useRouter();
	
	// Ensure component is mounted before accessing cart
	useEffect(() => {
		setIsMounted(true);
	}, []);
	
	// Calculate total items in cart (sum of quantities) - use 0 during SSR
	const cartCount = isMounted ? items.reduce((sum, item) => sum + item.qty, 0) : 0;

	// Dynamic logo + tagline
	const [logoUrl, setLogoUrl] = useState<string | null>(null);
	const [tagline, setTagline] = useState<string | null>(null);
	useEffect(() => {
		// Load header data after initial render to avoid blocking
		// Use a small delay to not block critical rendering
		const timer = setTimeout(async () => {
			try {
				const res = await fetch('/api/cms/header');
				const json = await res.json();
				setLogoUrl(json.logo || null);
				setTagline(json.tagline || null);
			} catch {
				setLogoUrl(null);
				setTagline(null);
			}
		}, 100); // Small delay to not block initial render
		
		return () => clearTimeout(timer);
	}, []);


	return (
		<header className="bg-white sticky top-0 z-50" suppressHydrationWarning>
			{/* Top tagline bar */}
			{tagline ? (
				<div className="bg-teal-600 text-center text-sm text-white py-1 px-2" suppressHydrationWarning>{tagline}</div>
			) : null}
				<nav className="mx-auto w-full sm:w-[85vw] grid grid-cols-2 items-center gap-3 border-y border-gray-200 p-4 sm:px-6 lg:grid-cols-12 lg:px-8" aria-label="Global" suppressHydrationWarning>
                <div className="flex items-center gap-3 lg:col-span-2" suppressHydrationWarning>
					<PrefetchLink href="/" critical className="-m-1.5 p-1.5 flex items-center gap-2">
						<span className="sr-only">Joya Medical Supplies</span>
						{logoUrl && logoUrl.trim() !== '' ? (
							<div className="relative w-40 h-16 overflow-hidden rounded" suppressHydrationWarning>
								<Image src={logoUrl} alt="Logo" fill sizes="32px" className="object-contain" />
							</div>
						) : (
							<div className="h-8 w-8 rounded bg-blue-600 text-white grid place-items-center font-bold" suppressHydrationWarning>W</div>
						)} 
						
					</PrefetchLink>
				</div>
                <div className="flex lg:hidden justify-end" suppressHydrationWarning>
					<button onClick={() => setOpen(!open)} className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 focus:outline-none" aria-label="Toggle menu">
							<svg className="h-6 w-6 text-[#333333]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
							{open ? (
								<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
							) : (
								<path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
							)}
						</svg>
					</button>
				</div>
                {/* Center: Search + Hotline */}
                <div className="hidden lg:col-span-7 lg:flex lg:items-center lg:gap-6" suppressHydrationWarning>
					<SearchBar className="w-full max-w-xl" />
					<div className="hidden items-center gap-2 md:flex" suppressHydrationWarning>
                        <svg viewBox="0 0 24 24" className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 4 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 22 16.92" />
                            <path d="M6.29 6.12 12 9l5.71-2.88" />
                        </svg>
						<a href="tel:+1234567890" className="text-sm text-[#333333]">Hotline: +1 234 567 890</a>
                    </div>
                </div>
                {/* Right: Icons */}
					<div className="hidden lg:col-span-3 lg:flex lg:items-center lg:justify-end lg:gap-3" suppressHydrationWarning>
					<PrefetchLink href="/shop" critical className="rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-black">Shop</PrefetchLink>
					<PrefetchLink href="/catalogue" critical className="rounded-md px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100">Catalogue</PrefetchLink>
				<button 
					onClick={() => {
						// Only open cart if there are items
						if (items.length > 0) {
							openCart();
						} else {
							// Show toast notification if cart is empty
							info("Please choose product to add to cart");
						}
					}} 
					aria-label="Open cart" 
					className="relative rounded p-2 text-gray-700 hover:bg-gray-100"
					suppressHydrationWarning
				>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
						<circle cx="9" cy="21" r="1" />
						<circle cx="20" cy="21" r="1" />
						<path d="M1 1h4l2.68 12.39a2 2 0 0 0 2 1.61h7.72a2 2 0 0 0 2-1.61L23 6H6" />
					</svg>
					{cartCount > 0 && (
						<span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white" suppressHydrationWarning>
							{cartCount > 99 ? '99+' : cartCount}
						</span>
					)}
				</button>
				<PrefetchLink href="/dashboard/wishlist" critical aria-label="Wishlist" className="relative rounded p-2 text-gray-700 hover:bg-gray-100">
					<svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
						<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
					</svg>
					{user && wishlist.length > 0 && (
						<span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
							{wishlist.length > 99 ? '99+' : wishlist.length}
						</span>
					)}
				</PrefetchLink>
				{/* Login/User Menu */}
				{user && !loading ? (
					<div 
						className="relative"
						onMouseEnter={() => setUserMenuOpen(true)}
						onMouseLeave={() => setUserMenuOpen(false)}
					>
						<button
							className="flex items-center space-x-2 rounded p-2 text-gray-700 hover:bg-gray-100"
							aria-label="User menu"
						>
							<div className="h-8 w-8 rounded-full bg-teal-600 flex items-center justify-center text-white font-semibold text-sm">
								{user.name?.charAt(0).toUpperCase() || 'U'}
							</div>
						</button>
						{userMenuOpen && (
							<div 
								className="absolute right-0 top-full w-48 z-20"
								onMouseEnter={() => setUserMenuOpen(true)}
							>
								{/* Invisible bridge to prevent gap */}
								<div className="h-1 -mb-1"></div>
								<div className="bg-white rounded-md shadow-lg py-1 border border-gray-200">
									<PrefetchLink
										href="/dashboard"
										critical
										className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
									>
										Dashboard
									</PrefetchLink>
									<PrefetchLink
										href="/dashboard/orders"
										critical
										className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
									>
										Orders
									</PrefetchLink>
									<button
										onClick={async () => {
											const refreshToken = localStorage.getItem('refreshToken');
											await fetch('/api/auth/logout', {
												method: 'POST',
												headers: refreshToken ? { 'x-refresh-token': refreshToken } : {},
											});
											localStorage.removeItem('refreshToken');
											await logout();
											setUserMenuOpen(false);
											router.push('/login');
										}}
										className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
									>
										Log out
									</button>
								</div>
							</div>
						)}
					</div>
				) : (
					<PrefetchLink
						href="/login"
						critical
						className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
					>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
							<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
							<circle cx="12" cy="7" r="4" />
						</svg>
						<span>Login</span>
					</PrefetchLink>
				)}
			</div>
			</nav>
            {open && (
                <div className="lg:hidden border-t">
                    <div className="space-y-4 p-4">
						<SearchBar />
                        <a href="tel:+1234567890" className="block text-sm text-gray-700">Hotline: +1 234 567 890</a>
                        <div className="space-y-1">
                            <PrefetchLink href="/" critical className="block rounded px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50">Home</PrefetchLink>
                            <PrefetchLink href="/shop" critical className="block rounded px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50">Shop</PrefetchLink>
                            <PrefetchLink href="/catalogue" critical className="block rounded px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50">Catalogue</PrefetchLink>
                            {user ? (
                                <>
                                    <PrefetchLink href="/dashboard" critical className="block rounded px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50">Dashboard</PrefetchLink>
                                    <button
                                        onClick={async () => {
                                            const refreshToken = localStorage.getItem('refreshToken');
                                            await fetch('/api/auth/logout', {
                                                method: 'POST',
                                                headers: refreshToken ? { 'x-refresh-token': refreshToken } : {},
                                            });
                                            localStorage.removeItem('refreshToken');
                                            await logout();
                                            router.push('/login');
                                        }}
                                        className="block w-full text-left rounded px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50"
                                    >
                                        Sign Out
                                    </button>
                                </>
                            ) : (
                                <PrefetchLink href="/login" critical className="block rounded px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50">Login</PrefetchLink>
                            )}
                        </div>
                    </div>
                </div>
            )}
		</header>
	);
}
