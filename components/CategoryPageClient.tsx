"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import dynamic from "next/dynamic";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductGrid from "@/components/ProductGrid";
import ProductGridSkeleton from "@/components/skeletons/ProductGridSkeleton";
import FilterSidebarSkeleton from "@/components/skeletons/FilterSidebarSkeleton";
import Container from "@/components/Container";
import { useMounted } from "@/hooks/useMounted";

// Dynamically import FilterSidebar - heavy component with filters and sliders
const FilterSidebar = dynamic(() => import("@/components/FilterSidebar"), {
  loading: () => <FilterSidebarSkeleton />,
  ssr: false, // Client-side only for filters
});

export default function CategoryPageClient({ 
  initialSlug,
  initialCategoryName 
}: { 
  initialSlug: string;
  initialCategoryName?: string;
}) {
  const isMounted = useMounted();
  const [pathname, setPathname] = useState<string | null>(null);
  
  // Get pathname after mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPathname(window.location.pathname);
    }
  }, [isMounted]);
  
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
      <Container suppressHydrationWarning>
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
      </Container>
    </div>
  );
}

