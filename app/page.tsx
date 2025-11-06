import Link from "next/link";
import { Suspense } from "react";
import HeroDualSlider from "@/components/HeroDualSlider";
import { fetchHeroSliders } from "@/lib/cms";
import ProductSection from "@/components/ProductSection";
import RecommendedSection from "@/components/RecommendedSection";
import CategoriesSection from "@/components/CategoriesSection";
import MarketingUpdatesSection from "@/components/MarketingUpdatesSection";
import NDISCTASection from "@/components/NDISCTASection";
import RecentlyViewedSection from "@/components/RecentlyViewedSection";
import TrendingSection from "@/components/TrendingSection";
import NewsletterSection from "@/components/NewsletterSection";

export const revalidate = 300; // Revalidate every 5 minutes (reduced frequency)

export default async function Home() {
  // Don't block initial render - fetch sliders in parallel with other data
  const slidersPromise = fetchHeroSliders().catch(() => ({ left: [], right: [] }));
  const continenceSlug = process.env.NEXT_PUBLIC_CONTINENCE_CATEGORY_SLUG || "continence-care";
  
  // Resolve sliders but don't block
  const sliders = await slidersPromise;

  return (
    <div className="min-h-screen">
      {/* Header dual sliders */}
      <div className="py-4">
        <HeroDualSlider leftImages={sliders.left} rightImages={sliders.right} />
      </div>

      {/* Personalized recommendations */}
      <Suspense fallback={<div className="h-64 animate-pulse bg-gray-100 rounded" />}>
        <RecommendedSection />
      </Suspense>

      {/* Categories Section */}
      <Suspense fallback={<div className="h-64 animate-pulse bg-gray-100 rounded mb-10" />}>
        <CategoriesSection />
      </Suspense>

      {/* Recently viewed */}
      <Suspense fallback={<div className="h-64 animate-pulse bg-gray-100 rounded" />}>
        <RecentlyViewedSection />
      </Suspense>

      {/* Trending */}
      <Suspense fallback={<div className="h-64 animate-pulse bg-gray-100 rounded" />}>
        <TrendingSection />
      </Suspense>

      {/* Marketing & Updates Section */}
      <MarketingUpdatesSection />

      {/* NDIS CTA Section */}
      <NDISCTASection />

      {/* Sections */}
      <Suspense fallback={<div className="h-64 animate-pulse bg-gray-100 rounded" />}>
        <ProductSection
          title="Continence care products"
          subtitle="Trusted protection for daily confidence. Explore our bestsellers."
          viewAllHref={`/product-category/${encodeURIComponent(continenceSlug)}`}
          bgClassName="bg-rose-50"
          query={{ categorySlug: continenceSlug }}
        />
      </Suspense>

      {/* Interstitial CTA banner (hidden on mobile) */}
      <div className="hidden sm:block mx-auto w-[85vw] px-4 sm:px-6 lg:px-8 mb-16">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-900 to-gray-700 p-8">
          <div className="max-w-xl">
            <h3 className="text-2xl font-bold text-white">Save more with bundles</h3>
            <p className="mt-2 text-gray-200">Mix-and-match essentials and get extra discounts at checkout.</p>
            <Link href="/shop?on_sale=true" className="mt-4 inline-flex rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100">Shop deals</Link>
          </div>
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        </div>
      </div>

      <Suspense fallback={<div className="h-64 animate-pulse bg-gray-100 rounded" />}>
        <ProductSection
          title="Latest Published"
          subtitle="Fresh arrivals straight from our catalog. Updated regularly."
          viewAllHref="/shop?orderby=date&order=desc"
          bgClassName="bg-sky-50"
          query={{ orderby: "date", order: "desc" }}
        />
      </Suspense>

      <Suspense fallback={<div className="h-64 animate-pulse bg-gray-100 rounded" />}>
        <ProductSection
          title="Clearance Products"
          subtitle="Last-chance items at exceptional prices. Limited stock."
          viewAllHref="/shop?on_sale=true"
          bgClassName="bg-amber-50"
          query={{ on_sale: true }}
        />
      </Suspense>

      {/* Interstitial image/banner (hidden on mobile) */}
      <div className="hidden sm:block mx-auto w-[85vw] px-4 sm:px-6 lg:px-8 mb-16">
        <div className="relative overflow-hidden rounded-2xl">
          <img src="https://picsum.photos/1600/320?random=21" alt="Promotional banner" className="h-40 w-full object-cover" />
        </div>
      </div>

      <Suspense fallback={<div className="h-64 animate-pulse bg-gray-100 rounded" />}>
        <ProductSection
          title="Featured Products"
          subtitle="Handpicked favorites our customers love the most."
          viewAllHref="/shop?featured=true"
          bgClassName="bg-emerald-50"
          query={{ featured: true }}
        />
      </Suspense>

      {/* Newsletter */}
      <NewsletterSection />
    </div>
  );
}
