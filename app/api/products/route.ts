import { NextResponse } from "next/server";
import wcAPI from "@/lib/woocommerce";
import { fetchCategoryBySlug } from "@/lib/woocommerce";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categorySlug = searchParams.get('categorySlug');
    const categories = searchParams.get('categories');
    const brands = searchParams.get('brands');
    const search = searchParams.get('search');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const minRating = searchParams.get('minRating');
    const availability = searchParams.get('availability');
    const sortBy = searchParams.get('sortBy') || 'relevance';
    const per_page = parseInt(searchParams.get('per_page') || '18', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    
    // Handle multiple categories
    let categoryIds: string[] = [];
    if (categories) {
      // Parse comma-separated category slugs
      const categorySlugs = categories.split(',').filter(Boolean);
      for (const slug of categorySlugs) {
        const category = await fetchCategoryBySlug(slug).catch(() => null);
        if (category) {
          categoryIds.push(String(category.id));
        }
      }
    } else if (categorySlug) {
      // Fallback to single categorySlug for backward compatibility
      const category = await fetchCategoryBySlug(categorySlug).catch(() => null);
      if (category) {
        categoryIds.push(String(category.id));
      }
    }
    
    // Build WooCommerce API params
    const wcParams: any = {
      page: 1,
      status: 'publish',
    };
    
    // WooCommerce API only supports single category filter
    // We'll fetch products for all categories and filter client-side if multiple
    if (categoryIds.length > 0) {
      if (categoryIds.length === 1) {
        wcParams.category = categoryIds[0];
      }
      // For multiple categories, we'll fetch more products and filter below
    }
    if (search) wcParams.search = search;
    
    // Get products - simplified approach for better reliability
    let allProducts: any[] = [];
    const hasFilters = !!(categoryIds.length > 0 || brands || minPrice || maxPrice || minRating || availability);
    
    // If we have filters, fetch more products to filter from
    // If no filters, just fetch enough for pagination
    const productsNeeded = hasFilters ? Math.min(500, per_page * 10) : per_page * 3;
    
    try {
      // Fetch first page
      const firstPageResponse = await wcAPI.get('/products', { 
        params: { ...wcParams, page: 1, per_page: Math.min(productsNeeded, 100) } 
      });
      
      const firstPageProducts = firstPageResponse.data || [];
      allProducts = [...firstPageProducts];
      
      // If we need more products and got a full page, fetch additional pages
      if (hasFilters && firstPageProducts.length === 100 && productsNeeded > 100) {
        let currentPage = 2;
        const maxAdditionalPages = Math.min(Math.ceil(productsNeeded / 100), 5);
        
        while (currentPage <= maxAdditionalPages && allProducts.length < productsNeeded) {
          try {
            const response = await wcAPI.get('/products', { 
              params: { ...wcParams, page: currentPage, per_page: 100 } 
            });
            const pageProducts = response.data || [];
            if (!pageProducts || pageProducts.length === 0) break;
            allProducts = [...allProducts, ...pageProducts];
            if (pageProducts.length < 100) break; // Last page
            currentPage++;
          } catch (pageErr) {
            console.error(`Error fetching page ${currentPage}:`, pageErr);
            break; // Stop on error
          }
        }
      }
    } catch (err: any) {
      console.error('Error fetching products from WooCommerce:', err);
      // Return empty array on error
      return NextResponse.json({ 
        products: [], 
        totalPages: 1, 
        page: 1, 
        total: 0,
        error: err?.message || 'Failed to fetch products'
      }, { status: 200 });
    }
    
    let products = allProducts;
    
    // Filter by multiple categories if specified
    if (categoryIds.length > 1) {
      products = products.filter((product: any) => {
        const productCategoryIds = (product.categories || []).map((c: any) => String(c.id));
        return categoryIds.some((catId) => productCategoryIds.includes(catId));
      });
    }
    
    // Filter by brands - improved matching
    if (brands) {
      const brandSlugs = brands.split(',').map(b => b.toLowerCase().trim());
      products = products.filter((product: any) => {
        const atts: Array<{ name: string; options: string[]; slug?: string }> = product.attributes || [];
        for (const att of atts) {
          const key = (att.slug || att.name || '').toLowerCase();
          if (key.includes('brand') && Array.isArray(att.options)) {
            const productBrands = att.options.map((o: string) => {
              const brandStr = String(o).toLowerCase().trim();
              // Also create slug version for matching
              const brandSlug = brandStr.replace(/\s+/g, '-');
              return { original: brandStr, slug: brandSlug };
            });
            
            // Match by both name and slug
            return brandSlugs.some(brandSlug => {
              return productBrands.some(pb => {
                return pb.original === brandSlug || 
                       pb.slug === brandSlug ||
                       pb.original.includes(brandSlug) || 
                       brandSlug.includes(pb.original) ||
                       pb.slug.includes(brandSlug) ||
                       brandSlug.includes(pb.slug);
              });
            });
          }
        }
        return false;
      });
    }
    
    // Filter by price range
    if (minPrice || maxPrice) {
      const min = minPrice ? parseFloat(minPrice) : 0;
      const max = maxPrice ? parseFloat(maxPrice) : Infinity;
      products = products.filter((product: any) => {
        const price = parseFloat(product.price) || 0;
        return price >= min && price <= max;
      });
    }
    
    // Filter by rating
    if (minRating) {
      const minRatingNum = parseFloat(minRating);
      products = products.filter((product: any) => {
        const rating = parseFloat(product.average_rating) || 0;
        return rating >= minRatingNum;
      });
    }
    
    // Filter by availability
    if (availability) {
      if (availability === 'in_stock') {
        products = products.filter((product: any) => {
          return product.stock_status === 'instock' || product.stock_status === 'onbackorder';
        });
      } else if (availability === 'out_of_stock') {
        products = products.filter((product: any) => {
          return product.stock_status === 'outofstock';
        });
      }
    }
    
    // Filter by attributes (size, color, etc.)
    searchParams.forEach((value, key) => {
      if (key.startsWith('attr_')) {
        const attrKey = key.replace('attr_', '');
        const attrValues = value.split(',').map(v => v.toLowerCase().trim());
        products = products.filter((product: any) => {
          const atts: Array<{ name: string; options: string[]; slug?: string }> = product.attributes || [];
          for (const att of atts) {
            const attSlug = (att.slug || '').replace(/^pa_/, '').toLowerCase();
            const attName = (att.name || '').toLowerCase();
            if ((attSlug === attrKey || attName.includes(attrKey)) && Array.isArray(att.options)) {
              const productAttrs = att.options.map((o: string) => String(o).toLowerCase().trim());
              return attrValues.some(attrValue => productAttrs.some(pa => pa.includes(attrValue) || attrValue.includes(pa)));
            }
          }
          return false;
        });
      }
    });
    
    // Sort products
    if (sortBy === 'price_low') {
      products.sort((a: any, b: any) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
    } else if (sortBy === 'price_high') {
      products.sort((a: any, b: any) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
    } else if (sortBy === 'newest') {
      products.sort((a: any, b: any) => new Date(b.date_created || 0).getTime() - new Date(a.date_created || 0).getTime());
    } else if (sortBy === 'rating') {
      products.sort((a: any, b: any) => (parseFloat(b.average_rating) || 0) - (parseFloat(a.average_rating) || 0));
    } else if (sortBy === 'popularity') {
      // Sort by total sales
      products.sort((a: any, b: any) => (b.total_sales || 0) - (a.total_sales || 0));
    }
    // 'relevance' keeps original order (already sorted by WooCommerce relevance if search is used)
    
    // Apply pagination
    const startIndex = (page - 1) * per_page;
    const endIndex = startIndex + per_page;
    const paginatedProducts = products.slice(startIndex, endIndex);
    const totalPages = Math.ceil(products.length / per_page);
    
    return NextResponse.json({
      products: paginatedProducts,
      totalPages,
      page,
      total: products.length,
    });
  } catch (error: any) {
    console.error('Error in products API:', error);
    // Return empty array instead of error to prevent UI crashes
    return NextResponse.json({ 
      products: [], 
      totalPages: 1, 
      page: 1, 
      total: 0,
      error: error?.message || 'Unknown error'
    }, { status: 200 });
  }
}

