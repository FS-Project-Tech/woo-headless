"use client";

import dynamic from "next/dynamic";

// Dynamically import MiniProductsSlider - heavy component with Swiper
const MiniProductsSlider = dynamic(() => import("@/components/MiniProductsSlider"), {
  loading: () => (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-[200px] animate-pulse rounded-lg border border-gray-200 bg-white" />
      ))}
    </div>
  ),
  ssr: false, // Client-side only for Swiper
});

interface TrendingSectionClientProps {
  products: any[];
}

export default function TrendingSectionClient({ products }: TrendingSectionClientProps) {
  if (!products || products.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="mx-auto w-[85vw] px-4 sm:px-6 lg:px-8">
        <div className="rounded-xl bg-indigo-50 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Trending now</h2>
              <p className="text-sm text-gray-600">Popular with shoppers this week</p>
            </div>
          </div>
          <MiniProductsSlider products={products as any} />
        </div>
      </div>
    </section>
  );
}

