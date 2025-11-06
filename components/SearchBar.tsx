"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { searchIndex, SearchIndexItem } from '@/lib/searchIndex';
import { addSearchTerm } from '@/lib/history';

/**
 * Highlight matched keywords in text
 */
function highlightMatches(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  
  const qLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let index = textLower.indexOf(qLower);
  
  while (index !== -1) {
    // Add text before match
    if (index > lastIndex) {
      parts.push(text.slice(lastIndex, index));
    }
    // Add highlighted match
    parts.push(
      <mark key={index} className="bg-yellow-200 font-semibold text-gray-900 px-0.5 rounded">
        {text.slice(index, index + query.length)}
      </mark>
    );
    lastIndex = index + query.length;
    index = textLower.indexOf(qLower, lastIndex);
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  
  return parts.length > 0 ? <>{parts}</> : text;
}

export default function SearchBar({ className = '' }: { className?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{
    products: SearchIndexItem[];
    categories: SearchIndexItem[];
    brands: SearchIndexItem[];
  }>({ products: [], categories: [], brands: [] });
  const [productCount, setProductCount] = useState<number | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isIndexReady, setIsIndexReady] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Mark mounted and initialize search index
  useEffect(() => {
    setMounted(true);
    searchIndex.initialize().then(() => {
      setIsIndexReady(searchIndex.isReady());
      setProductCount(searchIndex.getTotalCount());
    });
    
    // Fetch product count from API as fallback
    fetch('/api/search/count')
      .then(res => res.json())
      .then(data => {
        if (data.count && data.count > 0) {
          setProductCount(data.count);
        }
      })
      .catch(() => {});
  }, []);
  // Note: Do NOT early-return based on `mounted` to keep Hooks order stable.


  // Debounced search (guarded by mounted)
  useEffect(() => {
    if (!mounted) return;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!query.trim() || query.trim().length < 2) {
      setResults({ products: [], categories: [], brands: [] });
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setIsOpen(true);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        let searchResults: {
          products: SearchIndexItem[];
          categories: SearchIndexItem[];
          brands: SearchIndexItem[];
        };

        // Try client-side search first (fastest)
        if (isIndexReady && searchIndex.isReady()) {
          const allResults = searchIndex.search(query, 30);
          searchResults = {
            products: allResults.filter(r => r.type === 'product').slice(0, 10),
            categories: allResults.filter(r => r.type === 'category').slice(0, 8),
            brands: allResults.filter(r => r.type === 'brand').slice(0, 8),
          };
        } else {
          // Fallback to API search
          const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
            cache: 'no-store',
          });
          const data = await res.json();
          
          // Transform API results to SearchIndexItem format
          searchResults = {
            products: (data.products || []).map((p: any) => ({
              key: `product_${p.id}`,
              id: p.id,
              type: 'product' as const,
              name: p.name,
              slug: p.slug,
              sku: p.sku,
              price: p.price,
              regularPrice: p.regular_price,
              onSale: p.on_sale,
              image: p.image,
              searchableText: '',
              tokens: [],
            })),
            categories: (data.categories || []).map((c: any) => ({
              key: `category_${c.id}`,
              id: c.id,
              type: 'category' as const,
              name: c.name,
              slug: c.slug,
              searchableText: '',
              tokens: [],
            })),
            brands: (data.brands || []).map((b: any) => {
              const id = typeof b.id === 'string' ? parseInt(b.id, 10) || 0 : b.id;
              return {
                key: `brand_${id}`,
                id,
                type: 'brand' as const,
                name: b.name,
                slug: b.slug,
                searchableText: '',
                tokens: [],
              };
            }),
          };
        }

        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
        setResults({ products: [], categories: [], brands: [] });
      } finally {
        setIsLoading(false);
      }
    }, 150); // 150ms debounce

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, isIndexReady, mounted]);

  // Close dropdown on outside click (guarded by mounted)
  useEffect(() => {
    if (!mounted) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mounted]);

  // Build flat list for keyboard navigation
  const flatList = useMemo(() => {
    const items: Array<{
      type: 'heading' | 'item';
      label: string;
      route?: string;
      item?: SearchIndexItem;
      index: number;
    }> = [];
    let itemIndex = 0;

    const addGroup = (title: string, arr: SearchIndexItem[], routeFn: (item: SearchIndexItem) => string) => {
      if (arr.length === 0) return;
      items.push({ type: 'heading', label: title, index: -1 });
      for (const item of arr) {
        items.push({
          type: 'item',
          label: item.name,
          route: routeFn(item),
          item,
          index: itemIndex++,
        });
      }
    };

    addGroup('Products', results.products, (item) => `/products/${item.slug}`);
    addGroup('Categories', results.categories, (item) => `/product-category/${item.slug}`);
    addGroup('Brands', results.brands, (item) => `/shop?brand=${encodeURIComponent(item.slug)}`);

    return items;
  }, [results]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return;

    const itemsOnly = flatList.filter(x => x.type === 'item');
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev < itemsOnly.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.max(0, prev - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = itemsOnly[highlightedIndex];
      if (selected && selected.route) {
        router.push(selected.route);
        setIsOpen(false);
        setQuery('');
      } else if (query.trim()) {
        // Navigate to search results page
        addSearchTerm(query);
        router.push(`/shop?search=${encodeURIComponent(query)}`);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }, [isOpen, flatList, highlightedIndex, query, router]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.querySelector(`[data-index="${highlightedIndex}"]`);
      if (item) {
        item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [highlightedIndex]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      addSearchTerm(query);
      router.push(`/shop?search=${encodeURIComponent(query)}`);
      setIsOpen(false);
    }
  };

  const handleItemClick = (route: string) => {
    if (query.trim()) addSearchTerm(query);
    router.push(route);
    setIsOpen(false);
    setQuery('');
  };

  const renderProduct = (item: SearchIndexItem) => {
    const price = parseFloat(item.price || '0');
    const regularPrice = parseFloat(item.regularPrice || '0');
    const onSale = item.onSale && regularPrice > price && regularPrice > 0;
    const discount = onSale ? Math.round(((regularPrice - price) / regularPrice) * 100) : 0;

    return (
      <div className="flex items-center gap-3">
        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-gray-100">
          {item.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-[10px] text-gray-400">No Img</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-gray-900">
            {highlightMatches(item.name, query)}
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-gray-600">
            {item.sku && (
              <span className={`rounded px-1.5 py-0.5 ${
                item.sku.toLowerCase().includes(query.toLowerCase())
                  ? 'bg-blue-100 font-semibold text-blue-700'
                  : 'bg-gray-100'
              }`}>
                SKU: {highlightMatches(item.sku, query)}
              </span>
            )}
            {onSale ? (
              <>
                <span className="font-semibold text-gray-900">${price.toFixed(2)}</span>
                <span className="line-through text-red-500">${regularPrice.toFixed(2)}</span>
                <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
                  -{discount}%
                </span>
              </>
            ) : (
              price > 0 && (
                <span className="font-semibold text-gray-900">${price.toFixed(2)}</span>
              )
            )}
          </div>
        </div>
      </div>
    );
  };

  const hasResults = results.products.length > 0 || results.categories.length > 0 || results.brands.length > 0;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2.5 shadow-sm transition-shadow focus-within:border-blue-500 focus-within:shadow-md">
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 flex-shrink-0 text-gray-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlightedIndex(-1);
            }}
            onFocus={() => {
              if (query.trim().length >= 2) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              productCount !== null
                ? `Search from ${productCount.toLocaleString()} products...`
                : 'Search products, brands, categories...'
            }
            className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
            aria-label="Search products"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <button
            type="submit"
            className="hidden md:flex items-center rounded-full bg-gray-900 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-black"
          >
            Search
          </button>
        </div>
      </form>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 top-full z-50 mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
          >
            <ul
              ref={listRef}
              className="max-h-96 overflow-auto"
              role="listbox"
            >
              {isLoading && (
                <li className="px-4 py-8 text-center text-sm text-gray-500">
                  <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900"></div>
                  <span className="ml-2">Searching...</span>
                </li>
              )}

              {!isLoading && !hasResults && query.trim().length >= 2 && (
                <li className="px-4 py-8 text-center text-sm text-gray-500">
                  <p className="font-medium">No results found</p>
                  <p className="mt-1 text-xs">Try a different search term</p>
                </li>
              )}

              {!isLoading && hasResults && (
                <>
                  {flatList.map((row, i) => {
                    if (row.type === 'heading') {
                      return (
                        <li
                          key={`heading-${i}`}
                          className="border-t border-gray-100 bg-gray-50/50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 first:border-t-0"
                        >
                          {row.label}
                        </li>
                      );
                    }

                    const isHighlighted = row.index === highlightedIndex;
                    
                    return (
                      <li
                        key={`item-${i}`}
                        data-index={row.index}
                        className={`cursor-pointer px-4 py-3 transition-colors ${
                          isHighlighted ? 'bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                        onMouseEnter={() => setHighlightedIndex(row.index)}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          if (row.route) handleItemClick(row.route);
                        }}
                        role="option"
                        aria-selected={isHighlighted}
                      >
                        {row.item?.type === 'product' ? (
                          renderProduct(row.item)
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400">•</span>
                            <span className="font-medium text-gray-900">
                              {highlightMatches(row.label, query)}
                            </span>
                          </div>
                        )}
                      </li>
                    );
                  })}

                  <li className="border-t border-gray-100 px-4 py-3 text-right">
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        if (query.trim()) {
                          addSearchTerm(query);
                          router.push(`/shop?search=${encodeURIComponent(query)}`);
                          setIsOpen(false);
                        }
                      }}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      View all results for &quot;{query}&quot;
                    </button>
                  </li>
                </>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
