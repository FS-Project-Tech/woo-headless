import { fetchProducts } from "@/lib/woocommerce";
import MiniProductsSlider from "@/components/MiniProductsSlider";

export default async function TrendingSection() {
  let products = [] as Awaited<ReturnType<typeof fetchProducts>>;
  try {
    products = await fetchProducts({ per_page: 12, orderby: "popularity" as any });
  } catch {}
  if (!products || products.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="mx-auto w-[85vw] px-4 sm:px-6 lg:px-8">
        <div className="rounded-xl bg-indigo-50 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Trending now</h2>
              <p className="text-sm text-gray-600">Popular with shoppers this week</p>
            </div>
          </div>
          <MiniProductsSlider products={products as any} />
        </div>
      </div>
    </section>
  );
}


