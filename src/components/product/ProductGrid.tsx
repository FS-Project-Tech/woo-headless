'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { WooCommerceProduct } from '@/types/woocommerce';
import ProductCard from './ProductCard';
import { Skeleton } from '@/components/ui/Skeleton';

interface ProductGridProps {
  products: WooCommerceProduct[];
  isLoading?: boolean;
  className?: string;
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
}

export default function ProductGrid({ 
  products, 
  isLoading = false, 
  className,
  columns = 4 
}: ProductGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6',
  };

  if (isLoading) {
    return (
      <div className={className}>
        <div className={`grid gap-6 ${gridCols[columns]}`}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-6 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-muted-foreground">
          <h3 className="text-lg font-medium mb-2">No products found</h3>
          <p>Try adjusting your search or filter criteria.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`grid gap-6 ${gridCols[columns]}`}
      >
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <ProductCard product={product} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
