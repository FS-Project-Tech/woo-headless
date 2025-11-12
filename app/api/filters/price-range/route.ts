import { NextResponse } from "next/server";
import wcAPI from "@/lib/woocommerce";
import { fetchCategoryBySlug } from "@/lib/woocommerce";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categorySlug = searchParams.get("category");

    let categoryId: string | undefined;
    if (categorySlug) {
      const category = await fetchCategoryBySlug(categorySlug).catch(() => null);
      if (category) {
        categoryId = String(category.id);
      }
    }

    // Fetch products to determine price range
    const wcParams: any = {
      per_page: 100,
      page: 1,
      status: "publish",
    };

    if (categoryId) {
      wcParams.category = categoryId;
    }

    let allPrices: number[] = [];
    let currentPage = 1;
    const maxPages = 5; // Sample up to 5 pages

    while (currentPage <= maxPages) {
      try {
        const res = await wcAPI.get("/products", {
          params: { ...wcParams, page: currentPage },
        });
        const products = res.data || [];
        if (products.length === 0) break;

        products.forEach((product: any) => {
          const price = parseFloat(product.price) || 0;
          if (price > 0) {
            allPrices.push(price);
          }
        });

        if (products.length < 100) break; // Last page
        currentPage++;
      } catch {
        break;
      }
    }

    let min = 0;
    let max = 1000;

    if (allPrices.length > 0) {
      min = Math.floor(Math.min(...allPrices));
      max = Math.ceil(Math.max(...allPrices));
      // Round to nearest 10 or 100 for better UX
      min = Math.floor(min / 10) * 10;
      max = Math.ceil(max / 100) * 100;
    }

    return NextResponse.json({ min, max });
  } catch (error: any) {
    console.error("Error fetching price range:", error);
    return NextResponse.json({ min: 0, max: 1000 }, { status: 200 });
  }
}

