"use client";

import { useState } from "react";

export type RecurringPlan = "none" | "7" | "14" | "30";

export default function RecurringSelect({ onChange }: { onChange?: (plan: RecurringPlan) => void }) {
	const [plan, setPlan] = useState<RecurringPlan>("none");

	function set(p: RecurringPlan) {
		setPlan(p);
		onChange?.(p);
	}

	return (
		<div className="space-y-2">
			<div className="text-sm font-medium text-gray-900">Delivery frequency</div>
			<div className="flex flex-wrap gap-2">
				<button onClick={() => set("none")} className={`rounded-full border px-3 py-1 text-sm ${plan === "none" ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 hover:bg-gray-50"}`}>One-time</button>
				<button onClick={() => set("7")} className={`rounded-full border px-3 py-1 text-sm ${plan === "7" ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 hover:bg-gray-50"}`}>Every 7 days</button>
				<button onClick={() => set("14")} className={`rounded-full border px-3 py-1 text-sm ${plan === "14" ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 hover:bg-gray-50"}`}>Every 14 days</button>
				<button onClick={() => set("30")} className={`rounded-full border px-3 py-1 text-sm ${plan === "30" ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 hover:bg-gray-50"}`}>Every month</button>
			</div>
		</div>
	);
}
