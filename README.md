# WooCommerce Headless Store

A blazing-fast headless eCommerce website built with Next.js 14 and WooCommerce.

## Features

- ⚡ **Next.js 14** with App Router and TypeScript
- 🎨 **Tailwind CSS** for modern, responsive styling
- 🎭 **Framer Motion** for smooth animations
- 🔄 **React Query** for efficient data fetching and caching
- 🛒 **WooCommerce REST API** integration
- 📱 **Fully Responsive** design for all devices
- 🔍 **Advanced Search** with real-time suggestions
- 🏷️ **Product Filtering** and categorization
- 🛡️ **SEO Optimized** with metadata and sitemaps
- ⚡ **Image Optimization** with Next.js Image component
- 🎨 **Modern UI Components** with shadcn/ui
- 📊 **Loading Skeletons** and smooth transitions

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Animations**: Framer Motion
- **Data Fetching**: TanStack React Query
- **API**: WooCommerce REST API
- **Styling**: Tailwind CSS with custom design system
- **Icons**: Lucide React
- **HTTP Client**: Axios

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- WooCommerce store with REST API enabled

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd wooo-headless
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your environment variables in `.env.local`:
```env
NEXT_PUBLIC_WOOCOMMERCE_URL=https://your-woocommerce-site.com
NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_KEY=your_consumer_key
NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_SECRET=your_consumer_secret
NEXT_PUBLIC_WORDPRESS_URL=https://your-wordpress-site.com
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## WooCommerce Setup

### 1. Enable REST API

1. Go to your WordPress admin dashboard
2. Navigate to **WooCommerce > Settings > Advanced > REST API**
3. Click **Add Key**
4. Set description (e.g., "Headless Store API")
5. Set user to an administrator
6. Set permissions to **Read/Write**
7. Click **Generate API Key**
8. Copy the **Consumer Key** and **Consumer Secret**

### 2. Configure CORS (if needed)

If you encounter CORS issues, you may need to add CORS headers to your WordPress site. You can use a plugin like "CORS" or add the following to your theme's `functions.php`:

```php
function add_cors_http_header(){
    header("Access-Control-Allow-Origin: *");
}
add_action('init','add_cors_http_header');
```

### 3. Test API Connection

You can test your API connection by visiting:
```
https://your-site.com/wp-json/wc/v3/products
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── products/          # Product pages
│   ├── categories/        # Category pages
│   ├── search/           # Search page
│   └── layout.tsx        # Root layout
├── components/           # React components
│   ├── ui/              # Reusable UI components
│   ├── layout/         # Layout components
│   ├── product/        # Product-related components
│   └── homepage/       # Homepage components
├── hooks/              # Custom React hooks
├── lib/               # Utility libraries
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

## Key Components

### Layout Components
- **Header**: Navigation with search and cart
- **Footer**: Links and company information
- **Layout**: Main layout wrapper

### Product Components
- **ProductCard**: Individual product display
- **ProductGrid**: Grid layout for products
- **CategoryCard**: Category display
- **CategoryGrid**: Category grid layout

### Homepage Components
- **Hero**: Hero section with CTA
- **FeaturedProducts**: Featured products section
- **CategoriesSection**: Categories showcase
- **TestimonialsSection**: Customer testimonials

## API Integration

The app uses React Query for efficient data fetching with the following hooks:

- `useProducts()` - Fetch products with filters
- `useProduct()` - Fetch single product
- `useCategories()` - Fetch product categories
- `useSearchProducts()` - Search products
- `useMenu()` - Fetch WordPress menu

## Customization

### Styling
The app uses Tailwind CSS with a custom design system. You can customize colors, fonts, and spacing in:
- `tailwind.config.ts` - Tailwind configuration
- `src/app/globals.css` - Global styles and CSS variables

### Components
All components are built with shadcn/ui and can be customized by modifying the component files in `src/components/ui/`.

### API Configuration
API configuration is handled in `src/lib/woocommerce.ts`. You can modify the base URL, authentication, and request/response handling here.

## Performance Optimizations

- **Image Optimization**: Next.js Image component with proper sizing
- **Code Splitting**: Automatic code splitting with Next.js
- **Caching**: React Query for API response caching
- **Lazy Loading**: Components load as needed
- **SEO**: Optimized metadata and sitemaps

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Railway
- DigitalOcean App Platform

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_WOOCOMMERCE_URL` | Your WooCommerce site URL | Yes |
| `NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_KEY` | WooCommerce API consumer key | Yes |
| `NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_SECRET` | WooCommerce API consumer secret | Yes |
| `NEXT_PUBLIC_WORDPRESS_URL` | Your WordPress site URL | Yes |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue on GitHub or contact the development team.

## Roadmap

- [ ] User authentication and accounts
- [ ] Shopping cart persistence
- [ ] Product reviews and ratings
- [ ] Wishlist functionality
- [ ] Multi-language support
- [ ] Advanced product filtering
- [ ] Payment integration
- [ ] Order tracking