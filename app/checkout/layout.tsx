"use client";

import { CheckoutProvider } from "@/components/CheckoutProvider";

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CheckoutProvider>{children}</CheckoutProvider>;
}

