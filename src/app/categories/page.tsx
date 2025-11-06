'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import CategoryGrid from '@/components/product/CategoryGrid';
import { useCategories } from '@/hooks/useWooCommerce';

export default function CategoriesPage() {
  const { data: categories, isLoading } = useCategories();

  // Filter categories with products
  const categoriesWithProducts = categories?.filter(category => category.count > 0) || [];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Product Categories
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore our wide range of product categories and find exactly what you're looking for.
          </p>
        </motion.div>

        {/* Categories Grid */}
        <CategoryGrid
          categories={categoriesWithProducts}
          isLoading={isLoading}
          columns={4}
          size="lg"
        />

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Can't find what you're looking for?
          </h2>
          <p className="text-muted-foreground mb-6">
            Browse all our products or use our search feature to find specific items.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/products"
              className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              View All Products
            </a>
            <a
              href="/search"
              className="px-6 py-3 border border-border rounded-md hover:bg-accent transition-colors"
            >
              Search Products
            </a>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}

