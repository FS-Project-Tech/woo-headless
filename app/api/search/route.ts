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
      return NextResponse.json({ products: [], categories: [], brands: [], tags: [], skus: [] });
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
    if (!apiUrl) {
      console.error('NEXT_PUBLIC_WC_API_URL is not set');
      return NextResponse.json(
        { products: [], categories: [], brands: [], tags: [], skus: [] },
        { status: 200 }
      );
    }
    
    let wpBase: string;
    try {
      const url = new URL(apiUrl);
      wpBase = `${url.protocol}//${url.host}/wp-json/wp/v2`;
    } catch (e) {
      console.error('Invalid NEXT_PUBLIC_WC_API_URL:', e);
      return NextResponse.json(
        { products: [], categories: [], brands: [], tags: [], skus: [] },
        { status: 200 }
      );
    }
    
    // Fetch from WooCommerce with optimized fields
    // Use Promise.allSettled to handle partial failures gracefully
    const [productsResult, categoriesResult, brandsResult, tagsResult] = await Promise.allSettled([
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
      }).catch((e) => {
        console.error('Error fetching products:', e);
        return { data: [] };
      }),
      // Fetch categories from product_cat taxonomy
      fetch(`${wpBase}/product_cat?per_page=10&search=${encodeURIComponent(q)}&hide_empty=true&_fields=id,name,slug`, {
        cache: 'no-store',
      }).catch(() => ({ ok: false, json: async () => [] })),
      // Fetch brands from product_brand taxonomy
      fetch(`${wpBase}/product_brand?per_page=10&search=${encodeURIComponent(q)}&hide_empty=true&_fields=id,name,slug`, {
        cache: 'no-store',
      }).catch(() => ({ ok: false, json: async () => [] })),
      // Fetch tags from product_tag taxonomy
      fetch(`${wpBase}/product_tag?per_page=10&search=${encodeURIComponent(q)}&hide_empty=true&_fields=id,name,slug`, {
        cache: 'no-store',
      }).catch(() => ({ ok: false, json: async () => [] })),
    ]);
    
    // Extract results safely
    const productsRes = productsResult.status === 'fulfilled' ? productsResult.value : { data: [] };
    const categoriesRes = categoriesResult.status === 'fulfilled' ? categoriesResult.value : { ok: false, json: async () => [] };
    const brandsRes = brandsResult.status === 'fulfilled' ? brandsResult.value : { ok: false, json: async () => [] };
    const tagsRes = tagsResult.status === 'fulfilled' ? tagsResult.value : { ok: false, json: async () => [] };
    
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
    
    // Parse tags response
    let tags: any[] = [];
    try {
      if (tagsRes.ok) {
        const tagData = await tagsRes.json();
        tags = Array.isArray(tagData) ? tagData : [];
      } else {
        // Fallback to WooCommerce API
        try {
          const fallback = await wcAPI.get("/products/tags", {
            params: {
              per_page: 10,
              search: q,
              hide_empty: true,
              _fields: "id,name,slug",
            },
          });
          tags = (fallback.data || []).map((t: any) => ({
            id: t.id,
            name: t.name,
            slug: t.slug,
          }));
        } catch (fallbackError) {
          console.error('Error fetching tags fallback:', fallbackError);
          tags = [];
        }
      }
    } catch (error) {
      console.error('Error parsing tags:', error);
      tags = [];
    }
    
    // Filter tags by search query
    tags = tags.filter(
      (t: any) => t.name?.toLowerCase().includes(qLower) || t.slug?.includes(qLower)
    );
    
    // Parse multiple SKUs from query (comma, space, or newline separated)
    const parseMultipleSKUs = (query: string): string[] => {
      const skus = query
        .split(/[,\n\r]+|\s{2,}/)
        .map(s => s.trim())
        .filter(s => s.length >= 2 && /^[A-Z0-9_-]+$/i.test(s));
      return skus.length > 1 ? skus : [];
    };
    
    // qLower is already defined above (line 132)
    const multipleSKUs = parseMultipleSKUs(q);
    const isMultipleSKUSearch = multipleSKUs.length > 1;
    const isSKULikeQuery = /^[A-Z0-9_-]+$/i.test(q) && q.length >= 2;
    
    // Score and sort products by relevance
    const scoredProducts = products.map((p: any) => {
      let score = 0;
      const nameLower = (p.name || '').toLowerCase();
      const skuLower = (p.sku || '').toLowerCase();
      
      // Handle multiple SKU search
      if (isMultipleSKUSearch && p.sku && skuLower) {
        for (const sku of multipleSKUs) {
          const skuLowerQuery = sku.toLowerCase();
          if (skuLower === skuLowerQuery) {
            score += 2000; // Exact match - highest priority
            break;
          } else if (skuLower.includes(skuLowerQuery) || skuLowerQuery.includes(skuLower)) {
            score = Math.max(score, 1500); // Partial match
          }
        }
      }
      // Single SKU matching (highest priority if query looks like SKU)
      else if (p.sku && skuLower && !isMultipleSKUSearch) {
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
    let sortedProducts = scoredProducts.map(({ _score, ...rest }: any) => rest);
    
    // For multiple SKU search, prioritize exact matches
    if (isMultipleSKUSearch) {
      const exactMatches: any[] = [];
      const partialMatches: any[] = [];
      const otherMatches: any[] = [];
      
      for (const product of sortedProducts) {
        if (!product.sku) {
          otherMatches.push(product);
          continue;
        }
        
        const productSKULower = (product.sku || '').toLowerCase();
        let isExact = false;
        let isPartial = false;
        
        for (const sku of multipleSKUs) {
          const skuLower = sku.toLowerCase();
          if (productSKULower === skuLower) {
            isExact = true;
            break;
          } else if (productSKULower.includes(skuLower) || skuLower.includes(productSKULower)) {
            isPartial = true;
          }
        }
        
        if (isExact) {
          exactMatches.push(product);
        } else if (isPartial) {
          partialMatches.push(product);
        } else {
          otherMatches.push(product);
        }
      }
      
      sortedProducts = [...exactMatches, ...partialMatches, ...otherMatches];
    }
    
    // Separate SKU matches from regular products
    const skuMatches: any[] = [];
    const regularProducts: any[] = [];
    
    // qLower and isSKULikeQuery are already defined above
    
    for (const product of sortedProducts) {
      if (product.sku) {
        const skuLower = (product.sku || '').toLowerCase();
        // Check if this product matches SKU search
        if (isSKULikeQuery && (skuLower === qLower || skuLower.includes(qLower) || qLower.includes(skuLower))) {
          skuMatches.push(product);
        } else if (isMultipleSKUSearch) {
          // For multiple SKU search, all matching products are SKU matches
          skuMatches.push(product);
        } else {
          regularProducts.push(product);
        }
      } else {
        regularProducts.push(product);
      }
    }
    
    // Fetch brand logos and category images from ACF if available
    // Note: This requires ACF REST API to be enabled in WordPress
    // Made non-blocking with timeout to prevent server errors
    const enrichWithACF = async (items: any[], type: 'brand' | 'category') => {
      if (items.length === 0) return items;
      
      try {
        const apiUrl = process.env.NEXT_PUBLIC_WC_API_URL || '';
        if (!apiUrl) return items; // Skip if no API URL
        
        let wpBase: string;
        try {
          const url = new URL(apiUrl);
          wpBase = `${url.protocol}//${url.host}/wp-json/wp/v2`;
        } catch (e) {
          // Invalid URL, skip enrichment
          return items;
        }
        
        const taxonomy = type === 'brand' ? 'product_brand' : 'product_cat';
        
        // Fetch ACF fields for each item with timeout protection
        const enriched = await Promise.allSettled(
          items.map(async (item) => {
            try {
              // Add timeout to prevent hanging
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
              
              const acfRes = await fetch(`${wpBase}/${taxonomy}/${item.id}?_fields=acf`, {
                cache: 'no-store',
                signal: controller.signal,
              });
              
              clearTimeout(timeoutId);
              
              if (acfRes.ok && acfRes.body) {
                const acfData = await acfRes.json();
                if (acfData.acf) {
                  return {
                    ...item,
                    image: acfData.acf.logo || acfData.acf.image || acfData.acf.thumbnail || item.image,
                    logo: acfData.acf.logo,
                  };
                }
              }
            } catch (e) {
              // ACF not available or error, continue without it
              // Silently fail - return original item
            }
            return item;
          })
        );
        
        // Extract successful results, fallback to original items on failure
        return enriched.map((result, index) => 
          result.status === 'fulfilled' ? result.value : items[index]
        );
      } catch (e) {
        // If enrichment fails completely, return original items
        console.error(`Error enriching ${type} with ACF:`, e);
        return items;
      }
    };
    
    // Enrich brands and categories with ACF data (non-blocking)
    // Use Promise.allSettled to ensure search works even if ACF fails
    let enrichedBrands = brands.slice(0, 5);
    let enrichedCategories = categories.slice(0, 5);
    
    try {
      const [brandsResult, categoriesResult] = await Promise.allSettled([
        enrichWithACF(brands.slice(0, 5), 'brand'),
        enrichWithACF(categories.slice(0, 5), 'category'),
      ]);
      
      enrichedBrands = brandsResult.status === 'fulfilled' ? brandsResult.value : brands.slice(0, 5);
      enrichedCategories = categoriesResult.status === 'fulfilled' ? categoriesResult.value : categories.slice(0, 5);
    } catch (e) {
      // If enrichment fails, use original data
      console.error('ACF enrichment failed, using original data:', e);
    }
    
    const result = {
      products: regularProducts.slice(0, 5),
      categories: enrichedCategories,
      brands: enrichedBrands,
      tags: tags.slice(0, 5),
      skus: skuMatches.slice(0, 5), // New: Matching SKUs group
    };
    
    // Cache result
    cache.set(cacheKey, { expires: now + CACHE_TTL_MS, data: result });
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { products: [], categories: [], brands: [], tags: [], skus: [] },
      { status: 200 }
    );
  }
}
