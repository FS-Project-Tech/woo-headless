import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/components/providers/QueryProvider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "WooCommerce Headless Store",
  description: "A blazing-fast headless eCommerce website built with Next.js and WooCommerce",
  keywords: ["ecommerce", "woocommerce", "nextjs", "headless", "store"],
  authors: [{ name: "WooCommerce Headless Store" }],
  openGraph: {
    title: "WooCommerce Headless Store",
    description: "A blazing-fast headless eCommerce website built with Next.js and WooCommerce",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased" suppressHydrationWarning>
        <QueryProvider>
          {children}
          <Toaster richColors closeButton expand={false} />
        </QueryProvider>
      </body>
    </html>
  );
}
