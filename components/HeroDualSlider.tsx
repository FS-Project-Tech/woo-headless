"use client";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";

export interface SliderImage {
  src: string;
  alt?: string;
}

export default function HeroDualSlider({
  leftImages = [],
  rightImages = [],
}: {
  leftImages?: SliderImage[] | Array<{ url?: string; src?: string; alt?: string }>;
  rightImages?: SliderImage[] | Array<{ url?: string; src?: string; alt?: string }>;
}) {
	// Transform and filter images - handle both 'url' and 'src' properties, filter out empty strings
	const transformImages = (images: any[]): SliderImage[] => {
		return images
			.map((img) => ({
				src: img.src || img.url || '',
				alt: img.alt || '',
			}))
			.filter((img) => img.src && img.src.trim() !== ''); // Filter out empty strings
	};

	const transformedLeft = transformImages(leftImages);
	const transformedRight = transformImages(rightImages);

	// Fallback placeholders if arrays are empty or all filtered out
	const leftData: SliderImage[] = transformedLeft.length > 0 ? transformedLeft : [
		{ src: "https://picsum.photos/1200/500?random=1", alt: "Placeholder 1" },
		{ src: "https://picsum.photos/1200/500?random=2", alt: "Placeholder 2" },
		{ src: "https://picsum.photos/1200/500?random=3", alt: "Placeholder 3" },
	];
	const rightData: SliderImage[] = transformedRight.length > 0 ? transformedRight : [
		{ src: "https://picsum.photos/600/500?random=11", alt: "Placeholder A" },
		{ src: "https://picsum.photos/600/500?random=12", alt: "Placeholder B" },
		{ src: "https://picsum.photos/600/500?random=13", alt: "Placeholder C" },
	];

	return (
		<div className="hidden md:block mx-auto w-[85vw] px-4 sm:px-6 lg:px-8" suppressHydrationWarning>
			<div className="grid gap-4 md:grid-cols-4" suppressHydrationWarning>
				{/* Left slider - 75% (3/4) */}
				<div className="md:col-span-3" suppressHydrationWarning>
					<Swiper
						modules={[Navigation, Pagination, Autoplay]}
						navigation={{ enabled: true }}
						pagination={{ clickable: true, dynamicBullets: true }}
						autoplay={{ delay: 4000, disableOnInteraction: false }}
						style={{ width: "100%" }}
					>
						{leftData.map((img, i) => {
						// Skip rendering if src is empty
						if (!img.src || img.src.trim() === '') return null;
						return (
							<SwiperSlide key={i} style={{ height: "auto" }}>
								<div className="relative h-56 w-full sm:h-72 md:h-80 lg:h-96 overflow-hidden rounded-xl">
									<Image src={img.src} alt={img.alt || `Slide ${i + 1}`} fill sizes="(max-width: 768px) 100vw, 75vw" className="object-cover" />
								</div>
							</SwiperSlide>
						);
					})}
					</Swiper>
				</div>

				{/* Right slider - 25% (1/4) */}
				<div className="md:col-span-1" suppressHydrationWarning>
					<Swiper
						modules={[Navigation, Pagination, Autoplay]}
						navigation={{ enabled: true }}
						pagination={{ clickable: true }}
						autoplay={{ delay: 4500, disableOnInteraction: false }}
						style={{ width: "100%" }}
					>
						{rightData.map((img, i) => {
						// Skip rendering if src is empty
						if (!img.src || img.src.trim() === '') return null;
						return (
							<SwiperSlide key={i} style={{ height: "auto" }}>
								<div className="relative h-56 w-full sm:h-72 md:h-80 lg:h-96 overflow-hidden rounded-xl">
									<Image src={img.src} alt={img.alt || `Slide ${i + 1}`} fill sizes="(max-width: 768px) 100vw, 25vw" className="object-cover" />
								</div>
							</SwiperSlide>
						);
					})}
					</Swiper>
				</div>
			</div>
		</div>
	);
}


