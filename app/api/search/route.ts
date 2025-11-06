import { NextResponse } from "next/server";
import wcAPI from "@/lib/woocommerce";

// Fast in-memory cache
const CACHE_TTL_MS = 60_000; // 1 minute
const cache = new Map<string, { expires: number; data: any }>();

/**
 * Weighted search with fuzzy matching
 * Priority: Product name > SKU > Brand > Category > Description
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    
    if (!q || q.length < 2) {
      return NextResponse.json({ products: [], categories: [], brands: [] });
    }
    
    // Check cache
    const cacheKey = `search:${q.toLowerCase()}`;
    const now = Date.now();
    const cached = cache.get(cacheKey);
    if (cached && cached.expires > now) {
      return NextResponse.json(cached.data);
    }
    
    // Get WordPress base URL for taxonomy endpoints
    const apiUrl = process.env.NEXT_PUBLIC_WC_API_URL || '';
    const url = new URL(apiUrl);
    const wpBase = `${url.protocol}//${url.host}/wp-json/wp/v2`;
    
    // Fetch from WooCommerce with optimized fields
    const [productsRes, categoriesRes, brandsRes] = await Promise.all([
      wcAPI.get("/products", {
        params: {
          per_page: 20, // Limit for speed
          search: q,
          status: "publish",
          _fields: [
            "id",
            "name",
            "slug",
            "sku",
            "price",
            "regular_price",
            "on_sale",
            "images",
            "categories",
            "attributes",
          ].join(","),
        },
      }),
      // Fetch categories from product_cat taxonomy
      fetch(`${wpBase}/product_cat?per_page=10&search=${encodeURIComponent(q)}&hide_empty=true&_fields=id,name,slug`, {
        cache: 'no-store',
      }).catch(() => ({ ok: false, json: async () => [] })),
      // Fetch brands from product_brand taxonomy
      fetch(`${wpBase}/product_brand?per_page=10&search=${encodeURIComponent(q)}&hide_empty=true&_fields=id,name,slug`, {
        cache: 'no-store',
      }).catch(() => ({ ok: false, json: async () => [] })),
    ]);
    
    const products = (productsRes.data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      price: p.price,
      regular_price: p.regular_price,
      on_sale: p.on_sale,
      image: p.images?.[0]?.src,
      categories: p.categories || [],
    }));
    
    // Parse categories response
    let categories: any[] = [];
    try {
      if (categoriesRes.ok) {
        const catData = await categoriesRes.json();
        categories = Array.isArray(catData) ? catData : [];
      } else {
        // Fallback to WooCommerce API
        const fallback = await wcAPI.get("/products/categories", {
          params: {
            per_page: 10,
            search: q,
            hide_empty: true,
            _fields: "id,name,slug",
          },
        });
        categories = (fallback.data || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
        }));
      }
    } catch (error) {
      console.error('Error parsing categories:', error);
      categories = [];
    }
    
    // Parse brands response
    let brands: any[] = [];
    try {
      if (brandsRes.ok) {
        const brandData = await brandsRes.json();
        brands = Array.isArray(brandData) ? brandData : [];
      } else {
        // Try alternate taxonomy name
        try {
          const fallback = await fetch(`${wpBase}/brands?per_page=10&search=${encodeURIComponent(q)}&hide_empty=true&_fields=id,name,slug`, {
            cache: 'no-store',
          });
          if (fallback.ok) {
            const brandData = await fallback.json();
            brands = Array.isArray(brandData) ? brandData : [];
          }
        } catch {}
      }
    } catch (error) {
      console.error('Error parsing brands:', error);
      brands = [];
    }
    
    // Filter brands by search query
    const qLower = q.toLowerCase();
    brands = brands.filter(
      (b: any) => b.name?.toLowerCase().includes(qLower) || b.slug?.includes(qLower)
    );
    
    // Detect if query looks like a SKU
    const isSKULikeQuery = /^[A-Z0-9_-]+$/i.test(q) && q.length >= 3;
    
    // Score and sort products by relevance
    const scoredProducts = products.map((p: any) => {
      let score = 0;
      const nameLower = (p.name || '').toLowerCase();
      const skuLower = (p.sku || '').toLowerCase();
      
      // SKU matching (highest priority if query looks like SKU)
      if (p.sku && skuLower) {
        // Exact SKU match - highest priority
        if (skuLower === qLower) {
          score += isSKULikeQuery ? 2000 : 1000; // Boost if query looks like SKU
        }
        // SKU starts with query
        else if (skuLower.startsWith(qLower)) {
          score += isSKULikeQuery ? 1000 : 500;
        }
        // SKU contains query
        else if (skuLower.includes(qLower)) {
          score += isSKULikeQuery ? 600 : 300;
        }
        // Partial SKU match for SKU-like queries
        else if (isSKULikeQuery && q.length >= 2) {
          const queryChars = qLower.split('');
          let matchedChars = 0;
          for (let i = 0, j = 0; i < skuLower.length && j < queryChars.length; i++) {
            if (skuLower[i] === queryChars[j]) {
              matchedChars++;
              j++;
            }
          }
          if (matchedChars >= Math.min(q.length, 3)) {
            score += 400 * (matchedChars / q.length);
          }
        }
      }
      
      // Exact name match
      if (nameLower === qLower) score += 1000;
      // Name starts with query
      else if (nameLower.startsWith(qLower)) score += 500;
      // Name contains query
      else if (nameLower.includes(qLower)) score += 200;
      
      return { ...p, _score: score };
    });
    
    scoredProducts.sort((a: any, b: any) => b._score - a._score);
    const sortedProducts = scoredProducts.map(({ _score, ...rest }: any) => rest);
    
    const result = {
      products: sortedProducts.slice(0, 10),
      categories: categories.slice(0, 8),
      brands: brands.slice(0, 8),
    };
    
    // Cache result
    cache.set(cacheKey, { expires: now + CACHE_TTL_MS, data: result });
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { products: [], categories: [], brands: [] },
      { status: 200 }
    );
  }
}
