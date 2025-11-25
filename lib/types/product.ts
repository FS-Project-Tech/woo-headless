/**
 * Unified product type for ProductCard and related components
 * This type is used across ProductsSlider, RecommendedSection, RecentlyViewedSection, etc.
 */
export interface ProductCardProduct {
  id: number;
  slug: string;
  name: string;
  sku?: string | null;
  price: string;
  regular_price?: string;
  sale_price?: string;
  on_sale?: boolean;
  tax_class?: string;
  tax_status?: string;
  average_rating?: string;
  rating_count?: number;
  images?: Array<{ src: string; alt?: string }>;
}

/**
 * Alias for backward compatibility
 */
export type UnifiedProduct = ProductCardProduct;
export type Product = ProductCardProduct;

