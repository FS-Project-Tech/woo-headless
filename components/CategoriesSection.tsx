"use client";

import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import wcAPI from "@/lib/woocommerce";

type Category = {
  id: number;
  name: string;
  slug: string;
  count: number;
  image: string | null;
};

async function getCategoriesWithImages(): Promise<Category[]> {
  try {
    const response = await wcAPI.get("/products/categories", {
      params: {
        per_page: 100,
        parent: 0,
        hide_empty: true,
      },
    });
    
    return (response.data || []).map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      count: cat.count || 0,
      image: cat.image?.src || cat.image_url || null,
    }));
  } catch (error: any) {
    // Error is already logged by the WooCommerce API interceptor
    // Component handles empty array gracefully (returns null if no categories)
    // No need to log again here to avoid duplicate console messages
    return [];
  }
}

export default function CategoriesSection() {
  const [mounted, setMounted] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    getCategoriesWithImages().then(setCategories);
    if (typeof window !== 'undefined') {
      const mq = window.matchMedia('(max-width: 639px)');
      const update = () => setIsMobile(mq.matches);
      update();
      mq.addEventListener?.('change', update);
      return () => mq.removeEventListener?.('change', update);
    }
  }, []);

  if (categories.length === 0) {
    return null;
  }

  // During SSR/first client paint, render a static placeholder
  if (!mounted) {
    return (
      <section className="mb-16 py-8">
        <div className="mx-auto w-[85vw] px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-left">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Shop by Category</h2>
            <p className="text-gray-600">Browse our complete product range</p>
            <div className="mt-4 w-20 h-1 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full"></div>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {categories.slice(0, 6).map((category) => {
              const categoryImage = category.image || 
                                   `https://picsum.photos/200/200?random=${category.id}`;
              
              return (
                <Link
                  key={category.id}
                  href={`/product-category/${category.slug}`}
                  className="group flex flex-col h-full"
                >
                  <div className="flex flex-col h-full bg-white border-2 border-gray-100 hover:border-teal-300 shadow-sm hover:shadow-xl rounded-2xl overflow-hidden transition-all duration-300">
                    <div className="relative w-full h-40 shrink-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6">
                      <div className="absolute inset-0 bg-gradient-to-br from-teal-50/0 to-blue-50/0 group-hover:from-teal-50/50 group-hover:to-blue-50/50 transition-all duration-300"></div>
                      {categoryImage && categoryImage.trim() !== '' ? (
                        <Image
                          src={categoryImage}
                          alt={category.name}
                          width={120}
                          height={120}
                          className="object-contain relative z-10 max-h-full max-w-full group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="text-gray-400 text-xs">No Image</div>
                      )}
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-center bg-white">
                      <h3 className="text-gray-900 font-semibold text-sm text-center leading-tight group-hover:text-teal-600 transition-colors">
                        {category.name}
                      </h3>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // On mobile: render grid, no swiper
  if (mounted && isMobile) {
    return (
      <section className="mb-16 py-8">
        <div className="mx-auto w-full sm:w-[85vw] px-4 sm:px-6 lg:px-8">
          <div className="mb-6 text-left">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Shop by Category</h2>
            <p className="text-sm text-gray-600">Browse our complete product range</p>
            <div className="mt-3 w-16 h-1 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full"></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {categories.map((category) => {
              const categoryImage = category.image || `https://picsum.photos/200/200?random=${category.id}`;
              return (
                <Link key={category.id} href={`/product-category/${category.slug}`} className="group flex flex-col h-full">
                  <div className="flex flex-col h-full bg-white border border-gray-200 hover:border-teal-400 shadow-sm hover:shadow-lg rounded-xl overflow-hidden transition-all duration-300">
                    <div className="relative w-full aspect-square shrink-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-3">
                      <div className="absolute inset-0 bg-gradient-to-br from-teal-50/0 to-blue-50/0 group-hover:from-teal-50/50 group-hover:to-blue-50/50 transition-all duration-300"></div>
                      {categoryImage && categoryImage.trim() !== '' ? (
                        <Image src={categoryImage} alt={category.name} width={100} height={100} className="object-contain relative z-10 max-h-full max-w-full group-hover:scale-110 transition-transform duration-300" />
                      ) : (
                        <div className="text-gray-400 text-xs">No Image</div>
                      )}
                    </div>
                    <div className="p-2 bg-white">
                      <h3 className="text-center text-xs font-medium text-gray-900 leading-tight group-hover:text-teal-600 transition-colors">{category.name}</h3>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-16 py-8">
      <div className="mx-auto w-full sm:w-[85vw] px-4 sm:px-6 lg:px-8">
        {/* Header Section - New Design */}
        <div className="mb-8 text-left">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Shop by Category</h2>
          <p className="text-gray-600 text-lg">Browse our complete product range</p>
          <div className="mt-4 w-24 h-1 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full"></div>
        </div>

        {/* Swiper Container - Keep all swiper settings as is */}
        <div className="relative -mx-4 w-screen sm:mx-0 sm:w-auto">
          <Swiper
            modules={[Navigation]}
            navigation
            className="px-0!"
            slidesPerView={1.75}
            spaceBetween={14}
            breakpoints={{
              640: { slidesPerView: 2.75, spaceBetween: 14 },
              768: { slidesPerView: 4.25, spaceBetween: 16 },
              1024: { slidesPerView: 6.5, spaceBetween: 16 },
            }}
            style={{ height: "auto" }}
          >
            {categories.map((category) => {
              const categoryImage = category.image || 
                                   `https://picsum.photos/200/200?random=${category.id}`;
              
              return (
                <SwiperSlide key={category.id} style={{ height: "auto" }}>
                  <Link
                    href={`/product-category/${category.slug}`}
                    className="group flex flex-col h-full"
                    style={{ height: "100%" }}
                  >
                    <motion.div
                      className="flex flex-col h-full bg-white border-2 border-gray-100 hover:border-teal-300 shadow-md hover:shadow-2xl rounded-2xl overflow-hidden transition-all duration-300"
                      whileHover={{ scale: 1.03, y: -6 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Image Container - New Design */}
                      <motion.div
                        className="relative w-full h-40 shrink-0 flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 p-6 overflow-hidden"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                      >
                        {/* Gradient Overlay on Hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-teal-50/0 via-blue-50/0 to-purple-50/0 group-hover:from-teal-50/60 group-hover:via-blue-50/60 group-hover:to-purple-50/60 transition-all duration-500"></div>
                        
                        {/* Decorative Circles */}
                        <div className="absolute top-2 right-2 w-16 h-16 bg-teal-200/20 rounded-full blur-xl group-hover:bg-teal-300/30 transition-all duration-500"></div>
                        <div className="absolute bottom-2 left-2 w-20 h-20 bg-blue-200/20 rounded-full blur-xl group-hover:bg-blue-300/30 transition-all duration-500"></div>
                        
                        {/* Image */}
                        <Image
                          src={categoryImage}
                          alt={category.name}
                          width={120}
                          height={120}
                          className="object-contain relative z-10 transition-transform duration-500 group-hover:scale-125 max-h-full max-w-full"
                        />
                      </motion.div>
                      
                      {/* Category Name - New Design */}
                      <div className="p-5 flex-1 flex flex-col justify-center bg-white border-t border-gray-50">
                        <h3 className="text-gray-900 font-semibold text-sm text-center leading-tight group-hover:text-teal-600 transition-colors duration-300">
                          {category.name}
                        </h3>
                        {/* Optional: Add subtle underline on hover */}
                        <div className="mt-2 h-0.5 w-0 group-hover:w-12 bg-gradient-to-r from-teal-500 to-blue-500 mx-auto transition-all duration-300 rounded-full"></div>
                      </div>
                    </motion.div>
                  </Link>
                </SwiperSlide>
              );
            })}
          </Swiper>
        </div>
      </div>
    </section>
  );
}

