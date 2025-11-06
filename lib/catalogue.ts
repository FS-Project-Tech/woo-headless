import wcAPI from "@/lib/woocommerce";
import { fetchCategories } from "@/lib/woocommerce";

function getWpBase(): string | null {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_WC_API_URL || "";
    const u = new URL(apiUrl);
    return `${u.protocol}//${u.host}`;
  } catch {
    return null;
  }
}

export interface CatalogueProduct {
  id: number;
  name: string;
  slug: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  short_description: string;
  attributes: any[];
  sku: string;
  variations: Array<{
    name: string;
    options: string[];
  }>;
}

export interface CatalogueSection {
  name: string;
  products: CatalogueProduct[];
}

export interface CatalogueChapter {
  id: number;
  name: string;
  slug: string;
  sections: CatalogueSection[];
}

export async function fetchCatalogueData(): Promise<CatalogueChapter[]> {
  const wpBase = getWpBase();
  if (!wpBase) {
    return [];
  }

  // Fetch categories (chapters)
  const categories = await fetchCategories({
    per_page: 100,
    parent: 0,
    hide_empty: true,
  });

  // For each category, fetch all products directly (no brand grouping)
  const catalogueData = await Promise.all(
    categories.map(async (category) => {
      // Fetch products in this category - get all pages
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
              "short_description",
              "attributes",
              "categories",
              "sku",
              "variations",
              "type",
            ].join(","),
          },
        });

        const products = productsRes.data || [];
        allProducts = [...allProducts, ...products];

        // Check if there are more pages - if we got less than per_page, we're done
        hasMore = products.length === 100;
        page++;
      }

      // Process all products for this category
      const catalogueProducts: CatalogueProduct[] = allProducts.map((product: any) => {
        // Extract variation information from attributes
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
          short_description: product.short_description || "",
          attributes: product.attributes || [],
          sku: product.sku || "",
          variations: variations,
        };
      });

      // Create a single section with all products for this category
      return {
        id: category.id,
        name: category.name,
        slug: category.slug,
        sections: [
          {
            name: category.name,
            products: catalogueProducts,
          },
        ],
      };
    })
  );

  return catalogueData;
}
