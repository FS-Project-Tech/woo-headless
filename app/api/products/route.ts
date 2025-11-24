import { NextRequest, NextResponse } from "next/server";
import wcAPI from "@/lib/woocommerce";
import { createPublicApiHandler, API_TIMEOUT } from "@/lib/api-middleware";
import { sanitizeResponse, sanitizeProduct } from "@/lib/sanitize";
import { optimizeProductParams, monitorPayloadSize } from "@/lib/api-optimizer";
import { cacheGet, cacheSet, cacheInvalidate } from "@/lib/cache/redis-enhanced";
import { requestBatcher } from "@/lib/api-batcher";

/**
 * GET /api/products
 * Fetch products
 * Protected with rate limiting and response sanitization
 */
async function getProducts(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    
    // Build query parameters
    const params: any = {};
    if (searchParams.get("per_page")) {
      params.per_page = parseInt(searchParams.get("per_page") || "10");
    }
    if (searchParams.get("page")) {
      params.page = parseInt(searchParams.get("page") || "1");
    }
    if (searchParams.get("categorySlug")) {
      // Fetch category ID from slug first
      const categorySlug = searchParams.get("categorySlug");
      try {
        const catRes = await wcAPI.get("/products/categories", {
          params: { slug: categorySlug },
        });
        if (catRes.data && catRes.data.length > 0) {
          params.category = catRes.data[0].id;
        } else {
          // Category not found - log warning but continue without category filter
          console.warn(`Category not found for slug: ${categorySlug}`);
        }
      } catch (error: any) {
        // Log error but continue - will return all products if category lookup fails
        console.warn(`Failed to lookup category by slug "${categorySlug}":`, error.message || error);
      }
    }
    if (searchParams.get("categories")) {
      params.category = searchParams.get("categories");
    }
    if (searchParams.get("brands")) {
      // WooCommerce doesn't have native brand support, use attributes or tags
      // This is a placeholder - adjust based on your setup
      params.attribute = "pa_brand";
      params.attribute_term = searchParams.get("brands");
    }
    if (searchParams.get("tag")) {
      // Handle single tag filter (from search bar)
      const tagSlug = searchParams.get("tag");
      try {
        const tagRes = await wcAPI.get("/products/tags", {
          params: { slug: tagSlug },
        });
        if (tagRes.data && tagRes.data.length > 0) {
          params.tag = tagRes.data[0].id;
        }
      } catch {}
    }
    if (searchParams.get("tags")) {
      // Handle multiple tag filters (comma-separated slugs)
      const tagSlugs = searchParams.get("tags")?.split(",") || [];
      const tagIds: number[] = [];
      for (const slug of tagSlugs) {
        try {
          const tagRes = await wcAPI.get("/products/tags", {
            params: { slug: slug.trim() },
          });
          if (tagRes.data && tagRes.data.length > 0) {
            tagIds.push(tagRes.data[0].id);
          }
        } catch {}
      }
      if (tagIds.length > 0) {
        params.tag = tagIds.join(",");
      }
    }
    if (searchParams.get("minPrice")) {
      params.min_price = searchParams.get("minPrice");
    }
    if (searchParams.get("maxPrice")) {
      params.max_price = searchParams.get("maxPrice");
    }
    if (searchParams.get("sortBy")) {
      const sortBy = searchParams.get("sortBy");
      if (sortBy === "price-low") {
        params.orderby = "price";
        params.order = "asc";
      } else if (sortBy === "price-high") {
        params.orderby = "price";
        params.order = "desc";
      } else if (sortBy === "popularity") {
        params.orderby = "popularity";
      } else if (sortBy === "rating") {
        params.orderby = "rating";
      } else if (sortBy === "newest") {
        params.orderby = "date";
        params.order = "desc";
      }
    }
    // Handle search parameter (support both 'search' and 'Search' for compatibility)
    const searchQuery = searchParams.get("search") || searchParams.get("Search");
    if (searchQuery) {
      // Trim and clean the query
      const cleanQuery = searchQuery.trim();
      
      // Set the search parameter for WooCommerce
      params.search = cleanQuery;
      
      console.log("API Products - Search query:", cleanQuery);
    }
    if (searchParams.get("include")) {
      params.include = searchParams.get("include");
    }

    // Optimize parameters with field selection
    const useCase = searchParams.get("search") ? "search" : "list";
    const optimizedParams = optimizeProductParams(params, useCase);
    
    // Generate cache key
    const cacheKey = JSON.stringify(optimizedParams);
    
    // Try cache first
    const cached = await cacheGet("products", cacheKey, optimizedParams);
    if (cached) {
      monitorPayloadSize("/api/products", cached);
      return NextResponse.json(cached);
    }

    // Fetch products with batching and deduplication
    const response = await requestBatcher.batch(
      `products:${cacheKey}`,
      () => wcAPI.get("/products", { params: optimizedParams })
    );
    const data = {
      products: response.data || [],
      total: parseInt(response.headers["x-wp-total"] || "0"),
      totalPages: parseInt(response.headers["x-wp-totalpages"] || "1"),
    };
    
    // Sanitize product data
    const sanitizedProducts = Array.isArray(data.products)
      ? data.products.map((product: any) => sanitizeProduct(product))
      : [];
    
    const sanitizedData = {
      products: sanitizedProducts,
      total: data.total,
      totalPages: data.totalPages,
    };
    
    // Cache the response
    await cacheSet("products", cacheKey, sanitizedData, optimizedParams, ["products"]);
    
    // Monitor payload size
    monitorPayloadSize("/api/products", sanitizedData);
    
    // Log response for debugging
    const productCount = sanitizedProducts.length;
    console.log(`API Products - Found ${productCount} products (total: ${sanitizedData.total})`);

    // Set headers
    const headers = new Headers();
    headers.set("Content-Type", "application/json");

    return NextResponse.json(sanitizedData, { headers });
  } catch (error: any) {
    console.error("Products API error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to fetch products",
        products: [],
        total: 0,
        totalPages: 0,
      },
      { status: error.response?.status || 500 }
    );
  }
}

// Export with security middleware
export const GET = createPublicApiHandler(getProducts, {
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
  },
  timeout: API_TIMEOUT.PRODUCTS, // 20 seconds
  sanitize: true,
  allowedMethods: ['GET'],
});
