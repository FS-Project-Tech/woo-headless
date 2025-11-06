'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { ArrowRight } from 'lucide-react';
import { useFeaturedProducts } from '@/hooks/useWooCommerce';
import ProductGrid from '@/components/product/ProductGrid';

interface FeaturedProductsProps {
  className?: string;
  title?: string;
  subtitle?: string;
  limit?: number;
  showViewAll?: boolean;
}

export default function FeaturedProducts({
  className,
  title = 'Featured Products',
  subtitle = 'Discover our handpicked selection of premium products',
  limit = 8,
  showViewAll = true,
}: FeaturedProductsProps) {
  const { data: products, isLoading, error } = useFeaturedProducts(limit);

  if (error) {
    return (
      <section className={`py-16 ${className}`}>
        <div className="container mx-auto px-4">
          <div className="text-center text-muted-foreground">
            <h2 className="text-2xl font-bold mb-4">{title}</h2>
            <p>Unable to load featured products. Please try again later.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`py-16 ${className}`}>
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

        {/* Products Grid */}
        <ProductGrid
          products={products || []}
          isLoading={isLoading}
          columns={4}
        />

        {/* View All Button */}
        {showViewAll && products && products.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mt-12"
          >
            <Button size="lg" asChild>
              <Link href="/products?featured=true">
                View All Featured Products
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  );
}

