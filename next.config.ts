import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wordpress-1496507-5718895.cloudwaysapps.com',
        port: '',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'wordpress-1496507-5718895.cloudwaysapps.com',
        port: '',
        pathname: '/wp-content/uploads/**',
      },
      // Add your actual WooCommerce domain here
      {
        protocol: 'https',
        hostname: 'wordpress-1496507-5718895.cloudwaysapps.com',
        port: '',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'wordpress-1496507-5718895.cloudwaysapps.com',
        port: '',
        pathname: '/wp-content/uploads/**',
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
