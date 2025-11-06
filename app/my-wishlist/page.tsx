"use client";

import { useEffect, useState } from 'react';
import { useWishlist } from '@/components/WishlistProvider';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import Breadcrumbs from '@/components/Breadcrumbs';
import { fetchProducts } from '@/lib/woocommerce';
import type { WooCommerceProduct } from '@/lib/woocommerce';

export default function MyWishlistPage() {
  const { wishlist, loading: wishlistLoading } = useWishlist();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<WooCommerceProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }

    // Fetch wishlist products
    if (user && !wishlistLoading) {
      if (wishlist.length > 0) {
        setLoading(true);
        fetch(`/api/wishlist/products?ids=${wishlist.join(',')}`)
          .then((res) => res.json())
          .then((data) => {
            const fetchedProducts = data.products || [];
            // Filter to only include products still in wishlist (in case user removed some)
            const validProductIds = new Set(wishlist);
            setProducts(fetchedProducts.filter((p: WooCommerceProduct) => validProductIds.has(p.id)));
          })
          .catch(() => {
            setProducts([]);
          })
          .finally(() => {
            setLoading(false);
          });
      } else {
        setLoading(false);
        setProducts([]);
      }
    }
  }, [user, wishlist, wishlistLoading, authLoading, router]);

  if (authLoading || wishlistLoading) {
    return (
      <div className="min-h-screen py-12">
        <div className="mx-auto w-[85vw] px-4 sm:px-6 lg:px-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen py-12">
      <div className="mx-auto w-[85vw] px-4 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'My Wishlist' },
          ]}
        />
        <h1 className="mb-6 text-3xl font-bold text-gray-900">My Wishlist</h1>

        {loading ? (
          <div className="text-center text-gray-600">Loading wishlist products...</div>
        ) : products.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
            <svg
              viewBox="0 0 24 24"
              className="mx-auto h-16 w-16 text-gray-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
            </svg>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">Your wishlist is empty</h2>
            <p className="mt-2 text-gray-600">Start adding products to your wishlist to see them here.</p>
            <a
              href="/shop"
              className="mt-6 inline-block rounded-md bg-gray-900 px-6 py-3 text-white transition hover:bg-black"
            >
              Browse Products
            </a>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600">
              {products.length} {products.length === 1 ? 'item' : 'items'} in your wishlist
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  slug={product.slug}
                  name={product.name}
                  sku={product.sku}
                  price={product.price}
                  sale_price={product.sale_price}
                  regular_price={product.regular_price}
                  on_sale={product.on_sale}
                  tax_class={product.tax_class}
                  average_rating={product.average_rating}
                  rating_count={product.rating_count}
                  imageUrl={product.images?.[0]?.src}
                  imageAlt={product.images?.[0]?.alt || product.name}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

