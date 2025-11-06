'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { WooCommerceCategory } from '@/types/woocommerce';
import { getImageUrl } from '@/utils';

interface CategoryCardProps {
  category: WooCommerceCategory;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function CategoryCard({ 
  category, 
  className,
  size = 'md' 
}: CategoryCardProps) {
  const sizeClasses = {
    sm: 'h-24',
    md: 'h-32',
    lg: 'h-48',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <Link href={`/categories/${category.slug}`}>
        <div className="group relative overflow-hidden rounded-lg bg-muted hover:shadow-lg transition-all duration-300">
          {/* Category Image */}
          <div className={`relative ${sizeClasses[size]} w-full`}>
            <Image
              src={getImageUrl(category.image?.src || '/placeholder-category.jpg')}
              alt={category.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300" />
            
            {/* Content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <h3 className={`font-semibold ${textSizeClasses[size]} mb-1`}>
                  {category.name}
                </h3>
                <p className="text-sm opacity-90">
                  {category.count} {category.count === 1 ? 'product' : 'products'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

