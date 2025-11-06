import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  WooCommerceProduct,
  WooCommerceCategory,
  WooCommerceTag,
  WooCommerceCustomer,
  WooCommerceOrder,
  ProductFilters,
  SearchResult,
  WordPressMenu,
  WooCommerceProductVariation,
  WooCommerceCart,
} from '@/types/woocommerce';
import wooCommerceAPI from '@/lib/woocommerce';

// Query Keys
export const queryKeys = {
  products: ['products'] as const,
  product: (id: number) => ['products', id] as const,
  featuredProducts: ['products', 'featured'] as const,
  relatedProducts: (id: number) => ['products', 'related', id] as const,
  categories: ['categories'] as const,
  category: (id: number) => ['categories', id] as const,
  tags: ['tags'] as const,
  customers: ['customers'] as const,
  customer: (id: number) => ['customers', id] as const,
  orders: ['orders'] as const,
  order: (id: number) => ['orders', id] as const,
  menu: (location: string) => ['menu', location] as const,
  search: (query: string) => ['search', query] as const,
};

// Products Hooks
export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: [...queryKeys.products, filters],
    queryFn: () => wooCommerceAPI.getProducts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: queryKeys.product(id),
    queryFn: () => wooCommerceAPI.getProduct(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useProductBySlug(slug: string) {
  return useQuery({
    queryKey: ['products', 'slug', slug],
    queryFn: () => wooCommerceAPI.getProductBySlug(slug),
    enabled: !!slug,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useFeaturedProducts(limit: number = 8) {
  return useQuery({
    queryKey: [...queryKeys.featuredProducts, limit],
    queryFn: () => wooCommerceAPI.getFeaturedProducts(limit),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useRelatedProducts(productId: number, limit: number = 4) {
  return useQuery({
    queryKey: [...queryKeys.relatedProducts(productId), limit],
    queryFn: () => wooCommerceAPI.getRelatedProducts(productId, limit),
    enabled: !!productId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useSearchProducts(query: string, limit: number = 10) {
  return useQuery({
    queryKey: [...queryKeys.search(query), limit],
    queryFn: () => wooCommerceAPI.searchProducts(query, limit),
    enabled: !!query && query.length > 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Categories Hooks
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => wooCommerceAPI.getCategories(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useCategory(id: number) {
  return useQuery({
    queryKey: queryKeys.category(id),
    queryFn: () => wooCommerceAPI.getCategory(id),
    enabled: !!id,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useCategoryBySlug(slug: string) {
  return useQuery({
    queryKey: ['categories', 'slug', slug],
    queryFn: () => wooCommerceAPI.getCategoryBySlug(slug),
    enabled: !!slug,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Tags Hooks
export function useTags() {
  return useQuery({
    queryKey: queryKeys.tags,
    queryFn: () => wooCommerceAPI.getTags(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Customer Hooks
export function useCustomer(id: number) {
  return useQuery({
    queryKey: queryKeys.customer(id),
    queryFn: () => wooCommerceAPI.getCustomer(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (customerData: Partial<WooCommerceCustomer>) =>
      wooCommerceAPI.createCustomer(customerData),
    onSuccess: (newCustomer) => {
      queryClient.setQueryData(queryKeys.customer(newCustomer.id), newCustomer);
      queryClient.invalidateQueries({ queryKey: queryKeys.customers });
    },
  });
}

// Order Hooks
export function useOrder(id: number) {
  return useQuery({
    queryKey: queryKeys.order(id),
    queryFn: () => wooCommerceAPI.getOrder(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (orderData: Partial<WooCommerceOrder>) =>
      wooCommerceAPI.createOrder(orderData),
    onSuccess: (newOrder) => {
      queryClient.setQueryData(queryKeys.order(newOrder.id), newOrder);
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
    },
  });
}

// Menu Hooks
export function useMenu(location: string = 'primary') {
  return useQuery({
    queryKey: queryKeys.menu(location),
    queryFn: () => wooCommerceAPI.getMenu(location),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

// Utility Hooks
export function useCartUrl() {
  return useQuery({
    queryKey: ['cart-url'],
    queryFn: () => wooCommerceAPI.getCartUrl(),
    staleTime: Infinity, // Never stale
  });
}

export function useCheckoutUrl() {
  return useQuery({
    queryKey: ['checkout-url'],
    queryFn: () => wooCommerceAPI.getCheckoutUrl(),
    staleTime: Infinity, // Never stale
  });
}

export function useAddToCartUrl(productId: number, quantity: number = 1, variationId?: number) {
  return useQuery({
    queryKey: ['add-to-cart-url', productId, quantity, variationId],
    queryFn: () => wooCommerceAPI.addToCartUrl(productId, quantity, variationId),
    enabled: !!productId,
    staleTime: Infinity, // Never stale
  });
}

// Product Variations Hooks
export function useProductVariations(productId: number) {
  return useQuery({
    queryKey: ['products', productId, 'variations'],
    queryFn: () => wooCommerceAPI.getProductVariations(productId),
    enabled: !!productId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useProductVariation(productId: number, variationId: number) {
  return useQuery({
    queryKey: ['products', productId, 'variations', variationId],
    queryFn: () => wooCommerceAPI.getProductVariation(productId, variationId),
    enabled: !!productId && !!variationId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Cart Hooks
export function useCart() {
  return useQuery({
    queryKey: ['cart'],
    queryFn: () => wooCommerceAPI.getCart(),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      productId, 
      quantity = 1, 
      variationId, 
      attributes 
    }: { 
      productId: number; 
      quantity?: number; 
      variationId?: number; 
      attributes?: Record<string, string> 
    }) => wooCommerceAPI.addToCart(productId, quantity, variationId, attributes),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['cart'] });
        // Show success message (you can implement a toast notification here)
        console.log(data.message);
      }
    },
    onError: (error) => {
      console.error('Add to cart failed:', error);
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ cartItemKey, quantity }: { cartItemKey: string; quantity: number }) =>
      wooCommerceAPI.updateCartItem(cartItemKey, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (cartItemKey: string) => wooCommerceAPI.removeCartItem(cartItemKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => wooCommerceAPI.clearCart(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}
