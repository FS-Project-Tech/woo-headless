import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/Header";
import CartProvider from "@/components/CartProvider";
import AuthProvider from "@/components/AuthProvider";
import WishlistProvider from "@/components/WishlistProvider";
import ToastProvider from "@/components/ToastProvider";
import MiniCartDrawer from "@/components/MiniCartDrawer";
import CategoriesNav from "@/components/CategoriesNav";
import Footer from "@/components/Footer";
import { CheckoutProvider } from "@/components/CheckoutProvider";
import BottomNav from "@/components/BottomNav";
import PWARegister from "@/components/PWARegister";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WooCommerce Headless Store",
  description: "A modern headless e-commerce solution with Next.js and WooCommerce",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ToastProvider>
          <AuthProvider>
            <WishlistProvider>
              <CartProvider>
                <CheckoutProvider>
                  <Header />
                  <CategoriesNav />
                  <main suppressHydrationWarning>
                    <div className="mx-auto w-full px-4 sm:px-6 md:w-[85vw] pb-16 md:pb-0" suppressHydrationWarning>
                      {children}
                    </div>
                  </main>
                  <Footer />
                  <MiniCartDrawer />
                  <BottomNav />
                  <PWARegister />
                </CheckoutProvider>
              </CartProvider>
            </WishlistProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
