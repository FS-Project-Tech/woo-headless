import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import ProductsSlider from "@/components/ProductsSlider";
import { fetchCategoryBySlug, fetchProducts } from "@/lib/woocommerce";

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
    on_sale?: boolean;
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
      return await fetchProducts({
        per_page: 10,
        category: categoryId,
        orderby: query?.orderby,
        order: query?.order,
        featured: query?.featured,
        on_sale: query?.on_sale,
      });
    } catch {
      return [] as Awaited<ReturnType<typeof fetchProducts>>;
    }
  })();

  return (
    <section className="mb-16">
      <div className={`mx-auto w-[85vw] px-4 sm:px-6 lg:px-8 py-6`}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <Link href={viewAllHref} className="text-sm font-medium text-blue-600 hover:text-blue-700">
            View all
          </Link>
        </div>
        {subtitle && <p className="mb-6 text-sm text-gray-600">{subtitle}</p>}

        {(!products || products.length === 0) ? (
          <div className="rounded-lg bg-white p-8 text-center text-gray-600">No products found.</div>
        ) : (
          <ProductsSlider products={products} />
        )}
      </div>
    </section>
  );
}


