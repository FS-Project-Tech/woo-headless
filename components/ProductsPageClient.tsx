"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
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

export default function ProductsPageClient() {
  const searchParams = useSearchParams();
  
  // Read search query - support both /search?query= and /?Search= for compatibility
  let searchQuery: string | null = null;
  
  if (searchParams) {
    searchQuery = searchParams.get("query") || searchParams.get("Search") || searchParams.get("search");
  }
  
  // Fallback to window.location if not found
  if (!searchQuery && typeof window !== 'undefined') {
    try {
      const url = new URL(window.location.href);
      searchQuery = url.searchParams.get("query") || url.searchParams.get("Search") || url.searchParams.get("search");
      
      // If still not found, manually parse
      if (!searchQuery) {
        const match = window.location.search.match(/[?&](?:query|Search|search)=([^&]*)/i);
        if (match && match[1]) {
          searchQuery = decodeURIComponent(match[1]);
        }
      }
    } catch (e) {
      console.error("ProductsPageClient - Error reading search:", e);
    }
  }
  
  const isSearchPage = !!searchQuery;

  return (
    <div className="min-h-screen py-12" suppressHydrationWarning>
      <div className="mx-auto w-[85vw] px-4 sm:px-6 lg:px-8" suppressHydrationWarning>
        <Breadcrumbs items={[
          { label: 'Home', href: '/' }, 
          isSearchPage ? { label: `Search: ${searchQuery}`, href: `/?Search=${encodeURIComponent(searchQuery || '')}` } : { label: 'Shop' }
        ]} />
        
        <div className="mb-6" suppressHydrationWarning>
          <h1 className="text-2xl font-semibold text-gray-900">
            {isSearchPage ? `Search Results for "${searchQuery}"` : 'Our Products'}
          </h1>
          {isSearchPage && (
            <p className="mt-1 text-sm text-gray-600">
              Found products matching your search
            </p>
          )}
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6" suppressHydrationWarning>
          {/* Filter Sidebar */}
          <aside className="lg:w-64 flex-shrink-0" suppressHydrationWarning>
            <FilterSidebar />
          </aside>
          
          {/* Product Grid - Wrapped in Suspense for useSearchParams */}
          <div className="flex-1" suppressHydrationWarning>
            <Suspense fallback={<ProductGridSkeleton />}>
              <ProductGrid />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

