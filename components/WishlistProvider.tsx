"use client";

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getWishlistFromCookie, saveWishlistToCookie, clearWishlistCookie } from '@/lib/wishlist-cookies';
import { useToast } from '@/components/ToastProvider';

type WishlistContextType = {
  wishlist: number[];
  loading: boolean;
  isInWishlist: (productId: number) => boolean;
  addToWishlist: (productId: number) => Promise<void>;
  removeFromWishlist: (productId: number) => Promise<void>;
  refresh: () => Promise<void>;
};

const WishlistCtx = createContext<WishlistContextType | null>(null);

export default function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { success, error: toastError } = useToast();
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWishlist = useCallback(async () => {
    // Always load from cookies (no auth)
    const cookieWishlist = getWishlistFromCookie();
    setWishlist(cookieWishlist);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  const isInWishlist = useCallback((productId: number): boolean => {
    return wishlist.includes(productId);
  }, [wishlist]);

  const addToWishlist = useCallback(async (productId: number) => {
    // Store in cookies (no auth)
    const currentWishlist = wishlist.length > 0 ? wishlist : getWishlistFromCookie();
    const updated = currentWishlist.includes(productId) 
      ? currentWishlist 
      : [...currentWishlist, productId];
    setWishlist(updated);
    saveWishlistToCookie(updated);
    success("Product added to wishlist");
  }, [wishlist, success]);

  const removeFromWishlist = useCallback(async (productId: number) => {
    // Remove from cookies (no auth)
    const currentWishlist = wishlist.length > 0 ? wishlist : getWishlistFromCookie();
    const updated = currentWishlist.filter(id => id !== productId);
    setWishlist(updated);
    saveWishlistToCookie(updated);
    success("Product removed from wishlist");
  }, [wishlist, success]);

  return (
    <WishlistCtx.Provider value={{
      wishlist,
      loading,
      isInWishlist,
      addToWishlist,
      removeFromWishlist,
      refresh: loadWishlist,
    }}>
      {children}
    </WishlistCtx.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistCtx);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}

