"use client";

import { useState, useEffect, useMemo } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductGrid from "@/components/ProductGrid";

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
    <div className="min-h-screen py-12">
      <div className="mx-auto w-[85vw] px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Shop', href: '/shop' }, { label: categoryName }]} />
        
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">{categoryName}</h1>
        </div>
        
        <ProductGrid categorySlug={categorySlug || undefined} />
      </div>
    </div>
  );
}

