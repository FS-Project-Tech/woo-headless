"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import dynamic from "next/dynamic";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductGrid from "@/components/ProductGrid";

// Dynamically import FilterSidebar - heavy component with filters and sliders
const FilterSidebar = dynamic(() => import("@/components/FilterSidebar"), {
  loading: () => (
    <div className="w-full lg:w-64 space-y-4">
      <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
    </div>
  ),
  ssr: false, // Client-side only for filters
});

// Loading skeleton for ProductGrid
function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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

export default function CategoryPageClient({ 
  initialSlug,
  initialCategoryName 
}: { 
  initialSlug: string;
  initialCategoryName?: string;
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [pathname, setPathname] = useState<string | null>(null);
  
  // Mark as mounted after hydration and get pathname
  useEffect(() => {
    setIsMounted(true);
    // Use window.location to avoid hydration mismatch
    if (typeof window !== 'undefined') {
      setPathname(window.location.pathname);
    }
  }, []);
  
  // Extract slug from pathname - use initialSlug for consistent initial render
  const slugFromPath = useMemo(() => {
    if (!isMounted || !pathname) return null;
    return pathname.startsWith('/product-category/') 
      ? pathname.split('/product-category/')[1]?.split('/')[0] 
      : null;
  }, [pathname, isMounted]);
  
  // Always use initialSlug for initial state to ensure hydration consistency
  const [categorySlug, setCategorySlug] = useState(initialSlug);
  const [categoryName, setCategoryName] = useState(initialCategoryName || "Category");

  // Sync slug from pathname when it changes (after initial render)
  useEffect(() => {
    if (!isMounted) return;
    
    const currentPathSlug = slugFromPath || initialSlug;
    if (currentPathSlug !== categorySlug) {
      setCategorySlug(currentPathSlug);
      // Fetch category name if we don't have it
      if (!initialCategoryName || currentPathSlug !== initialSlug) {
        fetch(`/api/category-by-slug?slug=${encodeURIComponent(currentPathSlug)}`)
          .then(res => res.json())
          .then(json => {
            if (json.category) {
              setCategoryName(json.category.name);
            }
          })
          .catch(() => {});
      }
    }
  }, [slugFromPath, initialSlug, categorySlug, initialCategoryName, isMounted]);

  return (
    <div className="min-h-screen py-12" suppressHydrationWarning>
      <div className="mx-auto w-[85vw] px-4 sm:px-6 lg:px-8" suppressHydrationWarning>
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Shop', href: '/shop' }, { label: categoryName }]} />
        
        <div className="mb-6" suppressHydrationWarning>
          <h1 className="text-2xl font-semibold text-gray-900">{categoryName}</h1>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6" suppressHydrationWarning>
          {/* Filter Sidebar */}
          <aside className="lg:w-64 flex-shrink-0" suppressHydrationWarning>
            <FilterSidebar categorySlug={categorySlug} />
          </aside>
          
          {/* Product Grid - Wrapped in Suspense for useSearchParams */}
          <div className="flex-1" suppressHydrationWarning>
            <Suspense fallback={<ProductGridSkeleton />}>
              <ProductGrid categorySlug={categorySlug || undefined} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

