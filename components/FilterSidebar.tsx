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

  // Mark as mounted after hydration and expand all sections by default
  useEffect(() => {
    setIsMounted(true);
    // Get pathname and search params from window to avoid hydration mismatch
    if (typeof window !== 'undefined') {
      setPathname(window.location.pathname);
      setSearchParamsString(window.location.search);
    }
    // Expand all sections by default after mount
    setExpandedSections(new Set(["category", "price", "brand", "rating", "availability", "sort"]));
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

  // Fetch filter data based on selected categories
  useEffect(() => {
    if (!isMounted) return;

    const fetchFilterData = async () => {
      setLoading(true);
      try {
        // Get the first selected category for dynamic filtering
        // Read directly from searchParams to avoid dependency on activeFilters
        const categoriesFromUrl = searchParams.get("categories")?.split(",").filter(Boolean) || [];
        const selectedCat = categoriesFromUrl[0] || undefined;
        const categoryParam = selectedCat ? `?category=${encodeURIComponent(selectedCat)}` : "";
        
        const [categoriesRes, brandsRes, priceRes] = await Promise.all([
          // Always fetch top-level categories for the main filter list
          fetch("/api/filters/categories").catch(() => null),
          fetch("/api/filters/brands" + categoryParam).catch(() => null),
          fetch("/api/filters/price-range" + categoryParam).catch(() => null),
        ]);

        if (categoriesRes?.ok) {
          const catData = await categoriesRes.json();
          setFilterData((prev) => ({ ...prev, categories: catData.categories || [] }));
        }

        if (brandsRes?.ok) {
          const brandData = await brandsRes.json();
          setFilterData((prev) => ({ ...prev, brands: brandData.brands || [] }));
        }

        if (priceRes?.ok) {
          const priceData = await priceRes.json();
          setFilterData((prev) => ({
            ...prev,
            priceRange: { min: priceData.min || 0, max: priceData.max || 1000 },
          }));
        }
      } catch (error) {
        console.error("Error fetching filter data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFilterData();
  }, [searchParamsString, isMounted]); // Removed categorySlug and searchParams to keep array stable

  // Get current filter values from URL
  const activeFilters = useMemo(() => {
    if (!isMounted) {
      return {
        categories: [] as string[],
        brands: [] as string[],
        minPrice: "",
        maxPrice: "",
        minRating: "",
        availability: "",
        sortBy: "relevance",
      };
    }
    return {
      categories: searchParams.get("categories")?.split(",").filter(Boolean) || [],
      brands: searchParams.get("brands")?.split(",").filter(Boolean) || [],
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      minRating: searchParams.get("minRating") || "",
      availability: searchParams.get("availability") || "",
      sortBy: searchParams.get("sortBy") || "relevance",
    };
  }, [searchParams, isMounted]);

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

  // Handle category filter - toggle category like brands
  const handleCategoryToggle = (categorySlug: string) => {
    if (!isMounted) return;
    const currentCategories = activeFilters.categories || [];
    const newCategories = currentCategories.includes(categorySlug)
      ? currentCategories.filter((c) => c !== categorySlug)
      : [...currentCategories, categorySlug];
    updateFilters({ categories: newCategories });
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

  // Handle rating filter
  const handleRatingChange = (rating: string) => {
    updateFilters({ minRating: rating === activeFilters.minRating ? null : rating });
  };

  // Handle availability filter
  const handleAvailabilityChange = (availability: string) => {
    updateFilters({ availability: availability === activeFilters.availability ? null : availability });
  };

  // Handle sort
  const handleSortChange = (sortBy: string) => {
    updateFilters({ sortBy: sortBy === "relevance" ? null : sortBy });
  };

  // Clear all filters
  const clearAllFilters = () => {
    if (!isMounted || !pathname) return;
    router.replace(pathname || "/shop", { scroll: false });
  };

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return !!(
      activeFilters.categories.length > 0 ||
      activeFilters.brands.length > 0 ||
      activeFilters.minPrice ||
      activeFilters.maxPrice ||
      activeFilters.minRating ||
      activeFilters.availability ||
      activeFilters.sortBy !== "relevance"
    );
  }, [activeFilters]);

  // Show loading state during initial mount or data fetch
  if (!isMounted) {
    return (
      <aside className="w-full lg:w-64 space-y-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </aside>
    );
  }
  
  if (loading) {
    return (
      <aside className="w-full lg:w-64 space-y-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
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

      {/* Brand Filter */}
      {filterData.brands.length > 0 && (
        <FilterSection
          title="Brand"
          isExpanded={expandedSections.has("brand")}
          onToggle={() => toggleSection("brand")}
          count={activeFilters.brands.length}
        >
          <BrandFilter
            brands={filterData.brands}
            selectedBrands={activeFilters.brands}
            onToggle={handleBrandToggle}
          />
        </FilterSection>
      )}

      {/* Rating Filter */}
      <FilterSection
        title="Customer Rating"
        isExpanded={expandedSections.has("rating")}
        onToggle={() => toggleSection("rating")}
        count={activeFilters.minRating ? 1 : 0}
      >
        <RatingFilter
          selectedRating={activeFilters.minRating}
          onSelect={handleRatingChange}
        />
      </FilterSection>

      {/* Availability Filter */}
      <FilterSection
        title="Availability"
        isExpanded={expandedSections.has("availability")}
        onToggle={() => toggleSection("availability")}
        count={activeFilters.availability ? 1 : 0}
      >
        <AvailabilityFilter
          selected={activeFilters.availability}
          onSelect={handleAvailabilityChange}
        />
      </FilterSection>

      {/* Sort */}
      <FilterSection
        title="Sort By"
        isExpanded={expandedSections.has("sort")}
        onToggle={() => toggleSection("sort")}
      >
        <SortFilter
          selected={activeFilters.sortBy}
          onSelect={handleSortChange}
        />
      </FilterSection>
    </aside>
  );
}

// Category Filter Component with expandable children
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
              <label className="flex items-center cursor-pointer group py-1.5">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggle(categorySlug)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span
                  className={`ml-2 flex-1 text-sm ${
                    isSelected
                      ? "text-blue-600 font-medium"
                      : "text-gray-700 group-hover:text-gray-900"
                  }`}
                >
                  {cat.name}
                  {cat.count !== undefined && cat.count > 0 && (
                    <span className="ml-1 text-gray-500">({cat.count})</span>
                  )}
                </span>
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
              </label>
              {/* Child categories */}
              {isExpanded && children.length > 0 && (
                <ul className="ml-6 mt-1 space-y-1 border-l border-gray-200 pl-2">
                  {children.map((child: any) => {
                    const childSlug = child.slug || child.name?.toLowerCase().replace(/\s+/g, "-");
                    const isChildSelected = selectedCategories.includes(childSlug);
                    return (
                      <li key={child.id || childSlug}>
                        <label className="flex items-center cursor-pointer group py-1">
                          <input
                            type="checkbox"
                            checked={isChildSelected}
                            onChange={() => onToggle(childSlug)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span
                            className={`ml-2 text-sm ${
                              isChildSelected
                                ? "text-blue-600 font-medium"
                                : "text-gray-700 group-hover:text-gray-900"
                            }`}
                          >
                            {child.name}
                            {child.count !== undefined && child.count > 0 && (
                              <span className="ml-1 text-gray-500">({child.count})</span>
                            )}
                          </span>
                        </label>
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

// Rating Filter Component
function RatingFilter({
  selectedRating,
  onSelect,
}: {
  selectedRating: string;
  onSelect: (rating: string) => void;
}) {
  const ratings = [5, 4, 3, 2, 1];
  return (
    <div className="space-y-1">
      {ratings.map((rating) => {
        const isSelected = selectedRating === String(rating);
        return (
          <label
            key={rating}
            className="flex items-center cursor-pointer group py-1.5"
          >
            <input
              type="radio"
              name="rating"
              checked={isSelected}
              onChange={() => onSelect(String(rating))}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className={`ml-2 text-sm ${isSelected ? "text-blue-600 font-medium" : "text-gray-700"}`}>
              <span className="text-yellow-500">
                {"★".repeat(rating)}
                {"☆".repeat(5 - rating)}
              </span>
              <span className="ml-1">& Up</span>
            </span>
          </label>
        );
      })}
    </div>
  );
}

// Availability Filter Component
function AvailabilityFilter({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (value: string) => void;
}) {
  const options = [
    { value: "in_stock", label: "In Stock" },
    { value: "out_of_stock", label: "Out of Stock" },
  ];
  return (
    <div className="space-y-1">
      {options.map((option) => {
        const isSelected = selected === option.value;
        return (
          <label
            key={option.value}
            className="flex items-center cursor-pointer group py-1.5"
          >
            <input
              type="radio"
              name="availability"
              checked={isSelected}
              onChange={() => onSelect(option.value)}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span
              className={`ml-2 text-sm ${
                isSelected ? "text-blue-600 font-medium" : "text-gray-700 group-hover:text-gray-900"
              }`}
            >
              {option.label}
            </span>
          </label>
        );
      })}
    </div>
  );
}

// Sort Filter Component
function SortFilter({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (value: string) => void;
}) {
  const options = [
    { value: "relevance", label: "Relevance" },
    { value: "price_low", label: "Price: Low to High" },
    { value: "price_high", label: "Price: High to Low" },
    { value: "newest", label: "Newest First" },
    { value: "rating", label: "Top Rated" },
    { value: "popularity", label: "Most Popular" },
  ];
  return (
    <div className="space-y-1">
      {options.map((option) => {
        const isSelected = selected === option.value;
        return (
          <label
            key={option.value}
            className="flex items-center cursor-pointer group py-1.5"
          >
            <input
              type="radio"
              name="sort"
              checked={isSelected}
              onChange={() => onSelect(option.value)}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span
              className={`ml-2 text-sm ${
                isSelected ? "text-blue-600 font-medium" : "text-gray-700 group-hover:text-gray-900"
              }`}
            >
              {option.label}
            </span>
          </label>
        );
      })}
    </div>
  );
}

