"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import PriceRangeSlider from "./PriceRangeSlider";
import FilterSection from "./FilterSection";

// Define types for category children
interface CategoryWithChildren {
  id: number;
  name: string;
  slug: string;
  count?: number;
}

interface FilterSidebarProps {
  categorySlug?: string;
}

export default function FilterSidebar({ categorySlug }: FilterSidebarProps) {
  const router = useRouter();
  const [pathname, setPathname] = useState<string | null>(null);
  const [searchParamsString, setSearchParamsString] = useState<string>("");
  const [isMounted, setIsMounted] = useState(false);
  // Initialize with empty set to ensure consistent SSR, expand after mount
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [filterData, setFilterData] = useState({
    categories: [] as any[],
    brands: [] as any[],
    priceRange: { min: 0, max: 1000 },
    ratings: [5, 4, 3, 2, 1],
  });
  const [loading, setLoading] = useState(true);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [priceLoaded, setPriceLoaded] = useState(false);

  // Mark as mounted after hydration and expand all sections by default
  useEffect(() => {
    setIsMounted(true);
    // Get pathname and search params from window to avoid hydration mismatch
    if (typeof window !== 'undefined') {
      setPathname(window.location.pathname);
      setSearchParamsString(window.location.search);
    }
    // Expand all sections by default after mount
    setExpandedSections(new Set(["category", "price", "brand"]));
  }, []);

  // Update search params when URL changes (for browser back/forward and filter changes)
  useEffect(() => {
    if (!isMounted || typeof window === 'undefined') return;
    
    let lastSearch = window.location.search;
    let lastPath = window.location.pathname;
    
    const updateSearchParams = () => {
      const currentSearch = window.location.search;
      const currentPath = window.location.pathname;
      if (currentSearch !== lastSearch || currentPath !== lastPath) {
        lastSearch = currentSearch;
        lastPath = currentPath;
        setSearchParamsString(currentSearch);
        setPathname(currentPath);
      }
    };
    
    // Listen to popstate for browser navigation
    window.addEventListener('popstate', updateSearchParams);
    
    // Also check periodically for URL changes (since router.replace doesn't trigger popstate)
    const interval = setInterval(() => {
      updateSearchParams();
    }, 100); // Check every 100ms for faster response
    
    return () => {
      window.removeEventListener('popstate', updateSearchParams);
      clearInterval(interval);
    };
  }, [isMounted]);

  // Parse search params manually to avoid hydration issues
  const searchParams = useMemo(() => {
    if (!searchParamsString) return new URLSearchParams();
    // Remove leading ? if present
    const cleanSearch = searchParamsString.startsWith('?') ? searchParamsString.slice(1) : searchParamsString;
    return new URLSearchParams(cleanSearch);
  }, [searchParamsString]);

  // Load static filters (categories and price) only once on mount
  useEffect(() => {
    if (!isMounted || categoriesLoaded || priceLoaded) return;

    const fetchStaticFilters = async () => {
      setLoading(true);
      try {
        const [categoriesRes, priceRes] = await Promise.all([
          fetch("/api/filters/categories").catch(() => null),
          fetch("/api/filters/price-range").catch(() => null), // Get global price range
        ]);

        if (categoriesRes?.ok) {
          const catData = await categoriesRes.json();
          setFilterData((prev) => ({ ...prev, categories: catData.categories || [] }));
          setCategoriesLoaded(true);
        }

        if (priceRes?.ok) {
          const priceData = await priceRes.json();
          setFilterData((prev) => ({
            ...prev,
            priceRange: { min: priceData.min || 0, max: priceData.max || 1000 },
          }));
          setPriceLoaded(true);
        }
      } catch (error) {
        console.error("Error fetching static filter data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStaticFilters();
  }, [isMounted, categoriesLoaded, priceLoaded]);

  // Fetch brands dynamically based on current category
  useEffect(() => {
    if (!isMounted) return;

    const fetchBrands = async () => {
      setBrandsLoading(true);
      // Clear brands immediately when category changes for better UX
      setFilterData((prev) => ({ ...prev, brands: [] }));
      
      try {
        // Get the current category from pathname or query params for dynamic filtering
        let selectedCat: string | undefined = undefined;
        
        // First check pathname for category page (most reliable)
        if (pathname && pathname.startsWith('/product-category/')) {
          const match = pathname.match(/\/product-category\/([^\/\?]+)/);
          if (match) {
            selectedCat = match[1];
          }
        }
        
        // Use categorySlug prop if provided (for category pages) - this is the most reliable
        if (!selectedCat && categorySlug) {
          selectedCat = categorySlug;
        }
        
        // Fallback to query params if no category in pathname
        if (!selectedCat) {
          const urlParams = new URLSearchParams(searchParamsString.startsWith('?') ? searchParamsString.slice(1) : searchParamsString);
          const categoriesFromUrl = urlParams.get("categories")?.split(",").filter(Boolean) || [];
          selectedCat = categoriesFromUrl[0] || undefined;
        }
        
        const categoryParam = selectedCat ? `?category=${encodeURIComponent(selectedCat)}` : "";
        
        const brandsRes = await fetch("/api/filters/brands" + categoryParam).catch(() => null);

        if (brandsRes?.ok) {
          const brandData = await brandsRes.json();
          setFilterData((prev) => ({ ...prev, brands: brandData.brands || [] }));
        } else {
          // If no brands found, set empty array
          setFilterData((prev) => ({ ...prev, brands: [] }));
        }
      } catch (error) {
        console.error("Error fetching brands:", error);
        setFilterData((prev) => ({ ...prev, brands: [] }));
      } finally {
        setBrandsLoading(false);
      }
    };

    fetchBrands();
  }, [isMounted, pathname, categorySlug, searchParamsString]); // Only refetch brands when category changes

  // Get current filter values from URL
  const activeFilters = useMemo(() => {
    if (!isMounted) {
      return {
        categories: [] as string[],
        brands: [] as string[],
        minPrice: "",
        maxPrice: "",
        sortBy: "relevance",
      };
    }
    
    // Extract category from pathname if on category page
    let currentCategorySlug: string | null = null;
    if (pathname && pathname.startsWith('/product-category/')) {
      const match = pathname.match(/\/product-category\/([^\/\?]+)/);
      if (match) {
        currentCategorySlug = match[1];
      }
    }
    
    // Get categories from query params, or use pathname category
    const queryCategories = searchParams.get("categories")?.split(",").filter(Boolean) || [];
    const categories = currentCategorySlug 
      ? [currentCategorySlug, ...queryCategories.filter(c => c !== currentCategorySlug)]
      : queryCategories;
    
    return {
      categories,
      brands: searchParams.get("brands")?.split(",").filter(Boolean) || [],
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      sortBy: searchParams.get("sortBy") || "relevance",
    };
  }, [searchParams, isMounted, pathname]);

  // Toggle filter section
  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  // Update URL params
  const updateFilters = (updates: Record<string, string | string[] | null>) => {
    if (!isMounted || !pathname) return; // Don't update until mounted
    
    // Parse current search params, handling both formats
    const currentSearch = searchParamsString.startsWith('?') 
      ? searchParamsString.slice(1) 
      : searchParamsString;
    const params = new URLSearchParams(currentSearch);
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || (Array.isArray(value) && value.length === 0) || value === "") {
        params.delete(key);
      } else if (Array.isArray(value)) {
        params.set(key, value.join(","));
      } else {
        params.set(key, value);
      }
    });

    // Reset to page 1 when filters change
    params.delete("page");

    const newSearch = params.toString();
    const newUrl = `${pathname}${newSearch ? `?${newSearch}` : ""}`;
    
    router.replace(newUrl, { scroll: false });
    
    // Update local state immediately for instant UI feedback
    setSearchParamsString(newSearch ? `?${newSearch}` : "");
  };

  // Handle category filter - navigate to category page instead of query param
  const handleCategoryToggle = (categorySlug: string) => {
    if (!isMounted || !pathname) return;
    
    // Check if this category is already selected (we're on its page)
    const isCurrentCategory = pathname.includes(`/product-category/${categorySlug}`);
    
    if (isCurrentCategory) {
      // If clicking the current category, navigate back to shop
      const currentSearch = searchParamsString.startsWith('?') 
        ? searchParamsString.slice(1) 
        : searchParamsString;
      const params = new URLSearchParams(currentSearch);
      params.delete("page"); // Reset pagination
      
      const newSearch = params.toString();
      router.push(`/shop${newSearch ? `?${newSearch}` : ""}`, { scroll: false });
    } else {
      // Navigate to the category page, preserving other filters
      const currentSearch = searchParamsString.startsWith('?') 
        ? searchParamsString.slice(1) 
        : searchParamsString;
      const params = new URLSearchParams(currentSearch);
      
      // Remove category from query params (we're navigating to category page)
      params.delete("categories");
      params.delete("page"); // Reset pagination
      
      const newSearch = params.toString();
      router.push(`/product-category/${categorySlug}${newSearch ? `?${newSearch}` : ""}`, { scroll: false });
    }
  };

  // Handle brand filter
  const handleBrandToggle = (brandSlug: string) => {
    const currentBrands = activeFilters.brands || [];
    const newBrands = currentBrands.includes(brandSlug)
      ? currentBrands.filter((b) => b !== brandSlug)
      : [...currentBrands, brandSlug];
    updateFilters({ brands: newBrands });
  };

  // Handle price range
  const handlePriceChange = (min: number, max: number) => {
    updateFilters({
      minPrice: min > filterData.priceRange.min ? String(min) : null,
      maxPrice: max < filterData.priceRange.max ? String(max) : null,
    });
  };


  // Clear all filters
  const clearAllFilters = () => {
    if (!isMounted || !pathname) return;
    router.replace(pathname || "/shop", { scroll: false });
  };

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return !!(
      activeFilters.brands.length > 0 ||
      activeFilters.minPrice ||
      activeFilters.maxPrice
    );
  }, [activeFilters]);

  // Show loading state only during initial static filter load
  // Return consistent skeleton for both server and client initial render
  if (!isMounted || (loading && !categoriesLoaded)) {
      return (
        <aside className="w-full lg:w-64 space-y-4" suppressHydrationWarning>
          <div className="animate-pulse space-y-4" suppressHydrationWarning>
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded" suppressHydrationWarning></div>
            ))}
          </div>
        </aside>
      );
  }

  return (
    <aside className="w-full lg:w-64 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Category Filter */}
      <FilterSection
        title="Department"
        isExpanded={expandedSections.has("category")}
        onToggle={() => toggleSection("category")}
        count={activeFilters.categories.length}
      >
        <CategoryFilter
          categories={filterData.categories}
          selectedCategories={activeFilters.categories}
          onToggle={handleCategoryToggle}
        />
      </FilterSection>

      {/* Price Range Filter */}
      <FilterSection
        title="Price"
        isExpanded={expandedSections.has("price")}
        onToggle={() => toggleSection("price")}
        count={
          activeFilters.minPrice || activeFilters.maxPrice ? 1 : 0
        }
      >
        {filterData.priceRange.max > filterData.priceRange.min && (
          <PriceRangeSlider
            min={filterData.priceRange.min}
            max={filterData.priceRange.max}
            minValue={activeFilters.minPrice ? parseFloat(activeFilters.minPrice) : filterData.priceRange.min}
            maxValue={activeFilters.maxPrice ? parseFloat(activeFilters.maxPrice) : filterData.priceRange.max}
            onChange={handlePriceChange}
          />
        )}
      </FilterSection>

      {/* Brand Filter - Only show brands related to current category */}
      <FilterSection
        title="Brand"
        isExpanded={expandedSections.has("brand")}
        onToggle={() => toggleSection("brand")}
        count={activeFilters.brands.length}
      >
        {brandsLoading ? (
          <div className="py-4">
            <div className="animate-pulse space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-6 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ) : filterData.brands.length > 0 ? (
          <BrandFilter
            brands={filterData.brands}
            selectedBrands={activeFilters.brands}
            onToggle={handleBrandToggle}
          />
        ) : (
          <p className="text-sm text-gray-500 py-2">No brands available for this category</p>
        )}
      </FilterSection>
    </aside>
  );
}

// Category Filter Component - Clickable links without checkboxes
function CategoryFilter({
  categories,
  selectedCategories,
  onToggle,
}: {
  categories: any[];
  selectedCategories: string[];
  onToggle: (slug: string) => void;
}) {
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [categoryChildren, setCategoryChildren] = useState<Record<number, any[]>>({});

  const toggleExpand = async (categoryId: number, categorySlug: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
      // Load children if not already loaded
      if (!categoryChildren[categoryId]) {
        try {
          const res = await fetch(`/api/filters/categories?category=${encodeURIComponent(categorySlug)}`);
          const json = await res.json();
          setCategoryChildren((prev) => ({ ...prev, [categoryId]: json.categories || [] }));
        } catch {
          setCategoryChildren((prev) => ({ ...prev, [categoryId]: [] }));
        }
      }
    }
    setExpandedCategories(newExpanded);
  };

  return (
    <div className="space-y-1 max-h-96 overflow-y-auto">
      {categories.length === 0 ? (
        <p className="text-sm text-gray-500 py-2">No categories available</p>
      ) : (
        categories.map((cat) => {
          const categorySlug = cat.slug || cat.name?.toLowerCase().replace(/\s+/g, "-");
          const isSelected = selectedCategories.includes(categorySlug);
          const hasChildren = cat.count > 0 || expandedCategories.has(cat.id);
          const children = categoryChildren[cat.id] || [];
          const isExpanded = expandedCategories.has(cat.id);

          return (
            <div key={cat.id || categorySlug}>
              <div className="flex items-center group py-1.5">
                <button
                  type="button"
                  onClick={() => onToggle(categorySlug)}
                  className={`flex-1 text-left text-sm transition-colors cursor-pointer ${
                    isSelected
                      ? "text-blue-600 font-medium"
                      : "text-gray-700 group-hover:text-gray-900"
                  }`}
                >
                  {cat.name}
                  {cat.count !== undefined && cat.count > 0 && (
                    <span className="ml-1 text-gray-500">({cat.count})</span>
                  )}
                </button>
                {hasChildren && (
                  <button
                    type="button"
                    onClick={(e) => toggleExpand(cat.id, categorySlug, e)}
                    className="ml-2 p-0.5 text-gray-400 hover:text-gray-600 flex-shrink-0"
                    aria-label={isExpanded ? "Collapse" : "Expand"}
                  >
                    <svg
                      className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                )}
              </div>
              {/* Child categories */}
              {isExpanded && children.length > 0 && (
                <ul className="ml-6 mt-1 space-y-1 border-l border-gray-200 pl-2">
                  {children.map((child: any) => {
                    const childSlug = child.slug || child.name?.toLowerCase().replace(/\s+/g, "-");
                    const isChildSelected = selectedCategories.includes(childSlug);
                    return (
                      <li key={child.id || childSlug}>
                        <button
                          type="button"
                          onClick={() => onToggle(childSlug)}
                          className={`text-sm transition-colors cursor-pointer ${
                            isChildSelected
                              ? "text-blue-600 font-medium"
                              : "text-gray-700 hover:text-gray-900"
                          }`}
                        >
                          {child.name}
                          {child.count !== undefined && child.count > 0 && (
                            <span className="ml-1 text-gray-500">({child.count})</span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

// Brand Filter Component
function BrandFilter({
  brands,
  selectedBrands,
  onToggle,
}: {
  brands: any[];
  selectedBrands: string[];
  onToggle: (slug: string) => void;
}) {
  return (
    <div className="space-y-1 max-h-64 overflow-y-auto">
      {brands.length === 0 ? (
        <p className="text-sm text-gray-500 py-2">No brands available</p>
      ) : (
        brands.map((brand) => {
          const brandSlug = brand.slug || brand.name?.toLowerCase().replace(/\s+/g, "-");
          const isSelected = selectedBrands.includes(brandSlug);
          return (
            <label key={brand.id || brandSlug} className="flex items-center cursor-pointer group py-1.5">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggle(brandSlug)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span
                className={`ml-2 text-sm ${
                  isSelected
                    ? "text-blue-600 font-medium"
                    : "text-gray-700 group-hover:text-gray-900"
                }`}
              >
                {brand.name}
                {brand.count !== undefined && brand.count > 0 && (
                  <span className="ml-1 text-gray-500">({brand.count})</span>
                )}
              </span>
            </label>
          );
        })
      )}
    </div>
  );
}


