import type { NextConfig } from "next";

// Optionally include a domain from the WooCommerce API URL if provided
const wcApiUrl = process.env.NEXT_PUBLIC_WC_API_URL;
let wcHost: string | undefined;
try {
  if (wcApiUrl) {
    const u = new URL(wcApiUrl);
    wcHost = u.hostname;
  }
} catch {}

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['framer-motion', 'axios', 'swiper'],
  },
  // Optimize loading performance
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Webpack optimizations for faster builds (only when not using Turbopack)
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Optimize file watching on Windows - helps with slow file system watching
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: /node_modules/,
      };
    }
    return config;
  },
  images: {
    remotePatterns: [
      // Add known WooCommerce media hosts here
      {
        protocol: "https",
        hostname: "wordpress-1496507-5718895.cloudwaysapps.com",
      },
      // Placeholder image host used in development/demo sliders
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      // Unsplash images for NDIS and other sections
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      // Optionally allow the host derived from NEXT_PUBLIC_WC_API_URL
      // (common when media is served from the same domain)
      ...(wcHost
        ? ([
            {
              protocol: "https",
              hostname: wcHost,
            },
          ] as const)
        : ([] as const)),
    ],
    // Optimize images for better performance
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
};

export default nextConfig;
