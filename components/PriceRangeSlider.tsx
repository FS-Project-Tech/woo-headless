"use client";

import { useState, useEffect, useRef } from "react";

interface PriceRangeSliderProps {
  min: number;
  max: number;
  minValue: number;
  maxValue: number;
  onChange: (min: number, max: number) => void;
}

export default function PriceRangeSlider({
  min,
  max,
  minValue: initialMinValue,
  maxValue: initialMaxValue,
  onChange,
}: PriceRangeSliderProps) {
  // Initialize with min/max to ensure consistent SSR
  const [localMin, setLocalMin] = useState(min);
  const [localMax, setLocalMax] = useState(max);
  const [isDragging, setIsDragging] = useState<"min" | "max" | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Update from props after mount
  useEffect(() => {
    setLocalMin(initialMinValue || min);
    setLocalMax(initialMaxValue || max);
  }, [initialMinValue, initialMaxValue, min, max]);

  const getPercentage = (value: number) => {
    return ((value - min) / (max - min)) * 100;
  };

  const handleMouseDown = (type: "min" | "max") => {
    setIsDragging(type);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !sliderRef.current) return;

      const rect = sliderRef.current.getBoundingClientRect();
      const percentage = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const value = min + (percentage / 100) * (max - min);

      if (isDragging === "min") {
        const newMin = Math.max(min, Math.min(value, localMax - 1));
        setLocalMin(newMin);
      } else {
        const newMax = Math.min(max, Math.max(value, localMin + 1));
        setLocalMax(newMax);
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        onChange(localMin, localMax);
        setIsDragging(null);
      }
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, localMin, localMax, min, max, onChange]);

  const minPercentage = getPercentage(localMin);
  const maxPercentage = getPercentage(localMax);

  return (
    <div className="space-y-4">
      <div className="flex justify-between text-xs text-gray-600 mb-2">
        <span>${Math.round(localMin)}</span>
        <span>${Math.round(localMax)}</span>
      </div>
      <div ref={sliderRef} className="relative h-2 bg-gray-200 rounded-full">
        <div
          className="absolute h-2 bg-blue-600 rounded-full"
          style={{
            left: `${minPercentage}%`,
            width: `${maxPercentage - minPercentage}%`,
          }}
        />
        <button
          type="button"
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-600 border-2 border-white rounded-full shadow-md cursor-grab active:cursor-grabbing hover:bg-blue-700 transition-colors"
          style={{ left: `calc(${minPercentage}% - 8px)` }}
          onMouseDown={(e) => {
            e.preventDefault();
            handleMouseDown("min");
          }}
          aria-label="Min price"
        />
        <button
          type="button"
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-600 border-2 border-white rounded-full shadow-md cursor-grab active:cursor-grabbing hover:bg-blue-700 transition-colors"
          style={{ left: `calc(${maxPercentage}% - 8px)` }}
          onMouseDown={(e) => {
            e.preventDefault();
            handleMouseDown("max");
          }}
          aria-label="Max price"
        />
      </div>
      <div className="flex gap-2">
        <input
          type="number"
          min={min}
          max={max}
          value={Math.round(localMin)}
          onChange={(e) => {
            const val = Math.max(min, Math.min(max, parseFloat(e.target.value) || min));
            setLocalMin(val);
            onChange(val, localMax);
          }}
          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <input
          type="number"
          min={min}
          max={max}
          value={Math.round(localMax)}
          onChange={(e) => {
            const val = Math.max(min, Math.min(max, parseFloat(e.target.value) || max));
            setLocalMax(val);
            onChange(localMin, val);
          }}
          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}

