import type { Metadata } from 'next';
import Layout from '@/components/layout/Layout';
import Hero from '@/components/homepage/Hero';
import FeaturedProducts from '@/components/homepage/FeaturedProducts';
import CategoriesSection from '@/components/homepage/CategoriesSection';
import TestimonialsSection from '@/components/homepage/TestimonialsSection';

export const metadata: Metadata = {
  title: 'WooCommerce Headless Store - Premium Products & Fast Shipping',
  description: 'Discover amazing products at great prices. Fast shipping, excellent customer service, and unbeatable prices. Shop our wide range of premium products.',
  keywords: ['ecommerce', 'online store', 'premium products', 'fast shipping', 'quality products'],
  openGraph: {
    title: 'WooCommerce Headless Store - Premium Products & Fast Shipping',
    description: 'Discover amazing products at great prices. Fast shipping, excellent customer service, and unbeatable prices.',
    type: 'website',
    url: 'https://your-store.com',
    siteName: 'WooCommerce Headless Store',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'WooCommerce Headless Store',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WooCommerce Headless Store - Premium Products & Fast Shipping',
    description: 'Discover amazing products at great prices. Fast shipping, excellent customer service, and unbeatable prices.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function Home() {
  return (
    <Layout>
      <Hero />
      <FeaturedProducts />
      <CategoriesSection />
      <TestimonialsSection />
    </Layout>
  );
}
