'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import ProductGrid from '@/components/product/ProductGrid';
import { useCategoryBySlug, useProducts } from '@/hooks/useWooCommerce';
import { ProductFilters } from '@/types/woocommerce';

export default function CategoryDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { data: category, isLoading: categoryLoading } = useCategoryBySlug(slug);
  
  const filters: ProductFilters = {
    category: category?.id || 0,
    per_page: 12,
    orderby: 'date',
    order: 'desc',
  };
  
  const { data: productsData, isLoading: productsLoading } = useProducts(filters);

  if (categoryLoading) {
    return (
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
    );
  }

  if (!category) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Category Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The category you're looking for doesn't exist or has been removed.
            </p>
            <a
              href="/categories"
              className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Back to Categories
            </a>
          </div>
        </div>
      </Layout>
    );
  }

  const products = productsData?.data || [];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
            <a href="/" className="hover:text-primary">Home</a>
            <span>/</span>
            <a href="/categories" className="hover:text-primary">Categories</a>
            <span>/</span>
            <span className="text-foreground">{category.name}</span>
          </nav>
        </motion.div>

        {/* Category Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {category.name}
          </h1>
          {category.description && (
            <div 
              className="text-muted-foreground max-w-3xl"
              dangerouslySetInnerHTML={{ __html: category.description }}
            />
          )}
          <p className="text-sm text-muted-foreground mt-4">
            {category.count} {category.count === 1 ? 'product' : 'products'} in this category
          </p>
        </motion.div>

        {/* Products Grid */}
        <ProductGrid
          products={products}
          isLoading={productsLoading}
          columns={4}
        />

        {/* No Products Message */}
        {!productsLoading && products.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <h2 className="text-xl font-medium text-muted-foreground mb-4">
              No products found in this category
            </h2>
            <p className="text-muted-foreground mb-6">
              This category doesn't have any products yet. Check back later or browse other categories.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/categories"
                className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Browse Categories
              </a>
              <a
                href="/products"
                className="px-6 py-3 border border-border rounded-md hover:bg-accent transition-colors"
              >
                View All Products
              </a>
            </div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
