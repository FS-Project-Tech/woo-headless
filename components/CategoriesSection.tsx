"use client";

import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import Link from "next/link";
import Image from "next/image";
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
  } catch (error) {
    console.error("Error fetching categories:", error);
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
      <section className="mb-10">
        <div className="mx-auto w-[85vw] px-4 sm:px-6 lg:px-8">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Shop by Category</h2>
            <p className="text-sm text-gray-600 mt-1">Browse our complete product range</p>
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
                  <div className="flex flex-col h-full bg-white shadow-sm hover:shadow-md rounded-xl overflow-hidden">
                    <div className="relative w-full h-32 shrink-0 flex items-center justify-center bg-gray-50">
                      <Image
                        src={categoryImage}
                        alt={category.name}
                        width={120}
                        height={120}
                        className="object-contain max-h-full max-w-full"
                      />
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-start min-h-[80px]">
                      <h3 className="text-gray-900 font-normal text-sm text-center leading-tight">
                        {category.name}
                      </h3>
                      {/* Product Count - Commented out for now */}
                      {/* {category.count > 0 && (
                        <p className="text-gray-600 text-sm mt-2">
                          {category.count} product{category.count !== 1 ? "s" : ""}
                        </p>
                      )} */}
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
      <section className="mb-10">
        <div className="mx-auto w-full sm:w-[85vw] px-4 sm:px-6 lg:px-8">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Shop by Category</h2>
            <p className="text-sm text-gray-600 mt-1">Browse our complete product range</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {categories.map((category) => {
              const categoryImage = category.image || `https://picsum.photos/200/200?random=${category.id}`;
              return (
                <Link key={category.id} href={`/product-category/${category.slug}`} className="group flex flex-col h-full">
                  <div className="flex flex-col h-full bg-white shadow-sm hover:shadow-md rounded-xl overflow-hidden">
                    <div className="relative w-full aspect-square shrink-0 flex items-center justify-center bg-gray-50">
                      <Image src={categoryImage} alt={category.name} width={120} height={120} className="object-contain max-h-full max-w-full" />
                    </div>
                    <div className="p-2">
                      <h3 className="text-center text-xs text-gray-900 leading-tight">{category.name}</h3>
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
    <section className="mb-10">
      <div className="mx-auto w-full sm:w-[85vw] px-4 sm:px-6 lg:px-8">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Shop by Category</h2>
          <p className="text-sm text-gray-600 mt-1">Browse our complete product range</p>
        </div>
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
                    <div className="flex flex-col h-full bg-white shadow-sm hover:shadow-md rounded-xl overflow-hidden">
                      {/* Image - smaller size without crop */}
                      <div className="relative w-full h-32 shrink-0 flex items-center justify-center bg-gray-50">
                        <Image
                          src={categoryImage}
                          alt={category.name}
                          width={120}
                          height={120}
                          className="object-contain transition-transform group-hover:scale-110 max-h-full max-w-full"
                        />
                      </div>
                      {/* Name */}
                      <div className="p-4 flex-1 flex flex-col justify-start min-h-[80px]">
                        <h3 className="text-gray-900 font-normal text-sm text-center leading-tight">
                          {category.name}
                        </h3>
                        {/* Product Count - Commented out for now */}
                        {/* {category.count > 0 && (
                          <p className="text-gray-600 text-sm mt-2">
                            {category.count} product{category.count !== 1 ? "s" : ""}
                          </p>
                        )} */}
                      </div>
                    </div>
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

