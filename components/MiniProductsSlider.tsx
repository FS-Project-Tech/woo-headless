"use client";

import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import MiniProductCard from "@/components/MiniProductCard";

type P = {
  id: number;
  slug: string;
  name: string;
  price?: string;
  regular_price?: string;
  on_sale?: boolean;
  images?: Array<{ src: string; alt?: string }>;
};

export default function MiniProductsSlider({ products }: { products: P[] }) {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const mq = window.matchMedia('(max-width: 639px)');
      const update = () => setIsMobile(mq.matches);
      update();
      mq.addEventListener?.('change', update);
      return () => mq.removeEventListener?.('change', update);
    }
  }, []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {products.slice(0, 6).map((p) => (
          <div key={p.id} className="h-full">
            <MiniProductCard
              id={p.id}
              slug={p.slug}
              name={p.name}
              price={p.price}
              regular_price={p.regular_price}
              on_sale={p.on_sale}
              imageUrl={p.images?.[0]?.src}
              imageAlt={p.images?.[0]?.alt || p.name}
            />
          </div>
        ))}
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {products.map((p) => (
          <div key={p.id} className="h-full">
            <MiniProductCard
              id={p.id}
              slug={p.slug}
              name={p.name}
              price={p.price}
              regular_price={p.regular_price}
              on_sale={p.on_sale}
              imageUrl={p.images?.[0]?.src}
              imageAlt={p.images?.[0]?.alt || p.name}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative -mx-4 w-screen sm:mx-0 sm:w-auto">
      <Swiper
        modules={[Navigation]}
        navigation
        className="!px-0"
        slidesPerView={1.75}
        spaceBetween={12}
        breakpoints={{
          640: { slidesPerView: 2.75, spaceBetween: 12 },
          768: { slidesPerView: 3.75, spaceBetween: 14 },
          1024: { slidesPerView: 5.75, spaceBetween: 16 },
          1280: { slidesPerView: 6.75, spaceBetween: 16 },
        }}
      >
        {products.map((p) => (
          <SwiperSlide key={p.id} style={{ height: "100%" }}>
            <div className="h-full">
              <MiniProductCard
                id={p.id}
                slug={p.slug}
                name={p.name}
                price={p.price}
                regular_price={p.regular_price}
                on_sale={p.on_sale}
                imageUrl={p.images?.[0]?.src}
                imageAlt={p.images?.[0]?.alt || p.name}
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}


