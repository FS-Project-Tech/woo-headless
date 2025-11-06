'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { ArrowRight } from 'lucide-react';
import { useCategories } from '@/hooks/useWooCommerce';
import CategoryGrid from '@/components/product/CategoryGrid';

interface CategoriesSectionProps {
  className?: string;
  title?: string;
  subtitle?: string;
  limit?: number;
  showViewAll?: boolean;
}

export default function CategoriesSection({
  className,
  title = 'Shop by Category',
  subtitle = 'Explore our wide range of product categories',
  limit = 6,
  showViewAll = true,
}: CategoriesSectionProps) {
  const { data: categories, isLoading, error } = useCategories();

  // Filter categories with products and limit the results
  const filteredCategories = categories
    ?.filter(category => category.count > 0)
    ?.slice(0, limit) || [];

  if (error) {
    return (
      <section className={`py-16 bg-muted/30 ${className}`}>
        <div className="container mx-auto px-4">
          <div className="text-center text-muted-foreground">
            <h2 className="text-2xl font-bold mb-4">{title}</h2>
            <p>Unable to load categories. Please try again later.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`py-16 bg-muted/30 ${className}`}>
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {subtitle}
          </p>
        </motion.div>

        {/* Categories Grid */}
        <CategoryGrid
          categories={filteredCategories}
          isLoading={isLoading}
          columns={6}
          size="md"
        />

        {/* View All Button */}
        {showViewAll && filteredCategories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mt-12"
          >
            <Button size="lg" asChild>
              <Link href="/categories">
                View All Categories
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  );
}

