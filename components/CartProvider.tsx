"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export interface CartItem {
	id: string; // productId or productId:variationId
	productId: number;
	variationId?: number;
	name: string;
	slug: string;
	imageUrl?: string;
	price: string; // display price string
	qty: number;
	sku?: string | null;
    attributes?: { [name: string]: string };
    deliveryPlan?: "none" | "7" | "14" | "30";
}

interface CartState {
	items: CartItem[];
	isOpen: boolean;
	open: () => void;
	close: () => void;
    addItem: (item: Omit<CartItem, "id"> & { id?: string }) => void;
	removeItem: (id: string) => void;
	updateItemQty: (id: string, qty: number) => void;
	clear: () => void;
	total: string; // computed total as display string
}

const CartContext = createContext<CartState | undefined>(undefined);

export default function CartProvider({ children }: { children: React.ReactNode }) {
	const [items, setItems] = useState<CartItem[]>([]);
	const [isOpen, setIsOpen] = useState(false);
	const [isHydrated, setIsHydrated] = useState(false);

	// hydrate from localStorage - only on client after mount
	useEffect(() => {
		try {
			if (typeof window !== 'undefined') {
				const raw = localStorage.getItem("cart:v1");
				if (raw) {
					const parsed = JSON.parse(raw);
					if (Array.isArray(parsed)) {
						setItems(parsed);
					}
				}
				setIsHydrated(true);
			}
		} catch {}
	}, []);
	// Only save to localStorage after hydration to prevent hydration mismatches
	useEffect(() => {
		if (!isHydrated || typeof window === 'undefined') return;
		try {
			localStorage.setItem("cart:v1", JSON.stringify(items));
		} catch {}
	}, [items, isHydrated]);

	const open = useCallback(() => {
		// Only open cart if there are items
		if (items.length > 0) {
			setIsOpen(true);
		}
	}, [items.length]);
	const close = useCallback(() => setIsOpen(false), []);

	const addItem = useCallback((input: Omit<CartItem, "id"> & { id?: string }) => {
		const id = input.id || `${input.productId}${input.variationId ? ":" + input.variationId : ""}`;
		setItems((prev) => {
			const idx = prev.findIndex((p) => p.id === id);
			if (idx >= 0) {
				const next = [...prev];
				next[idx] = { ...next[idx], qty: next[idx].qty + input.qty };
				return next;
			}
			return [...prev, { ...input, id } as CartItem];
		});
		// Open cart after adding item
		setIsOpen(true);
	}, [items.length]);

	const removeItem = useCallback((id: string) => {
		setItems((prev) => prev.filter((p) => p.id !== id));
	}, []);

	const updateItemQty = useCallback((id: string, qty: number) => {
		setItems((prev) => prev.map((item) => item.id === id ? { ...item, qty: Math.max(1, qty) } : item));
	}, []);

	const clear = useCallback(() => setItems([]), []);

	const total = useMemo(() => {
		const sum = items.reduce((acc, it) => acc + parseFloat(it.price || "0") * it.qty, 0);
		return sum.toFixed(2);
	}, [items]);

	const value: CartState = useMemo(() => ({ items, isOpen, open, close, addItem, removeItem, updateItemQty, clear, total: total }), [items, isOpen, open, close, addItem, removeItem, updateItemQty, clear, total]);

	return (
		<CartContext.Provider value={value} suppressHydrationWarning>{children}</CartContext.Provider>
	);
}

export function useCart() {
	const ctx = useContext(CartContext);
	if (!ctx) throw new Error("useCart must be used within CartProvider");
	return ctx;
}
