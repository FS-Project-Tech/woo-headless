import { NextResponse } from "next/server";
import wcAPI from "@/lib/woocommerce";

// Server-side cache for index data
const INDEX_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
let cachedIndex: any = null;
let cacheTimestamp = 0;

export async function GET() {
  try {
    const now = Date.now();
    
    // Serve from cache if fresh
    if (cachedIndex && (now - cacheTimestamp) < INDEX_CACHE_TTL) {
      return NextResponse.json(cachedIndex, {
        headers: {
          'Cache-Control': 'public, max-age=86400', // 24 hours
        },
      });
    }
    
    // Fetch products (lightweight fields only)
    const productsRes = await wcAPI.get('/products', {
      params: {
        status: 'publish',
        per_page: 100,
        page: 1,
        _fields: [
          'id',
          'name',
          'slug',
          'sku',
          'price',
          'regular_price',
          'on_sale',
          'images',
          'categories',
          'attributes',
        ].join(','),
      },
    });
    
    let products = productsRes.data || [];
    
    // Fetch additional pages if needed (up to 1000 products)
    if (products.length === 100) {
      const additionalPages = [];
      for (let page = 2; page <= 10 && additionalPages.length < 900; page++) {
        try {
          const res = await wcAPI.get('/products', {
            params: {
              status: 'publish',
              per_page: 100,
              page,
              _fields: [
                'id',
                'name',
                'slug',
                'sku',
                'price',
                'regular_price',
                'on_sale',
                'images',
                'categories',
                'attributes',
              ].join(','),
            },
          });
          if (res.data && res.data.length > 0) {
            additionalPages.push(...res.data);
          } else {
            break;
          }
        } catch (err) {
          console.error(`Error fetching products page ${page}:`, err);
          break;
        }
      }
      products = [...products, ...additionalPages];
    }
    
    // Fetch categories from product_cat taxonomy (WordPress REST API)
    let categories: any[] = [];
    try {
      const apiUrl = process.env.NEXT_PUBLIC_WC_API_URL || '';
      const url = new URL(apiUrl);
      const wpBase = `${url.protocol}//${url.host}/wp-json/wp/v2`;
      
      const categoriesRes = await fetch(`${wpBase}/product_cat?per_page=100&hide_empty=true&_fields=id,name,slug`, {
        cache: 'no-store',
      });
      
      if (categoriesRes.ok) {
        const catData = await categoriesRes.json();
        categories = Array.isArray(catData) ? catData : [];
      } else {
        // Fallback to WooCommerce API
        const fallbackRes = await wcAPI.get('/products/categories', {
          params: {
            per_page: 100,
            hide_empty: true,
            _fields: 'id,name,slug',
          },
        });
        categories = fallbackRes.data || [];
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Fallback to WooCommerce API
      try {
        const fallbackRes = await wcAPI.get('/products/categories', {
          params: {
            per_page: 100,
            hide_empty: true,
            _fields: 'id,name,slug',
          },
        });
        categories = fallbackRes.data || [];
      } catch (fallbackError) {
        console.error('Fallback category fetch failed:', fallbackError);
        categories = [];
      }
    }
    
    // Fetch brands from product_brand taxonomy (WordPress REST API)
    let brands: any[] = [];
    try {
      const apiUrl = process.env.NEXT_PUBLIC_WC_API_URL || '';
      const url = new URL(apiUrl);
      const wpBase = `${url.protocol}//${url.host}/wp-json/wp/v2`;
      
      const brandsRes = await fetch(`${wpBase}/product_brand?per_page=100&hide_empty=true&_fields=id,name,slug`, {
        cache: 'no-store',
      });
      
      if (brandsRes.ok) {
        const brandData = await brandsRes.json();
        brands = Array.isArray(brandData) ? brandData : [];
      } else {
        // Fallback: try alternate taxonomy names
        const fallbackRes = await fetch(`${wpBase}/brands?per_page=100&hide_empty=true&_fields=id,name,slug`, {
          cache: 'no-store',
        });
        if (fallbackRes.ok) {
          const brandData = await fallbackRes.json();
          brands = Array.isArray(brandData) ? brandData : [];
        }
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
      brands = [];
    }
    
    const indexData = {
      products: products.slice(0, 1000), // Limit to 1000 products for performance
      categories,
      brands,
      timestamp: now,
      totalProducts: products.length,
    };
    
    // Update cache
    cachedIndex = indexData;
    cacheTimestamp = now;
    
    return NextResponse.json(indexData, {
      headers: {
        'Cache-Control': 'public, max-age=86400', // 24 hours
      },
    });
  } catch (error: any) {
    console.error('Error building search index:', error);
    return NextResponse.json(
      {
        products: [],
        categories: [],
        brands: [],
        timestamp: Date.now(),
        totalProducts: 0,
      },
      { status: 200 }
    );
  }
}

