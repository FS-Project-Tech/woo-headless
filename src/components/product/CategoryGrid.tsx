'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { WooCommerceCategory } from '@/types/woocommerce';
import CategoryCard from './CategoryCard';
import { Skeleton } from '@/components/ui/Skeleton';

interface CategoryGridProps {
  categories: WooCommerceCategory[];
  isLoading?: boolean;
  className?: string;
  columns?: 2 | 3 | 4 | 5 | 6;
  size?: 'sm' | 'md' | 'lg';
}

export default function CategoryGrid({ 
  categories, 
  isLoading = false, 
  className,
  columns = 6,
  size = 'md'
}: CategoryGridProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6',
  };

  if (isLoading) {
    return (
      <div className={className}>
        <div className={`grid gap-4 ${gridCols[columns]}`}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-[4/3] overflow-hidden rounded-lg">
                <Skeleton className="h-full w-full" />
              </div>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!categories.length) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-muted-foreground">
          <h3 className="text-lg font-medium mb-2">No categories found</h3>
          <p>Categories will appear here once they are available.</p>
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
        className={`grid gap-4 ${gridCols[columns]}`}
      >
        {categories.map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <CategoryCard category={category} size={size} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
