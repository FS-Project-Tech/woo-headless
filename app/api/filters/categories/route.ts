import { NextResponse } from "next/server";
import wcAPI from "@/lib/woocommerce";
import { fetchCategoryBySlug } from "@/lib/woocommerce";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categorySlug = searchParams.get("category");

    let categories: any[] = [];

    if (categorySlug) {
      // Get subcategories of the selected category
      const category = await fetchCategoryBySlug(categorySlug).catch(() => null);
      if (category) {
        const res = await wcAPI.get("/products/categories", {
          params: {
            parent: category.id,
            per_page: 100,
            hide_empty: true,
          },
        });
        categories = (res.data || []).map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          count: cat.count || 0,
        }));
      }
    } else {
      // Get top-level categories
      const res = await wcAPI.get("/products/categories", {
        params: {
          parent: 0,
          per_page: 100,
          hide_empty: true,
        },
      });
      categories = (res.data || []).map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        count: cat.count || 0,
      }));
    }

    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ categories: [] }, { status: 200 });
  }
}

