"use client";

import Link from "next/link";
import Image from "next/image";

export default function MiniProductCard({
  id,
  slug,
  name,
  imageUrl,
  imageAlt,
  price,
  regular_price,
  on_sale,
}: {
  id: number;
  slug: string;
  name: string;
  imageUrl?: string | null;
  imageAlt?: string;
  price?: string;
  regular_price?: string;
  on_sale?: boolean;
}) {
  return (
    <Link href={`/products/${slug}`} className="group block h-full rounded-lg border border-gray-200 bg-white p-2 hover:shadow-sm">
      <div className="relative aspect-square w-full overflow-hidden rounded-md bg-gray-100">
        {imageUrl && imageUrl.trim() !== '' ? (
          <Image 
            src={imageUrl} 
            alt={imageAlt || name} 
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
            className="object-cover transition-transform group-hover:scale-[1.02]" 
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-xs text-gray-400">No Image</div>
        )}
      </div>
      <div className="mt-2 text-xs font-medium text-gray-900 whitespace-normal break-words min-h-[32px] max-h-[32px] overflow-hidden" title={name}>{name}</div>
      {(() => {
        const p = Number(price || 0);
        if (!isFinite(p) || p <= 0) return null;
        return (
          <div className="mt-1 text-sm font-semibold text-gray-900">${p.toFixed(2)}</div>
        );
      })()}
    </Link>
  );
}


