'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star, Heart, Share2, Truck, Shield, RotateCcw, Minus, Plus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Layout from '@/components/layout/Layout';
import ProductGrid from '@/components/product/ProductGrid';
import { useProductBySlug, useRelatedProducts, useAddToCartUrl, useProductVariations, useAddToCart } from '@/hooks/useWooCommerce';
import { formatPrice, calculateDiscountPercentage, getImageUrl, getProductRatingStars } from '@/utils';
import VariationSelector from '@/components/product/VariationSelector';
import { toast } from 'sonner';

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [selectedVariation, setSelectedVariation] = useState<any>(null);

  const { data: product, isLoading, error } = useProductBySlug(slug);
  const { data: relatedProducts } = useRelatedProducts(product?.id || 0, 4);
  const { data: variations } = useProductVariations(product?.id || 0);
  const { data: addToCartUrl } = useAddToCartUrl(product?.id || 0, quantity, selectedVariation?.id);
  const addToCartMutation = useAddToCart();

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="aspect-square bg-muted rounded-lg"></div>
                <div className="flex space-x-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-20 h-20 bg-muted rounded"></div>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <div className="h-8 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-6 bg-muted rounded w-1/4"></div>
                <div className="h-10 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Product Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The product you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link href="/products">Back to Products</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const discountPercentage = calculateDiscountPercentage(
    product.regular_price,
    product.sale_price
  );

  const rating = parseFloat(product.average_rating);
  const reviewCount = product.rating_count;
  const ratingStars = getProductRatingStars(rating);

  const handleQuantityChange = (change: number) => {
    const newQuantity = Math.max(1, quantity + change);
    setQuantity(newQuantity);
  };

  const handleAttributeChange = (attributeName: string, value: string) => {
    setSelectedAttributes(prev => ({
      ...prev,
      [attributeName]: value
    }));
  };

  const handleAddToCart = async () => {
    if (product) {
      try {
        const result = await addToCartMutation.mutateAsync({
          productId: product.id,
          quantity,
          variationId: selectedVariation?.id,
          attributes: selectedAttributes
        });
        
        if (result.success) {
          toast.success('Product added to cart');
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        console.error('Failed to add to cart:', error);
        toast.error('Failed to add product to cart. Please try again.');
      }
    }
  };

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
            <Link href="/" className="hover:text-primary">Home</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-primary">Products</Link>
            {product.categories.length > 0 && (
              <>
                <span>/</span>
                <Link 
                  href={`/categories/${product.categories[0].slug}`}
                  className="hover:text-primary"
                >
                  {product.categories[0].name}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="text-foreground">{product.name}</span>
          </nav>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Product Images */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {/* Main Image */}
            <div className="aspect-square relative overflow-hidden rounded-lg bg-muted">
              <Image
                src={getImageUrl(product.images[selectedImageIndex]?.src || '/placeholder-image.jpg')}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
              
              {/* Sale Badge */}
              {product.on_sale && discountPercentage > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute top-4 left-4"
                >
                  -{discountPercentage}%
                </Badge>
              )}
            </div>

            {/* Thumbnail Images */}
            {product.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImageIndex === index 
                        ? 'border-primary' 
                        : 'border-transparent hover:border-border'
                    }`}
                  >
                    <Image
                      src={getImageUrl(image.src)}
                      alt={`${product.name} ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Product Title */}
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {product.name}
              </h1>
              
              {/* Rating */}
              {rating > 0 && (
                <div className="flex items-center space-x-2 mb-4">
                  <div className="flex items-center">
                    {ratingStars.map((star, index) => (
                      <Star
                        key={index}
                        className={`h-4 w-4 ${
                          star === 'full'
                            ? 'text-yellow-400 fill-current'
                            : star === 'half'
                            ? 'text-yellow-400 fill-current opacity-50'
                            : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              )}

              {/* SKU */}
              {product.sku && (
                <p className="text-sm text-muted-foreground mb-2">
                  SKU: {product.sku}
                </p>
              )}
            </div>

            {/* Price */}
            <div className="flex items-center space-x-4">
              <span className="text-3xl font-bold text-primary">
                {formatPrice(product.price)}
              </span>
              {product.on_sale && product.regular_price !== product.sale_price && (
                <span className="text-xl text-muted-foreground line-through">
                  {formatPrice(product.regular_price)}
                </span>
              )}
            </div>

            {/* Description */}
            {product.short_description && (
              <div 
                className="text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: product.short_description }}
              />
            )}

            {/* Stock Status */}
            <div>
              {product.stock_status === 'instock' ? (
                <Badge variant="success" className="text-sm">
                  In Stock
                </Badge>
              ) : product.stock_status === 'outofstock' ? (
                <Badge variant="destructive" className="text-sm">
                  Out of Stock
                </Badge>
              ) : (
                <Badge variant="warning" className="text-sm">
                  On Backorder
                </Badge>
              )}
            </div>

            {/* Product Variations */}
            {variations && variations.length > 0 && (
              <VariationSelector
                product={product}
                variations={variations}
                selectedAttributes={selectedAttributes}
                onAttributeChange={handleAttributeChange}
                selectedVariation={selectedVariation}
                onVariationSelect={setSelectedVariation}
              />
            )}

            {/* Quantity and Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium">Quantity:</label>
                <div className="flex items-center border border-border rounded-md">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="px-4 py-2 min-w-[60px] text-center">
                    {quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuantityChange(1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full"
                disabled={
                  product.stock_status === 'outofstock' || 
                  addToCartMutation.isPending ||
                  (variations && variations.length > 0 && !selectedVariation)
                }
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {addToCartMutation.isPending 
                  ? 'Adding...' 
                  : product.stock_status === 'outofstock' 
                    ? 'Out of Stock' 
                    : variations && variations.length > 0 && !selectedVariation
                      ? 'Select Options'
                      : 'Add to Cart'
                }
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <Button variant="outline" size="sm">
                <Heart className="h-4 w-4 mr-2" />
                Add to Wishlist
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-border">
              <div className="flex items-center space-x-2">
                <Truck className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Free Shipping</p>
                  <p className="text-xs text-muted-foreground">On orders over $50</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <RotateCcw className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Easy Returns</p>
                  <p className="text-xs text-muted-foreground">30-day return policy</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Secure Payment</p>
                  <p className="text-xs text-muted-foreground">SSL encrypted</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Product Details Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
            </CardHeader>
            <CardContent>
              {product.description && (
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-2xl font-bold text-foreground mb-8">Related Products</h2>
            <ProductGrid
              products={relatedProducts}
              columns={4}
            />
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
