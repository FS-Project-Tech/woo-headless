"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface UseWishlistResult {
  wishlist: number[];
  products: any[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  addToWishlist: (productId: number) => Promise<void>;
  removeFromWishlist: (productId: number) => Promise<void>;
  isAdding: boolean;
  isRemoving: boolean;
}

export function useWishlist(): UseWishlistResult {
  const queryClient = useQueryClient();

  const {
    data: wishlistData,
    isLoading: isLoadingWishlist,
    error: wishlistError,
    refetch: refetchWishlist,
  } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/wishlist', {
        credentials: 'include',
        cache: 'no-store',
      });

      if (!response.ok) {
        // If not authenticated (401), return empty array instead of throwing
        if (response.status === 401) {
          return [];
        }
        const errorData = await response.json().catch(() => ({}));
        console.error('Wishlist fetch error:', response.status, errorData);
        throw new Error(errorData.error || `Failed to fetch wishlist (${response.status})`);
      }

      const result = await response.json();
      console.log('Wishlist data received:', result);
      return result.wishlist || [];
    },
    staleTime: 60 * 1000,
    retry: 1,
  });

  const {
    data: productsData,
    isLoading: isLoadingProducts,
  } = useQuery({
    queryKey: ['wishlist-products', wishlistData],
    queryFn: async () => {
      if (!wishlistData || wishlistData.length === 0) {
        return [];
      }

      // Fetch product details for wishlist items
      // Fetch products by IDs using WooCommerce API
      try {
        // WooCommerce supports include parameter to fetch specific products
        const response = await fetch(`/api/products?per_page=100&include=${wishlistData.join(',')}`, {
          cache: 'no-store',
        });
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data.products)) {
            // Filter products that are in the wishlist (in case API returns more)
            return data.products.filter((p: any) => wishlistData.includes(p.id));
          }
        }
      } catch (error) {
        console.error('Failed to fetch wishlist products:', error);
      }
      return [];
    },
    enabled: !!wishlistData && wishlistData.length > 0,
    staleTime: 60 * 1000,
  });

  const addMutation = useMutation({
    mutationFn: async (productId: number) => {
      const response = await fetch('/api/dashboard/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ product_id: productId }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to add to wishlist';
        try {
          const error = await response.json();
          errorMessage = error.error || error.message || errorMessage;
        } catch (e) {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        console.error('Add to wishlist error:', response.status, errorMessage);
        throw new Error(errorMessage);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (productId: number) => {
      // Use POST with action parameter to avoid DELETE body parsing issues
      const response = await fetch('/api/dashboard/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ product_id: productId, action: 'remove' }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to remove from wishlist';
        try {
          const error = await response.json();
          errorMessage = error.error || error.message || errorMessage;
        } catch (e) {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        console.error('Remove from wishlist error:', response.status, errorMessage);
        throw new Error(errorMessage);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });

  return {
    wishlist: wishlistData || [],
    products: productsData || [],
    isLoading: isLoadingWishlist || isLoadingProducts,
    error: wishlistError as Error | null,
    refetch: () => {
      refetchWishlist();
    },
    addToWishlist: async (productId) => {
      await addMutation.mutateAsync(productId);
    },
    removeFromWishlist: async (productId) => {
      await removeMutation.mutateAsync(productId);
    },
    isAdding: addMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}

