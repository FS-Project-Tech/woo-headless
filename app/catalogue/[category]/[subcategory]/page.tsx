import { fetchCategoryBySlug } from "@/lib/woocommerce";
import wcAPI from "@/lib/woocommerce";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductBook from "@/components/ProductBook";

async function getProductsForCategory(categorySlug: string) {
  const category = await fetchCategoryBySlug(categorySlug).catch(() => null);
  if (!category) return [];

  let allProducts: any[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const productsRes = await wcAPI.get("/products", {
      params: {
        category: category.id,
        per_page: 100,
        page: page,
        status: "publish",
        _fields: [
          "id",
          "name",
          "slug",
          "price",
          "regular_price",
          "sale_price",
          "on_sale",
          "attributes",
          "sku",
        ].join(","),
      },
    });

    const products = productsRes.data || [];
    allProducts = [...allProducts, ...products];
    hasMore = products.length === 100;
    page++;
  }

  return allProducts.map((product: any) => {
    const variations = (product.attributes || [])
      .filter((attr: any) => attr.variation === true && Array.isArray(attr.options))
      .map((attr: any) => ({
        name: attr.name || "",
        options: attr.options || [],
      }));

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      regular_price: product.regular_price,
      sale_price: product.sale_price,
      on_sale: product.on_sale,
      sku: product.sku || "",
      variations: variations,
    };
  });
}

export default async function SubcategoryPage({
  params,
}: {
  params: Promise<{ category: string; subcategory: string }>;
}) {
  const { category, subcategory } = await params;
  const subcategoryData = await fetchCategoryBySlug(subcategory).catch(
    () => null
  );

  if (!subcategoryData) {
    notFound();
  }

  const products = await getProductsForCategory(subcategory);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <Link href="/catalogue" className="hover:text-teal-600">
            Catalogue
          </Link>
          <span>/</span>
          <Link
            href={`/catalogue/${category}`}
            className="hover:text-teal-600"
          >
            {category}
          </Link>
          <span>/</span>
          <span className="text-teal-600">{subcategoryData.name}</span>
        </div>
        <h1 className="text-4xl font-bold text-teal-900 mb-2">
          {subcategoryData.name}
        </h1>
        {subcategoryData.description && (
          <div
            className="text-gray-600 mb-4 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{
              __html: subcategoryData.description,
            }}
          />
        )}
        <p className="text-gray-600">
          {products.length} product{products.length !== 1 ? "s" : ""}
        </p>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-gray-500">No products available in this category.</p>
        </div>
      ) : (
        <ProductBook products={products} categoryName={subcategoryData.name} />
      )}
    </div>
  );
}
