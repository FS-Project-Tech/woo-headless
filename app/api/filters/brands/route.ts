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

    let allBrands: any[] = [];

    // Try WooCommerce Brands plugin first
    try {
      const brandsRes = await wcAPI.get("/products/brands", {
        params: { per_page: 100, hide_empty: true },
      });
      if (Array.isArray(brandsRes.data)) {
        allBrands = brandsRes.data;
      }
    } catch {}

    // Fallback to attribute-based brands
    if (!allBrands.length) {
      try {
        const attrsRes = await wcAPI.get("/products/attributes");
        const attrs: Array<{ id: number; name: string; slug: string }> =
          attrsRes.data || [];
        const brandAttr = attrs.find(
          (a) => a.slug === "pa_brand" || a.slug === "brand"
        );
        if (brandAttr) {
          const terms = await wcAPI.get(
            `/products/attributes/${brandAttr.id}/terms`,
            {
              params: { per_page: 100, hide_empty: true },
            }
          );
          allBrands = terms.data || [];
        }
      } catch {}
    }

    // Fallback to WP core taxonomy
    if (!allBrands.length) {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_WC_API_URL || "";
        const u = new URL(apiUrl);
        const wpBase = `${u.protocol}//${u.host}/wp-json/wp/v2`;
        const res = await fetch(
          `${wpBase}/product_brand?per_page=100&_fields=id,name,slug,count`
        );
        if (res.ok) {
          const terms = await res.json();
          if (Array.isArray(terms)) {
            allBrands = terms;
          }
        }
      } catch {}
    }

    // If category specified, filter brands to those available in that category
    if (categoryId && allBrands.length > 0) {
      try {
        const sampleProdsRes = await wcAPI.get("/products", {
          params: { per_page: 100, category: categoryId, page: 1 },
        });
        const sampleProds = sampleProdsRes.data || [];

        const brandValuesInProducts = new Set<string>();
        for (const p of sampleProds) {
          const atts: Array<{ name: string; options: string[]; slug?: string }> =
            p.attributes || [];
          for (const a of atts) {
            const key = (a.slug || a.name || "").toLowerCase();
            if (key.includes("brand")) {
              const opts = Array.isArray(a.options) ? a.options : [];
              opts.forEach((o) =>
                brandValuesInProducts.add(String(o).toLowerCase().trim())
              );
            }
          }
        }

        if (brandValuesInProducts.size > 0) {
          allBrands = allBrands.filter((t: any) => {
            const termName = String(t.name || "").toLowerCase().trim();
            const termSlug = String(t.slug || "").toLowerCase().trim();
            return Array.from(brandValuesInProducts).some((b) => {
              return (
                termName === b ||
                termSlug === b ||
                termName.includes(b) ||
                b.includes(termName) ||
                termSlug.includes(b) ||
                b.includes(termSlug)
              );
            });
          });
        }
      } catch {}
    }

    const brands = allBrands.map((brand: any) => ({
      id: brand.id,
      name: brand.name,
      slug: brand.slug || brand.name?.toLowerCase().replace(/\s+/g, "-"),
      count: brand.count || 0,
    }));

    return NextResponse.json({ brands });
  } catch (error: any) {
    console.error("Error fetching brands:", error);
    return NextResponse.json({ brands: [] }, { status: 200 });
  }
}

