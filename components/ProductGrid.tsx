"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import ProductCard from "@/components/ProductCard";

interface ProductGridProps {
  categorySlug?: string;
}

export default function ProductGrid({ categorySlug }: ProductGridProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Mark as mounted after hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);


  const fetchProducts = useCallback(
    async (pageNum: number, append: boolean = false) => {
      if (!isMounted) return; // Don't fetch until mounted
      
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        
        // Category filter (support both categorySlug prop and URL params)
        if (categorySlug) {
          params.set("categorySlug", categorySlug);
        } else {
          const categories = searchParams.get("categories");
          if (categories) {
            params.set("categories", categories);
          }
        }
        
        // Brand filter
        const brands = searchParams.get("brands");
        if (brands) {
          params.set("brands", brands);
        }
        
        // Tag filter
        const tag = searchParams.get("tag");
        if (tag) {
          params.set("tag", tag);
        }
        const tags = searchParams.get("tags");
        if (tags) {
          params.set("tags", tags);
        }
        
        // Price filter
        const minPrice = searchParams.get("minPrice");
        const maxPrice = searchParams.get("maxPrice");
        if (minPrice) {
          params.set("minPrice", minPrice);
        }
        if (maxPrice) {
          params.set("maxPrice", maxPrice);
        }
        
        // Sort filter
        const sortBy = searchParams.get("sortBy");
        if (sortBy) {
          params.set("sortBy", sortBy);
        }
        
        // Search query - support both /search?query= and /?Search= for compatibility
        let search: string | null = null;
        
        // Try Next.js searchParams first (check both 'query' and 'Search'/'search')
        search = searchParams.get("query") || searchParams.get("Search") || searchParams.get("search");
        
        // Fallback: Read directly from window.location to handle malformed URLs
        if (!search && typeof window !== 'undefined') {
          try {
            const url = new URL(window.location.href);
            // Try query, Search, and search parameters
            search = url.searchParams.get("query") || url.searchParams.get("Search") || url.searchParams.get("search");
            
            // If still not found, manually parse the search string
            if (!search) {
              const searchStr = window.location.search;
              // Match query=, Search=, or search=, handling encoded values
              const match = searchStr.match(/[?&](?:query|Search|search)=([^&]*)/i);
              if (match && match[1]) {
                search = decodeURIComponent(match[1]);
              }
            }
          } catch (e) {
            console.error("ProductGrid - Error reading search from URL:", e);
          }
        }
        
        if (search) {
          search = search.trim();
          params.set("search", search);
        }
        
        params.set("per_page", "24");
        params.set("page", String(pageNum));

        // Use AbortController for better request management
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

        const res = await fetch(`/api/products?${params.toString()}`, {
          signal: controller.signal,
          cache: 'no-store', // Ensure fresh data
        });
        
        clearTimeout(timeoutId);
        
        // Check if response is ok
        if (!res.ok) {
          // Try to get error message from response
          let errorMessage = `HTTP ${res.status}`;
          try {
            // Try to read error response - body might be null but we can still try
            const errorData = await res.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch (e) {
            // Response body couldn't be parsed, use status text
            errorMessage = res.statusText || errorMessage;
          }
          throw new Error(errorMessage);
        }
        
        // Try to parse JSON - handle cases where body might not be directly accessible
        let json: any;
        try {
          json = await res.json();
        } catch (parseError: any) {
          // If JSON parsing fails, check if it's because body is null
          if (parseError.message?.includes('body') || parseError.message?.includes('getReader')) {
            throw new Error('API returned an empty response. Please check your WooCommerce API configuration.');
          }
          throw parseError;
        }
        
        // Validate that we got valid data
        if (!json || typeof json !== 'object') {
          throw new Error('API returned invalid response format');
        }

        if (json.products && Array.isArray(json.products)) {
          if (append) {
            setProducts((prev) => [...prev, ...json.products]);
          } else {
            setProducts(json.products);
          }
          setTotal(json.total || 0);
          setHasMore(pageNum < (json.totalPages || 1));
        } else {
          setProducts([]);
          setTotal(0);
          setHasMore(false);
        }
      } catch (err: any) {
        // Don't set error if request was aborted (user changed filters quickly)
        if (err.name !== 'AbortError') {
          setError("Failed to load products");
          console.error('Error fetching products:', err);
        }
      } finally {
        setLoading(false);
        setIsInitialLoad(false);
      }
    },
    [categorySlug, isMounted, searchParams]
  );

  // Track search params to detect filter changes
  const searchParamsString = searchParams.toString();
  const prevSearchParamsRef = useRef<string>('');
  
  // Initial load or when filters/category changes (only after mount)
  useEffect(() => {
    if (!isMounted) return;
    
    // Check if search params changed
    if (searchParamsString !== prevSearchParamsRef.current) {
      prevSearchParamsRef.current = searchParamsString;
      setPage(1);
      setHasMore(true);
      setProducts([]); // Clear products for smooth transition - shows skeleton
      fetchProducts(1, false);
    }
  }, [searchParamsString, isMounted, fetchProducts]);
  
  // Initial load on mount
  useEffect(() => {
    if (!isMounted) return;
    prevSearchParamsRef.current = searchParamsString;
    fetchProducts(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted]); // Only run once on mount

  // Get current sort value from URL - MUST be called before any early returns
  const currentSort = useMemo(() => {
    return searchParams.get('sortBy') || 'relevance';
  }, [searchParams]);

  // Handle sort change - MUST be called before any early returns
  const handleSortChange = useCallback((sortBy: string) => {
    if (!isMounted) return;
    
    const params = new URLSearchParams(searchParams.toString());
    if (sortBy === 'relevance') {
      params.delete('sortBy');
    } else {
      params.set('sortBy', sortBy);
    }
    params.delete('page'); // Reset pagination
    
    const newSearch = params.toString();
    const newUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}`;
    
    // Use Next.js router to update URL (triggers ProductGrid to refetch via searchParams change)
    router.replace(newUrl, { scroll: false });
  }, [isMounted, router, searchParams]);

  const sortOptions = [
    { value: "relevance", label: "Relevance" },
    { value: "price_low", label: "Price: Low to High" },
    { value: "price_high", label: "Price: High to Low" },
    { value: "newest", label: "Newest First" },
    { value: "rating", label: "Top Rated" },
    { value: "popularity", label: "Most Popular" },
  ];

  // Infinite scroll observer
  useEffect(() => {
    if (!isMounted || typeof window === 'undefined') return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchProducts(nextPage, true);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, page, isMounted, fetchProducts]);

  // Show loading skeleton on initial load or when filters change (products cleared)
  // Use suppressHydrationWarning to prevent mismatches from browser extensions
  if (!isMounted || (isInitialLoad && loading) || (loading && products.length === 0)) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" suppressHydrationWarning>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="animate-pulse" suppressHydrationWarning>
            <div className="bg-gray-200 aspect-square rounded-lg mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error && products.length === 0) {
    return (
      <div className="rounded-lg bg-white p-8 text-center" suppressHydrationWarning>
        <p className="text-red-600 mb-2">{error}</p>
        <p className="text-sm text-gray-500">
          Please check your WooCommerce API configuration.
        </p>
      </div>
    );
  }

  // Get search query for better messaging
  let searchQuery: string | null = null;
  if (searchParams) {
    searchQuery = searchParams.get("Search") || searchParams.get("search");
  }
  
  // Fallback to window.location if not found
  if (!searchQuery && typeof window !== 'undefined') {
    try {
      const url = new URL(window.location.href);
      searchQuery = url.searchParams.get("Search") || url.searchParams.get("search");
      if (!searchQuery) {
        const match = window.location.search.match(/[?&](?:Search|search)=([^&]*)/i);
        if (match && match[1]) {
          searchQuery = decodeURIComponent(match[1]);
        }
      }
    } catch (e) {
      // Ignore errors
    }
  }

  if (products.length === 0 && !loading && !isInitialLoad) {
    return (
      <div className="rounded-lg bg-white p-8 text-center text-gray-600" suppressHydrationWarning>
        <p className="mb-2">
          {searchQuery ? `No products found for "${searchQuery}"` : "No products found."}
        </p>
        <p className="text-sm text-gray-500">
          {searchQuery ? "Try a different search term or adjust your filters." : "Try adjusting your filters."}
        </p>
      </div>
    );
  }

  return (
    <div className="relative" suppressHydrationWarning>
      {/* Results count and Sort dropdown */}
      {!isInitialLoad && isMounted && (
        <div className="mb-4 flex items-center justify-between flex-wrap gap-2" suppressHydrationWarning>
          <div className="text-sm text-gray-600">
            {total > 0 ? (
              <span>Showing <strong>{products.length}</strong> of <strong>{total}</strong> products</span>
            ) : (
              <span>No products found</span>
            )}
          </div>
          
          {/* Sort By Dropdown - Top Right */}
          <div className="flex items-center gap-2" suppressHydrationWarning>
            <label htmlFor="sort-select" className="text-sm text-gray-600 whitespace-nowrap">
              Sort by:
            </label>
            <select
              id="sort-select"
              value={currentSort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Smooth loading overlay - shows on top of existing products during filter changes */}
      {loading && !isInitialLoad && products.length > 0 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-lg transition-opacity duration-300" suppressHydrationWarning>
          <div className="flex flex-col items-center gap-2">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-emerald-600"></div>
            <span className="text-sm text-gray-600">Updating products...</span>
          </div>
        </div>
      )}

      {/* Product Grid with Smooth Animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${categorySlug || 'all'}-${searchParamsString}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          suppressHydrationWarning
        >
          {products.map((product, index) => (
            <motion.div
              key={`product-${product.id}-${product.slug || index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.03 }}
              layout
              className="h-full"
            >
              <ProductCard
                id={product.id}
                slug={product.slug}
                name={product.name}
                sku={product.sku}
                price={product.price}
                sale_price={product.sale_price}
                regular_price={product.regular_price}
                on_sale={product.on_sale}
					tax_class={product.tax_class}
					tax_status={product.tax_status}
                average_rating={product.average_rating}
                rating_count={product.rating_count}
                imageUrl={product.images?.[0]?.src}
                imageAlt={product.images?.[0]?.alt || product.name}
              />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Infinite scroll trigger */}
      {hasMore && (
        <div ref={observerTarget} className="h-20 flex items-center justify-center mt-8" suppressHydrationWarning>
          {loading && (
            <div className="flex flex-col items-center gap-2">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-3 border-gray-300 border-t-emerald-600"></div>
              <span className="text-xs text-gray-500">Loading more products...</span>
            </div>
          )}
        </div>
      )}

      {/* Load more button fallback */}
      {hasMore && !loading && (
        <div className="mt-6 text-center" suppressHydrationWarning>
          <button
            onClick={() => {
              const nextPage = page + 1;
              setPage(nextPage);
              fetchProducts(nextPage, true);
            }}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-sm hover:shadow-md"
          >
            Load More Products
          </button>
        </div>
      )}

      {!hasMore && products.length > 0 && (
        <div className="mt-4 text-center text-sm text-gray-500" suppressHydrationWarning>
          No more products to load
        </div>
      )}
    </div>
  );
}

