"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import AnimatedSection from "@/components/AnimatedSection";

// Dynamically import ProductsSlider - heavy component with Swiper
const ProductsSlider = dynamic(() => import("@/components/ProductsSlider"), {
  loading: () => (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-[420px] animate-pulse rounded-xl border border-gray-200 bg-white" />
      ))}
    </div>
  ),
  ssr: false, // Client-side only for Swiper
});

interface ProductSectionWrapperProps {
  title: string;
  subtitle?: string;
  viewAllHref: string;
  products: any[];
}

export default function ProductSectionWrapper(props: ProductSectionWrapperProps) {
  const { title, subtitle, viewAllHref, products } = props;

  return (
    <AnimatedSection>
      <section className="mb-16" suppressHydrationWarning>
        <div className={`mx-auto w-[85vw] px-4 sm:px-6 lg:px-8 py-6`} suppressHydrationWarning>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="mb-3 flex items-center justify-between"
            suppressHydrationWarning
          >
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <Link
              href={viewAllHref}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              View all →
            </Link>
          </motion.div>
          {subtitle && (
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="mb-6 text-sm text-gray-600"
              suppressHydrationWarning
            >
              {subtitle}
            </motion.p>
          )}

          {(!products || products.length === 0) ? (
            <div className="rounded-lg bg-white p-8 text-center text-gray-600">No products found.</div>
          ) : (
            <ProductsSlider products={products} />
          )}
        </div>
      </section>
    </AnimatedSection>
  );
}

