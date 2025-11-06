"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProductCard from "@/components/ProductCard";

interface ProductGridProps {
  categorySlug?: string;
}

export default function ProductGrid({ categorySlug }: ProductGridProps) {
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
        
        if (categorySlug) {
          params.set("categorySlug", categorySlug);
        }
        
        params.set("per_page", "24");
        params.set("page", String(pageNum));

        const res = await fetch(`/api/products?${params.toString()}`);
        const json = await res.json();

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
      } catch (err) {
        setError("Failed to load products");
      } finally {
        setLoading(false);
        setIsInitialLoad(false);
      }
    },
    [categorySlug, isMounted]
  );

  // Initial load or when category changes (only after mount)
  useEffect(() => {
    if (!isMounted) return;
    setPage(1);
    setHasMore(true);
    fetchProducts(1, false);
  }, [categorySlug, isMounted, fetchProducts]);

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

  // Show loading skeleton on initial load (only after mount to avoid hydration mismatch)
  if (!isMounted) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 aspect-square rounded-lg mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (isInitialLoad && loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="animate-pulse">
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
      <div className="rounded-lg bg-white p-8 text-center">
        <p className="text-red-600 mb-2">{error}</p>
        <p className="text-sm text-gray-500">
          Please check your WooCommerce API configuration.
        </p>
      </div>
    );
  }

  if (products.length === 0 && !loading && !isInitialLoad) {
    return (
      <div className="rounded-lg bg-white p-8 text-center text-gray-600">
        <p className="mb-2">No products found.</p>
        <p className="text-sm text-gray-500">Try adjusting your filters.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Results count */}
      {!isInitialLoad && total > 0 && isMounted && (
        <div className="mb-4 text-sm text-gray-600">
          Showing {products.length} of {total} products
        </div>
      )}

      {/* Loading overlay - shows on top of existing products */}
      {loading && !isInitialLoad && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-lg">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
        </div>
      )}

      {/* Product Grid with Animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${categorySlug || 'all'}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
        >
          {products.map((product, index) => (
            <motion.div
              key={`product-${product.id}-${product.slug || index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.03 }}
              layout
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
        <div ref={observerTarget} className="h-20 flex items-center justify-center mt-8">
          {loading && (
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-3 border-gray-300 border-t-blue-600"></div>
          )}
        </div>
      )}

      {/* Load more button fallback */}
      {hasMore && !loading && (
        <div className="mt-4 text-center">
          <button
            onClick={() => {
              const nextPage = page + 1;
              setPage(nextPage);
              fetchProducts(nextPage, true);
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Load More
          </button>
        </div>
      )}

      {!hasMore && products.length > 0 && (
        <div className="mt-4 text-center text-sm text-gray-500">
          No more products to load
        </div>
      )}
    </div>
  );
}

