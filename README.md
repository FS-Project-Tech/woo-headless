# WooCommerce Headless Store

A modern, headless e-commerce solution built with Next.js, TypeScript, and Tailwind CSS. This project connects to your WooCommerce store via the REST API, providing a fast and flexible frontend.

## Features

- 🚀 **Next.js 16** - Latest features and optimizations
- 🎨 **Tailwind CSS v4** - Modern styling with utility classes
- 📦 **TypeScript** - Type-safe development
- 🔌 **WooCommerce REST API** - Seamless integration with your store
- 🎯 **Product Pages** - Browse and view products with beautiful UI
- 📱 **Responsive Design** - Works on all devices

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A WooCommerce store with REST API access

### Installation

1. Clone the repository or navigate to the project directory:
```bash
cd woocommerce-headless-nextjs
```

2. Install dependencies:
```bash
npm install
```

### Configure WooCommerce API

1. In your WordPress admin, go to **WooCommerce > Settings > Advanced > REST API**

2. Click **Add key** to create new API credentials:
   - Set permissions to **Read**
   - Click **Generate API key**

3. Copy the Consumer Key and Consumer Secret

4. Create a `.env.local` file in the root directory:
```bash
cp env.example .env.local
```

5. Update `.env.local` with your WooCommerce credentials:
```env
NEXT_PUBLIC_WC_API_URL=https://your-site.com/wp-json/wc/v3
NEXT_PUBLIC_WC_CONSUMER_KEY=ck_your_consumer_key_here
NEXT_PUBLIC_WC_CONSUMER_SECRET=cs_your_consumer_secret_here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## Project Structure

```
├── app/
│   ├── products/
│   │   ├── [id]/
│   │   │   └── page.tsx      # Individual product page
│   │   └── page.tsx           # Products listing page
│   ├── layout.tsx             # Root layout with navigation
│   ├── page.tsx               # Home page
│   └── globals.css            # Global styles with Tailwind
├── components/
│   └── Navigation.tsx         # Main navigation component
├── lib/
│   └── woocommerce.ts         # WooCommerce API client
└── .env.local                 # Environment variables (not in git)
```

## Available Routes

- `/` - Home page with project overview
- `/products` - List of all products from your WooCommerce store
- `/products/[id]` - Individual product detail page

## WooCommerce API

The project includes a TypeScript wrapper for the WooCommerce REST API:

```typescript
import { fetchProducts, fetchProduct } from '@/lib/woocommerce';

// Fetch all products
const products = await fetchProducts({ per_page: 12 });

// Fetch a single product
const product = await fetchProduct(123);

// Fetch products by category
const products = await fetchProductsByCategory(15);
```

## Building for Production

```bash
npm run build
npm start
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [WooCommerce REST API Documentation](https://woocommerce.github.io/woocommerce-rest-api-docs/)

## License

MIT