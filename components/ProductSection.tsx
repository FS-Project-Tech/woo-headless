import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { fetchCategoryBySlug, fetchProducts } from "@/lib/woocommerce";
import ProductSectionWrapper from "@/components/ProductSectionWrapper";

interface ProductSectionProps {
  title: string;
  subtitle?: string;
  viewAllHref: string;
  bgClassName?: string; // e.g., 'bg-rose-50'
  query?: {
    categorySlug?: string;
    orderby?: string;
    order?: string;
    featured?: boolean;
  };
}

export default async function ProductSection(props: ProductSectionProps) {
  const { title, subtitle, viewAllHref, bgClassName, query } = props;

  // Resolve category by slug if provided
  let categoryId: string | undefined;
  if (query?.categorySlug) {
    const cat = await fetchCategoryBySlug(query.categorySlug).catch(() => null);
    if (cat) categoryId = String(cat.id);
  }

  const products = await (async () => {
    try {
      const fetchedProducts = await fetchProducts({
        per_page: 10,
        category: categoryId,
        orderby: query?.orderby,
        order: query?.order,
        featured: query?.featured,
      });
      
      return fetchedProducts;
    } catch (error) {
      // Don't log here - errors are already logged by the interceptor
      // Only log in development if it's a non-response error
      if (process.env.NODE_ENV === 'development' && !(error as any)?.response) {
        console.error(`[ProductSection: ${title}] Network error:`, error);
      }
      return [] as Awaited<ReturnType<typeof fetchProducts>>;
    }
  })();

  return (
    <ProductSectionWrapper title={title} subtitle={subtitle} viewAllHref={viewAllHref} products={products} />
  );
}


