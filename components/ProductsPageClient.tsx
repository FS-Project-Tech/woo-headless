"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductGrid from "@/components/ProductGrid";
import ProductGridSkeleton from "@/components/skeletons/ProductGridSkeleton";
import FilterSidebarSkeleton from "@/components/skeletons/FilterSidebarSkeleton";
import Container from "@/components/Container";

// Dynamically import FilterSidebar - heavy component with filters and sliders
const FilterSidebar = dynamic(() => import("@/components/FilterSidebar"), {
  loading: () => <FilterSidebarSkeleton />,
  ssr: false, // Client-side only for filters
});

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
      <Container suppressHydrationWarning>
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
      </Container>
    </div>
  );
}

