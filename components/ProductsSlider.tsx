"use client";

import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import ProductCard from "@/components/ProductCard";

type P = {
  id: number;
  slug: string;
  name: string;
  sku?: string | null;
  price: string;
  regular_price?: string;
  sale_price?: string;
  on_sale?: boolean;
  tax_class?: string;
  average_rating?: string;
  rating_count?: number;
  images?: Array<{ src: string; alt?: string }>;
};

export default function ProductsSlider({ products }: { products: P[] }) {
	const [mounted, setMounted] = useState(false);
	const [isMobile, setIsMobile] = useState(false);

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

	// During SSR/first client paint, render a static placeholder to avoid hydration mismatches
	if (!mounted) {
		return (
			<div className="relative" suppressHydrationWarning>
				<div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6" suppressHydrationWarning>
					{products.slice(0, 6).map((p) => (
						<div key={p.id} className="h-full" suppressHydrationWarning>
							<ProductCard
								id={p.id}
								slug={p.slug}
								name={p.name}
								sku={p.sku}
								price={p.price}
								sale_price={p.sale_price}
								regular_price={p.regular_price}
								on_sale={p.on_sale}
								tax_class={p.tax_class}
								average_rating={p.average_rating}
								rating_count={p.rating_count}
								imageUrl={p.images?.[0]?.src}
								imageAlt={p.images?.[0]?.alt || p.name}
							/>
						</div>
					))}
				</div>
			</div>
		);
	}

	// On mobile, render static grid instead of Swiper
	if (mounted && isMobile) {
		return (
			<div className="grid grid-cols-2 gap-3" suppressHydrationWarning>
				{products.map((p) => (
					<div key={p.id} className="h-full" suppressHydrationWarning>
						<ProductCard
							id={p.id}
							slug={p.slug}
							name={p.name}
							sku={p.sku}
							price={p.price}
							sale_price={p.sale_price}
							regular_price={p.regular_price}
							on_sale={p.on_sale}
							tax_class={p.tax_class}
							average_rating={p.average_rating}
							rating_count={p.rating_count}
							imageUrl={p.images?.[0]?.src}
							imageAlt={p.images?.[0]?.alt || p.name}
						/>
						</div>
				))}
			</div>
		);
	}

	return (
		<div className="relative -mx-4 w-screen sm:mx-0 sm:w-auto" suppressHydrationWarning>
			<Swiper
				modules={[Navigation]}
				navigation
				className="!px-0"
				slidesPerView={1.75}
				spaceBetween={14}
				breakpoints={{
					640: { slidesPerView: 2.75, spaceBetween: 14 },
					768: { slidesPerView: 3.75, spaceBetween: 16 },
					1024: { slidesPerView: 5.75, spaceBetween: 16 },
				}}
			>
				{products.map((p) => (
					<SwiperSlide key={p.id} style={{ height: "100%" }}>
						<div className="h-full" suppressHydrationWarning>
							<ProductCard
								id={p.id}
								slug={p.slug}
								name={p.name}
								sku={p.sku}
								price={p.price}
								sale_price={p.sale_price}
								regular_price={p.regular_price}
								on_sale={p.on_sale}
								tax_class={p.tax_class}
								average_rating={p.average_rating}
								rating_count={p.rating_count}
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


