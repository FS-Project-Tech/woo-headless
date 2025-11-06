'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { WooCommerceProduct } from '@/types/woocommerce';
import { formatPrice, calculateDiscountPercentage, getImageUrl } from '@/utils';
import { useAddToCartUrl } from '@/hooks/useWooCommerce';

interface ProductCardProps {
  product: WooCommerceProduct;
  className?: string;
  showWishlist?: boolean;
}

export default function ProductCard({ 
  product, 
  className,
  showWishlist = true 
}: ProductCardProps) {
  const { data: addToCartUrl } = useAddToCartUrl(product.id);
  
  const discountPercentage = calculateDiscountPercentage(
    product.regular_price,
    product.sale_price
  );

  const rating = parseFloat(product.average_rating);
  const reviewCount = product.rating_count;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
        <div className="relative">
          {/* Product Image */}
          <Link href={`/products/${product.slug}`}>
            <div className="relative aspect-square overflow-hidden">
              <Image
                src={getImageUrl(product.images[0]?.src || '/placeholder-image.jpg')}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              />
              
              {/* Sale Badge */}
              {product.on_sale && discountPercentage > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute top-2 left-2"
                >
                  -{discountPercentage}%
                </Badge>
              )}
              
              {/* Featured Badge */}
              {product.featured && (
                <Badge 
                  variant="secondary" 
                  className="absolute top-2 right-2"
                >
                  Featured
                </Badge>
              )}
            </div>
          </Link>

          {/* Quick Actions */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex flex-col space-y-2">
              {showWishlist && (
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 bg-background/80 backdrop-blur-sm"
                >
                  <Heart className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        <CardContent className="p-4">
          {/* Category */}
          {product.categories.length > 0 && (
            <Link
              href={`/categories/${product.categories[0].slug}`}
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              {product.categories[0].name}
            </Link>
          )}

          {/* Product Name */}
          <Link href={`/products/${product.slug}`}>
            <h3 className="font-medium text-foreground hover:text-primary transition-colors line-clamp-2 mt-1">
              {product.name}
            </h3>
          </Link>

          {/* Rating */}
          {rating > 0 && (
            <div className="flex items-center space-x-1 mt-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      i < Math.floor(rating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-muted-foreground'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                ({reviewCount})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center space-x-2 mt-2">
            <span className="text-lg font-semibold text-primary">
              {formatPrice(product.price)}
            </span>
            {product.on_sale && product.regular_price !== product.sale_price && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(product.regular_price)}
              </span>
            )}
          </div>

          {/* Stock Status */}
          <div className="mt-2">
            {product.stock_status === 'instock' ? (
              <Badge variant="success" className="text-xs">
                In Stock
              </Badge>
            ) : product.stock_status === 'outofstock' ? (
              <Badge variant="destructive" className="text-xs">
                Out of Stock
              </Badge>
            ) : (
              <Badge variant="warning" className="text-xs">
                On Backorder
              </Badge>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <Button
            className="w-full"
            disabled={product.stock_status === 'outofstock'}
            asChild
          >
            <Link href={addToCartUrl || `/products/${product.slug}`}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              {product.stock_status === 'outofstock' ? 'Out of Stock' : 'Add to Cart'}
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

