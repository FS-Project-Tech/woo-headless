import { fetchProducts } from "@/lib/woocommerce";
import TrendingSectionClient from "./TrendingSectionClient";

export default async function TrendingSection() {
  let products = [] as Awaited<ReturnType<typeof fetchProducts>>;
  try {
    // Fetch more products to ensure we have enough on-sale items
    const allProducts = await fetchProducts({ per_page: 50, orderby: "popularity" as any });
    // Filter to only show products that are on sale
    products = allProducts.filter((product) => product.on_sale === true);
  } catch {}
  
  return <TrendingSectionClient products={products} />;
}


