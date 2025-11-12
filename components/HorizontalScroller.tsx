"use client";

import { PropsWithChildren, useRef } from "react";

export default function HorizontalScroller({ children }: PropsWithChildren) {
	const trackRef = useRef<HTMLDivElement | null>(null);

	const scrollByAmount = (dir: number) => {
		const el = trackRef.current;
		if (!el) return;
		const card = el.firstElementChild as HTMLElement | null;
		const cardWidth = card ? card.getBoundingClientRect().width : el.clientWidth * 0.8;
		el.scrollBy({ left: dir * cardWidth * 1.05, behavior: "smooth" });
	};

	return (
		<div className="relative">
			{/* edge gradients */}
			<div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-white to-transparent" />
			<div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-transparent" />

			{/* controls */}
			<button
				aria-label="Previous"
				onClick={() => scrollByAmount(-1)}
				className="absolute left-1 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow ring-1 ring-black/5 transition hover:bg-white"
			>
				‹
			</button>
			<button
				aria-label="Next"
				onClick={() => scrollByAmount(1)}
				className="absolute right-1 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow ring-1 ring-black/5 transition hover:bg-white"
			>
				›
			</button>

			<div className="-mx-4 overflow-x-auto px-4">
				<div ref={trackRef} className="no-scrollbar flex snap-x snap-mandatory gap-4 scroll-smooth [&>*]:snap-start">
					{children}
				</div>
			</div>
		</div>
	);
}


