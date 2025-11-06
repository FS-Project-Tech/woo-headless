"use client";

import { useEffect, useMemo, useState } from "react";

export interface VariationAttributeDef {
	name: string; // 'Color'
	options: string[]; // ['Red','Blue']
}

export interface VariationInfo {
	id: number;
	price: string;
	regular_price: string;
	on_sale: boolean;
	attributes: { name: string; option: string }[];
	stock_status: string;
}

export interface VariationSwatchesProps {
	attributes: VariationAttributeDef[];
	variations: VariationInfo[];
	onChange?: (selected: { [name: string]: string }, matched?: VariationInfo | null) => void;
}

export default function VariationSwatches({ attributes, variations, onChange }: VariationSwatchesProps) {
	const [selected, setSelected] = useState<{ [name: string]: string }>({});

	const matched = useMemo(() => {
		const names = Object.keys(selected);
		if (names.length === 0) return null;
		return (
			variations.find((v) =>
				names.every((n) => v.attributes.some((a) => eq(a.name, n) && eq(a.option, selected[n])))
			) || null
		);
	}, [selected, variations]);

    function toggle(name: string, option: string) {
        setSelected((prev) => {
            const next = { ...prev, [name]: prev[name] === option ? "" : option };
            if (next[name] === "") delete next[name];
            return next;
        });
    }

    // Notify parent when selection changes (after render)
    useEffect(() => {
        onChange?.(selected, matched);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(selected), matched?.id]);

	return (
		<div className="space-y-4">
			{attributes.map((attr) => (
				<div key={attr.name}>
					<div className="mb-2 text-sm font-medium text-gray-900">{attr.name}</div>
					<div className="flex flex-wrap gap-2">
						{uniq(attr.options).map((opt) => {
							const active = selected[attr.name] === opt;
							return (
								<button
									key={opt}
									onClick={() => toggle(attr.name, opt)}
									className={`rounded-full border px-3 py-1 text-sm transition ${active ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 text-gray-800 hover:bg-gray-50"}`}
								>
									{opt}
								</button>
							);
						})}
					</div>
				</div>
			))}

			{/* Price preview */}
			{matched && (
				<div className="text-sm text-gray-600">
					Selected variation price: <span className="font-semibold text-gray-900">${matched.price}</span>
					{matched.on_sale && matched.regular_price && matched.regular_price !== matched.price && (
						<span className="ml-2 line-through">${matched.regular_price}</span>
					)}
				</div>
			)}
		</div>
	);
}

function eq(a?: string, b?: string) {
	return (a || "").toLowerCase() === (b || "").toLowerCase();
}

function uniq(list: string[]) {
	return Array.from(new Set(list.filter(Boolean)));
}
