"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function CheckoutHeader() {
  const pathname = usePathname();
  
  const steps = [
    { path: "/checkout/cart", label: "1. Cart" },
    { path: "/checkout/details", label: "2. Details" },
    { path: "/checkout/payment", label: "3. Payment" },
    { path: "/checkout/confirmation", label: "4. Confirmation" },
  ];

  return (
    <div className="mb-6 flex gap-2 text-sm">
      {steps.map((step, idx) => (
        <div key={step.path} className="flex items-center gap-2">
          <span className={pathname === step.path ? "font-bold text-gray-900" : "text-gray-500"}>
            {step.label}
          </span>
          {idx < steps.length - 1 && <span className="text-gray-400">›</span>}
        </div>
      ))}
    </div>
  );
}

