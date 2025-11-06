"use client";

import Breadcrumbs from "@/components/Breadcrumbs";
import ProductGrid from "@/components/ProductGrid";

export default function ProductsPageClient() {
  return (
    <div className="min-h-screen py-12">
      <div className="mx-auto w-[85vw] px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Shop' }]} />
        
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Our Products</h1>
        </div>
        
        <ProductGrid />
      </div>
    </div>
  );
}

