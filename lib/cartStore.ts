"use client";

import { create } from "zustand";

export interface CartItem {
  id: string; // local id
  productId: number;
  variationId?: number;
  name: string;
  price: string;
  qty: number;
  imageUrl?: string;
  sku?: string;
  attributes?: Record<string, string>;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  addItem: (item) => set((state) => ({
    items: [
      ...state.items,
      { id: `${item.productId}-${item.variationId || 0}-${Date.now()}`, ...item },
    ],
  })),
  removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
  updateQty: (id, qty) => set((state) => ({
    items: state.items.map((i) => (i.id === id ? { ...i, qty } : i)),
  })),
  clear: () => set({ items: [] }),
}));


