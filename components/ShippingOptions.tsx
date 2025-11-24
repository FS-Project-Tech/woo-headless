"use client";

import { useEffect, useState } from "react";

interface ShippingRate {
  id: string;
  label: string;
  cost: number;
  description?: string;
  minimum_amount?: number;
  maximum_amount?: number;
  requires?: string;
}

interface ShippingOptionsProps {
  country?: string;
  zone?: string;
  postcode?: string;
  state?: string;
  selectedRateId?: string;
  onRateChange?: (rateId: string, rate: ShippingRate) => void;
  className?: string;
  showLabel?: boolean;
  subtotal?: number; // Cart subtotal for rule-based filtering
  items?: Array<{ id: string; productId: number; price: string; qty: number; [key: string]: any }>; // Cart items for filtering
}

export default function ShippingOptions({
  country = "AU",
  zone,
  postcode,
  state,
  selectedRateId,
  onRateChange,
  className = "",
  showLabel = true,
  subtotal = 0,
  items = [],
}: ShippingOptionsProps) {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [loadingRates, setLoadingRates] = useState(false);
  const [internalSelectedId, setInternalSelectedId] = useState<string>("");

  // Use controlled or internal state
  const currentSelectedId = selectedRateId !== undefined ? selectedRateId : internalSelectedId;

  useEffect(() => {
    if (!country) return;

    let cancelled = false;
    (async () => {
      try {
        setLoadingRates(true);
        const params = new URLSearchParams();
        if (country) params.set("country", country);
        if (zone) params.set("zone", zone);
        if (postcode) params.set("postcode", postcode);
        if (state) params.set("state", state);
        
        // Add cart data for rule-based filtering
        if (subtotal > 0) {
          params.set("subtotal", subtotal.toString());
        }
        if (items.length > 0) {
          params.set("items", JSON.stringify(items));
        }

        const res = await fetch(`/api/shipping/rates?${params.toString()}`, { cache: "no-store" });
        const json = await res.json();
        const fetched: ShippingRate[] = Array.isArray(json.rates) ? json.rates : [];

        if (!cancelled) {
          setRates(fetched);
          if (fetched.length > 0) {
            const firstId = fetched[0].id;
            if (selectedRateId === undefined) {
              setInternalSelectedId(firstId);
            }
            if (onRateChange && fetched[0]) {
              onRateChange(firstId, fetched[0]);
            }
          }
        }
      } catch {
        if (!cancelled) {
          setRates([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingRates(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [country, zone, postcode, state, subtotal, items, selectedRateId, onRateChange]);

  const handleRateChange = (rate: ShippingRate) => {
    if (selectedRateId === undefined) {
      setInternalSelectedId(rate.id);
    }
    if (onRateChange) {
      onRateChange(rate.id, rate);
    }
  };

  return (
    <div className={className}>
      {showLabel && (
        <label className="block text-sm font-semibold text-gray-900 mb-2">Shipping Options</label>
      )}
      {loadingRates && (
        <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>Loading rates…</span>
        </div>
      )}
      {!loadingRates && rates.length === 0 && (
        <div className="text-sm text-gray-500 py-2">No shipping rates found</div>
      )}
      <div className="space-y-2">
        {rates.map((r) => (
          <label
            key={r.id}
            className="flex cursor-pointer items-center gap-3 p-3 rounded-lg border-2 transition-all hover:bg-white hover:border-teal-300"
            style={{ borderColor: currentSelectedId === r.id ? "#14b8a6" : "#e5e7eb" }}
          >
            <input
              type="radio"
              name="shipping-rate"
              value={r.id}
              checked={currentSelectedId === r.id}
              onChange={() => handleRateChange(r)}
              className="h-4 w-4 text-teal-600 focus:ring-teal-500"
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">{r.label}</div>
              {r.description && <div className="text-xs text-gray-500">{r.description}</div>}
              {r.minimum_amount && (
                <div className="text-xs text-gray-500 mt-0.5">
                  Min. order: ${r.minimum_amount.toFixed(2)}
                </div>
              )}
            </div>
            <div className="text-sm font-semibold text-gray-900">${r.cost.toFixed(2)}</div>
          </label>
        ))}
      </div>
    </div>
  );
}

