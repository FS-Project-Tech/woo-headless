"use client";

import { useEffect, useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard";
import ProductsSlider from "@/components/ProductsSlider";
import { getRecentSearchTerms } from "@/lib/history";

type UnifiedProduct = {
  id: number;
  name: string;
  slug: string;
  price: string;
  regular_price?: string;
  on_sale?: boolean;
  sku?: string | null;
  images?: Array<{ src: string; alt?: string }>;
  average_rating?: string;
  rating_count?: number;
  tax_class?: string;
};

export default function RecommendedSection() {
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<UnifiedProduct[]>([]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    let mounted = true;
    const terms = getRecentSearchTerms();
    if (terms.length === 0) return; // no history yet

    (async () => {
      try {
        setLoading(true);
        const top = terms.slice(0, 4);
        const responses = await Promise.all(
          top.map((t) => fetch(`/api/search-unified?q=${encodeURIComponent(t)}`, { cache: "no-store" }).then((r) => r.ok ? r.json() : { products: [] }))
        );
        const all = responses.flatMap((r: any) => Array.isArray(r.products) ? r.products : []);
        const seen = new Set<number>();
        const unique = all.filter((p: any) => {
          if (!p || typeof p.id !== 'number') return false;
          if (seen.has(p.id)) return false;
          seen.add(p.id);
          return true;
        }).slice(0, 10);
        if (mounted) setProducts(unique);
      } catch {
        if (mounted) setProducts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [isMounted]);

  const hasData = products.length > 0;

  // Don't render anything until mounted to prevent hydration mismatch
  if (!isMounted) return null;
  if (!loading && !hasData) return null; // hide section if nothing to show

  return (
    <section className="mb-10">
      <div className="mx-auto w-[85vw] px-4 sm:px-6 lg:px-8">
        <div className="rounded-xl bg-violet-50 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Products you may be looking for</h2>
              <p className="text-sm text-gray-600">Based on your recent searches</p>
            </div>
          </div>
          {loading && products.length === 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[420px] animate-pulse rounded-xl border border-gray-200 bg-white" />
              ))}
            </div>
          ) : (
            <ProductsSlider products={products} />
          )}
        </div>
      </div>
    </section>
  );
}


