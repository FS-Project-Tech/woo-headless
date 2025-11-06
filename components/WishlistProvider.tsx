"use client";

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthProvider';
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
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWishlist = useCallback(async () => {
    if (!user) {
      // Load from cookies when not logged in
      const cookieWishlist = getWishlistFromCookie();
      setWishlist(cookieWishlist);
      setLoading(false);
      return;
    }

    // Load from server when logged in
    try {
      const res = await fetch('/api/wishlist', { cache: 'no-store' });
      const json = await res.json();
      const serverWishlist = json.wishlist || [];
      
      // Check if there's a cookie wishlist to sync
      const cookieWishlist = getWishlistFromCookie();
      if (cookieWishlist.length > 0) {
        // Merge cookie wishlist with server (deduplicate)
        const merged = Array.from(new Set([...serverWishlist, ...cookieWishlist]));
        if (merged.length > serverWishlist.length) {
          // Sync cookie items to server
          try {
            const syncRes = await fetch('/api/wishlist/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ product_ids: cookieWishlist }),
            });
            if (syncRes.ok) {
              const syncData = await syncRes.json();
              setWishlist(syncData.wishlist || merged);
              // Clear cookie after successful sync
              clearWishlistCookie();
            } else {
              setWishlist(merged);
            }
          } catch {
            // If sync fails, use merged list anyway
            setWishlist(merged);
          }
        } else {
          setWishlist(serverWishlist);
          // Clear cookie if everything is already on server
          clearWishlistCookie();
        }
      } else {
        setWishlist(serverWishlist);
      }
    } catch {
      // Fallback to cookie wishlist if server fails
      const cookieWishlist = getWishlistFromCookie();
      setWishlist(cookieWishlist);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist, user]); // Reload when user changes (login/logout)

  // When user logs out, keep cookie wishlist if any
  useEffect(() => {
    if (!user && wishlist.length > 0) {
      saveWishlistToCookie(wishlist);
    }
  }, [user, wishlist]);

  const isInWishlist = useCallback((productId: number): boolean => {
    return wishlist.includes(productId);
  }, [wishlist]);

  const addToWishlist = useCallback(async (productId: number) => {
    if (!user) {
      // Store in cookies when not logged in
      const currentWishlist = wishlist.length > 0 ? wishlist : getWishlistFromCookie();
      const updated = currentWishlist.includes(productId) 
        ? currentWishlist 
        : [...currentWishlist, productId];
      setWishlist(updated);
      saveWishlistToCookie(updated);
      success("Product added to wishlist");
      return;
    }

    // Store on server when logged in
    try {
      const res = await fetch('/api/wishlist/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId }),
      });

      if (!res.ok) {
        throw new Error('Failed to add to wishlist');
      }

      const json = await res.json();
      setWishlist(json.wishlist || []);
      success("Product added to wishlist");
    } catch (err) {
      console.error('Error adding to wishlist:', err);
      toastError("Failed to add to wishlist");
      throw err as Error;
    }
  }, [user, wishlist, success, toastError]);

  const removeFromWishlist = useCallback(async (productId: number) => {
    if (!user) {
      // Remove from cookies when not logged in
      const currentWishlist = wishlist.length > 0 ? wishlist : getWishlistFromCookie();
      const updated = currentWishlist.filter(id => id !== productId);
      setWishlist(updated);
      saveWishlistToCookie(updated);
      success("Product removed from wishlist");
      return;
    }

    // Remove from server when logged in
    try {
      const res = await fetch('/api/wishlist/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId }),
      });

      if (!res.ok) {
        throw new Error('Failed to remove from wishlist');
      }

      const json = await res.json();
      setWishlist(json.wishlist || []);
      success("Product removed from wishlist");
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      toastError("Failed to remove from wishlist");
      throw err as Error;
    }
  }, [user, wishlist, success, toastError]);

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

