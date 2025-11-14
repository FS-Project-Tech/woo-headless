import { fetchCategories } from "@/lib/woocommerce";
import Link from "next/link";

export default async function CataloguePage() {
  const categories = await fetchCategories({
    per_page: 100,
    parent: 0,
    hide_empty: true,
  }).catch(() => []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-teal-900 mb-2">
          Product Catalogue
        </h1>
        <p className="text-gray-600">
          Browse our products by category
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No categories available.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/catalogue/${category.slug}`}
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
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-teal-900 group-hover:text-teal-700 transition-colors mb-2">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {category.description.replace(/<[^>]*>/g, "")}
                  </p>
                )}
                <p className="text-sm text-gray-500">
                  {category.count} product{category.count !== 1 ? "s" : ""}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
