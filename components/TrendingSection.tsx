import { fetchProducts } from "@/lib/woocommerce";
import TrendingSectionClient from "./TrendingSectionClient";

export default async function TrendingSection() {
  let products = [] as Awaited<ReturnType<typeof fetchProducts>>;
  try {
    products = await fetchProducts({ per_page: 12, orderby: "popularity" as any });
  } catch {}
  
  return <TrendingSectionClient products={products} />;
}


