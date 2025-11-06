'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import ProductGrid from '@/components/product/ProductGrid';
import { useSearchProducts } from '@/hooks/useWooCommerce';

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const { data: searchResults, isLoading } = useSearchProducts(query, 20);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Search Results
          </h1>
          {query && (
            <p className="text-muted-foreground">
              Results for "{query}"
              {searchResults && (
                <span className="ml-2">
                  ({searchResults.total} {searchResults.total === 1 ? 'result' : 'results'})
                </span>
              )}
            </p>
          )}
        </motion.div>

        {/* Search Results */}
        {query ? (
          <ProductGrid
            products={searchResults?.products || []}
            isLoading={isLoading}
            columns={4}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <h2 className="text-xl font-medium text-muted-foreground mb-4">
              Enter a search term to find products
            </h2>
            <p className="text-muted-foreground">
              Use the search bar in the header to search for products.
            </p>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-muted rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="h-48 bg-muted rounded-lg"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-6 bg-muted rounded w-1/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    }>
      <SearchContent />
    </Suspense>
  );
}
