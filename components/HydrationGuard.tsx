"use client";

import { useEffect, useState, ReactNode } from "react";

/**
 * HydrationGuard - Prevents hydration mismatches by only rendering children after mount
 * Use this wrapper for components that access browser-only APIs (localStorage, window, etc.)
 */
export default function HydrationGuard({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

