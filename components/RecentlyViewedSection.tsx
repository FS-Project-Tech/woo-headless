"use client";

import { useEffect, useState } from "react";
import MiniProductsSlider from "@/components/MiniProductsSlider";

type Product = {
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

function getViewedIds(): number[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = window.localStorage.getItem('_viewed_products');
    const list: Array<{ id: number; cats: number[] }> = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.map((x) => x.id) : [];
  } catch { return []; }
}

export default function RecentlyViewedSection() {
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    const ids = getViewedIds();
    if (!ids.length) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/products-by-ids?ids=${ids.slice(0, 10).join(',')}`, { cache: 'no-store' });
        const json = await res.json();
        if (mounted) setProducts(json.products || []);
      } catch {
        if (mounted) setProducts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [isMounted]);

  // Don't render anything until mounted to prevent hydration mismatch
  if (!isMounted) return null;
  if (!loading && products.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="mx-auto w-[85vw] px-4 sm:px-6 lg:px-8">
        <div className="rounded-xl bg-blue-50 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Continue browsing</h2>
              <p className="text-sm text-gray-600">Recently viewed by you</p>
            </div>
          </div>
          {loading && products.length === 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[420px] animate-pulse rounded-xl border border-gray-200 bg-white" />
              ))}
            </div>
          ) : (
            <MiniProductsSlider products={products as any} />
          )}
        </div>
      </div>
    </section>
  );
}


