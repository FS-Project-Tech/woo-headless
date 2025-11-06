"use client";

import { useState, useMemo } from "react";
import type { WooCommerceProduct, WooCommerceVariation } from "@/lib/woocommerce";

export default function ProductInfoAccordion({
  product,
  variations,
}: {
  product: WooCommerceProduct;
  variations: WooCommerceVariation[];
}) {
  const sections = useMemo(() => {
    return [
      {
        key: "information",
        title: "Information",
        content: (
          <div
            className="prose max-w-none px-4 pb-4 pt-2 text-gray-700"
            dangerouslySetInnerHTML={{ __html: product.description || "" }}
          />
        ),
      },
      {
        key: "features",
        title: "Features",
        content: (
          <div className="px-4 pb-4 pt-2 text-sm text-gray-700">{renderMetaList(product, ["features", "features_and_benefits"])}</div>
        ),
      },
      {
        key: "benefits",
        title: "Benefits",
        content: (
          <div className="px-4 pb-4 pt-2 text-sm text-gray-700">{renderMetaList(product, ["benefits"])}</div>
        ),
      },
      {
        key: "variations",
        title: "Variations",
        content: (
          <div className="px-4 pb-4 pt-2 text-sm text-gray-700">
            {variations && variations.length > 0 ? (
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {variations.map((v) => (
                  <li key={v.id} className="rounded border p-2">
                    <div className="font-medium text-gray-900">
                      ${v.price}
                      {v.on_sale && v.regular_price && v.regular_price !== v.price ? (
                        <span className="ml-2 text-xs text-red-500 line-through">${v.regular_price}</span>
                      ) : null}
                    </div>
                    <div className="mt-1 text-xs text-gray-600">
                      {v.attributes.map((a) => `${a.name}: ${a.option}`).join(", ")}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div>No variations available.</div>
            )}
          </div>
        ),
      },
    ];
  }, [product, variations]);

  const [openIndex, setOpenIndex] = useState<number>(0); // first section open

  return (
		<div className="space-y-4">
			{sections.map((sec, idx) => (
				<AccordionItem
					key={sec.key}
					open={openIndex === idx}
					title={sec.title}
					onToggle={() => setOpenIndex(idx)}
				>
					{sec.content}
				</AccordionItem>
			))}
		</div>
  );
}

function renderMetaList(product: any, keys: string[]) {
  const meta = (product as any)?.meta_data as Array<{ key: string; value: any }> | undefined;
  const found = meta?.find((m) => keys.includes(String(m.key).toLowerCase()));
  if (!found) return <div className="text-sm text-gray-600">No data available.</div>;
  const val = found.value;
  if (typeof val === "string") return <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: val }} />;
  if (Array.isArray(val))
    return (
      <ul className="list-disc pl-5">
        {val.map((v: any, i: number) => (
          <li key={i}>{String(v)}</li>
        ))}
      </ul>
    );
  return <div className="text-sm text-gray-600">No data available.</div>;
}

function AccordionItem({ open, title, onToggle, children }: { open: boolean; title: string; onToggle: () => void; children: React.ReactNode }) {
	const [max, setMax] = useState<number>(0);
	const ref = useState<HTMLDivElement | null>(null)[0] as any;

	return (
		<div className="rounded-lg bg-gray-50">
			<button
				type="button"
				onClick={onToggle}
				className="flex w-full cursor-pointer items-center justify-between rounded-lg p-4 text-left font-medium text-gray-900"
				aria-expanded={open}
			>
				<span>{title}</span>
				<span className="ml-2 text-lg leading-none">{open ? "−" : "+"}</span>
			</button>
			<div
				ref={(el) => {
					// store node and measure
					// @ts-ignore
					ref && (ref.current = el);
					if (el) setMax(el.scrollHeight);
				}}
				style={{
					maxHeight: open ? max : 0,
					opacity: open ? 1 : 0,
					transition: "max-height 300ms ease, opacity 200ms ease",
					overflow: "hidden",
				}}
			>
				{children}
			</div>
		</div>
	);
}


