import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { fetchCategoryBySlug } from "@/lib/woocommerce";
import { createPublicApiHandler, API_TIMEOUT } from "@/lib/api-middleware";
import { sanitizeObject } from "@/lib/sanitize";

async function getCategoryBySlug(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    
    if (!slug) {
      return NextResponse.json({ category: null });
    }
    
    // Use unstable_cache for server-side caching (10 minutes)
    const getCachedCategory = unstable_cache(
      async () => {
        return await fetchCategoryBySlug(slug).catch(() => null);
      },
      [`category-${slug}`],
      {
        revalidate: 600, // 10 minutes
        tags: ['categories'], // Cache tag for revalidation
      }
    );
    
    const category = await getCachedCategory();
    
    // Sanitize category data
    const sanitizedCategory = category ? sanitizeObject(category) : null;
    
    // Set cache headers
    const headers = new Headers();
    headers.set("Cache-Control", "public, s-maxage=600, stale-while-revalidate=1200");
    headers.set("Content-Type", "application/json");
    
    return NextResponse.json({ category: sanitizedCategory }, { headers });
  } catch (error) {
    return NextResponse.json({ category: null }, { status: 200 });
  }
}

// Export with security middleware
export const GET = createPublicApiHandler(getCategoryBySlug, {
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
  },
  timeout: API_TIMEOUT.CATEGORIES, // 15 seconds
  sanitize: true,
  allowedMethods: ['GET'],
});

