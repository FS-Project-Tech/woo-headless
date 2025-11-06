"use client";

import Image from "next/image";
import { useState } from "react";

export interface ProductGalleryImage {
	id: number;
	src: string;
	alt?: string;
	name?: string;
}

export default function ProductGallery({ images }: { images: ProductGalleryImage[] }) {
	const validImages = images?.filter((img) => !!img?.src) ?? [];
	const [activeIndex, setActiveIndex] = useState(0);
	const active = validImages[activeIndex] ?? validImages[0];

	return (
		<div>
			<div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
				{active ? (
					<Image
						src={active.src}
						alt={active.alt || active.name || "Product image"}
						fill
						sizes="(max-width: 1024px) 100vw, 50vw"
						className="object-contain p-6"
						priority
					/>
				) : (
					<div className="absolute inset-0 grid place-items-center text-gray-400">No Image</div>
				)}
			</div>

			{validImages.length > 1 && (
				<div className="mt-4 grid grid-cols-5 gap-3">
					{validImages.slice(0, 10).map((img, idx) => (
						<button
							key={img.id ?? idx}
							onClick={() => setActiveIndex(idx)}
							className={`relative aspect-square overflow-hidden rounded border ${idx === activeIndex ? "border-gray-900" : "border-gray-200"}`}
							aria-label={`Show image ${idx + 1}`}
						>
							<Image
								src={img.src}
								alt={img.alt || img.name || "Thumbnail"}
								fill
								sizes="100px"
								className="object-cover"
							/>
						</button>
					))}
				</div>
			)}
		</div>
	);
}
