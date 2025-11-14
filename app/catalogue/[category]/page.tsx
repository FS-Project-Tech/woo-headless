import { fetchCategories } from "@/lib/woocommerce";
import { fetchCategoryBySlug } from "@/lib/woocommerce";
import Link from "next/link";
import { notFound } from "next/navigation";
import wcAPI from "@/lib/woocommerce";
import ProductBook from "@/components/ProductBook";

async function getProductsForCategory(categoryId: number) {
  let allProducts: any[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const productsRes = await wcAPI.get("/products", {
      params: {
        category: categoryId,
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

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const categoryData = await fetchCategoryBySlug(category).catch(() => null);

  if (!categoryData) {
    notFound();
  }

  // Fetch subcategories
  const subcategories = await fetchCategories({
    per_page: 100,
    parent: categoryData.id,
    hide_empty: true,
  }).catch(() => []);

  // If no subcategories, show products directly
  if (subcategories.length === 0) {
    const products = await getProductsForCategory(categoryData.id);

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            href="/catalogue"
            className="text-teal-600 hover:text-teal-700 mb-4 inline-flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Catalogue
          </Link>
        <h1 className="text-4xl font-bold text-teal-900 mb-2">
          {categoryData.name}
        </h1>
        {categoryData.description && (
          <div
            className="text-gray-600 mb-4 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{
              __html: categoryData.description,
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
          <ProductBook products={products} categoryName={categoryData.name} />
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          href="/catalogue"
          className="text-teal-600 hover:text-teal-700 mb-4 inline-flex items-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Catalogue
        </Link>
        <h1 className="text-4xl font-bold text-teal-900 mb-2">
          {categoryData.name}
        </h1>
        <p className="text-gray-600">
          {subcategories.length} subcategor{subcategories.length !== 1 ? "ies" : "y"}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {subcategories.map((subcategory) => (
          <Link
            key={subcategory.id}
            href={`/catalogue/${category}/${subcategory.slug}`}
            className="group bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-teal-100 hover:border-teal-400"
          >
            <div className="p-6">
              <div className="w-16 h-16 bg-teal-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-teal-500 transition-colors">
                <svg
                  className="w-8 h-8 text-teal-600 group-hover:text-white transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-teal-900 group-hover:text-teal-700 transition-colors mb-2">
                {subcategory.name}
              </h3>
              {subcategory.description && (
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {subcategory.description.replace(/<[^>]*>/g, "")}
                </p>
              )}
              <p className="text-sm text-gray-500">
                {subcategory.count} product{subcategory.count !== 1 ? "s" : ""}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
