"use client";

import { useWishlist } from '@/hooks/useWishlist';
import { useToast } from '@/components/ToastProvider';
import ProductCard from '@/components/ProductCard';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function DashboardWishlist() {
  const { wishlist, products, isLoading, error, removeFromWishlist, isRemoving } = useWishlist();
  const { success, error: showError } = useToast();

  const handleRemove = async (productId: number) => {
    try {
      await removeFromWishlist(productId);
      success('Product removed from wishlist');
    } catch (err: any) {
      showError(err.message || 'Failed to remove from wishlist');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading wishlist...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 font-semibold mb-2">Error loading wishlist</p>
        <p className="text-red-700 text-sm">{error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!isLoading && wishlist.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="text-6xl mb-4 block">❤️</span>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Your wishlist is empty</h3>
        <p className="text-gray-600 mb-6">Start adding products to your wishlist</p>
        <Link
          href="/shop"
          className="inline-block px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Wishlist</h1>
        <p className="text-gray-600 mt-1">
          {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved
        </p>
      </div>

      {products.length === 0 && wishlist.length > 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading product details...</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key="wishlist-grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            suppressHydrationWarning
          >
            {products.map((product, index) => (
              <motion.div
                key={`wishlist-product-${product.id}-${product.slug || index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
                layout
              >
                <div className="relative group">
                  <ProductCard
                    id={product.id}
                    slug={product.slug}
                    name={product.name}
                    sku={product.sku}
                    price={product.price}
                    sale_price={product.sale_price}
                    regular_price={product.regular_price}
                    on_sale={product.on_sale}
                    tax_class={product.tax_class}
                    tax_status={product.tax_status}
                    average_rating={product.average_rating}
                    rating_count={product.rating_count}
                    imageUrl={product.images?.[0]?.src}
                    imageAlt={product.images?.[0]?.alt || product.name}
                  />
                  {/* Remove from wishlist button overlay */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemove(product.id);
                    }}
                    disabled={isRemoving}
                    className="absolute top-2 right-2 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                    title="Remove from wishlist"
                    aria-label="Remove from wishlist"
                  >
                    <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

