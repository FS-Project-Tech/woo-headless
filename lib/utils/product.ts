import type { WooCommerceProduct, WooCommerceVariation } from "@/lib/woocommerce";

export interface ProductBrandInfo {
  id?: number;
  name: string;
  slug?: string;
  image?: string;
}

/**
 * Match a variation based on selected attributes
 */
export function matchVariation(
  variations: WooCommerceVariation[],
  selected: { [name: string]: string }
): WooCommerceVariation | null {
  const names = Object.keys(selected);
  if (names.length === 0) return null;
  return (
    variations.find((v) =>
      names.every((n) =>
        v.attributes.some((a) => eq(a.name, n) && eq(a.option, selected[n]))
      )
    ) || null
  );
}

/**
 * Find brand from product_brand taxonomy or attributes
 * WooCommerce REST API may include brands in the product response similar to categories
 */
export function findBrand(product: WooCommerceProduct): string | null {
  // First, check if product has brands taxonomy field (similar to categories structure)
  // The WooCommerce REST API may return brands when the product_brand taxonomy is registered
  const productAny = product as any;
  if (productAny.brands && Array.isArray(productAny.brands) && productAny.brands.length > 0) {
    // Brands might be objects with {id, name, slug} or just strings
    const firstBrand = productAny.brands[0];
    if (typeof firstBrand === 'string') {
      return firstBrand;
    } else if (firstBrand?.name) {
      return firstBrand.name;
    }
  }

  // Check meta_data for product_brand taxonomy data
  if (product.meta_data && Array.isArray(product.meta_data)) {
    const brandMeta = product.meta_data.find((meta: any) => {
      const key = String(meta.key || '').toLowerCase();
      // Check for product_brand taxonomy or brand-related meta keys
      return key === 'product_brand' || 
             key === '_product_brand' || 
             key.includes('brand') && !key.includes('image');
    });
    if (brandMeta?.value) {
      // Value might be an ID, name, array, or object
      if (typeof brandMeta.value === 'string') {
        return brandMeta.value;
      } else if (typeof brandMeta.value === 'number') {
        // If it's an ID, we'd need to fetch the brand name, but for now return null
        // In production, you might want to fetch the brand name from the taxonomy
        return null;
      } else if (Array.isArray(brandMeta.value) && brandMeta.value.length > 0) {
        const first = brandMeta.value[0];
        return typeof first === 'string' ? first : first?.name || null;
      } else if (typeof brandMeta.value === 'object' && brandMeta.value?.name) {
        return brandMeta.value.name;
      }
    }
  }

  // Fallback: check attributes (for backward compatibility with attribute-based brands)
  const attr = (product.attributes || []).find(
    (a: any) =>
      eq(a.name, "brand") || eq(a.name, "pa_brand") || eq(a.name, "Brand")
  );
  if (attr) {
    const opts = (attr.options as string[]) || [];
    if (opts.length > 0) return opts[0];
  }

  return null;
}

/**
 * Extract all brand entries from a product.
 */
export function extractProductBrands(product: WooCommerceProduct): ProductBrandInfo[] {
  const brands: ProductBrandInfo[] = [];
  const seen = new Set<string>();
  const addBrand = (brand: ProductBrandInfo | null | undefined) => {
    if (!brand || !brand.name) return;
    const key = `${brand.id ?? ""}:${brand.slug ?? ""}:${brand.name.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    brands.push(brand);
  };

  const productAny = product as any;
  if (Array.isArray(productAny.brands)) {
    productAny.brands.forEach((brand: any) => {
      if (!brand) return;
      if (typeof brand === "string") {
        addBrand({ name: brand });
        return;
      }
      addBrand({
        id: typeof brand.id === "number" ? brand.id : undefined,
        name: brand.name || brand.slug || "",
        slug: brand.slug,
        image: brand.image?.src || brand.image || undefined,
      });
    });
  }

  if (Array.isArray(product.meta_data)) {
    product.meta_data.forEach((meta: any) => {
      const key = String(meta?.key || "").toLowerCase();
      if (!key.includes("brand") || key.includes("image")) return;
      const value = meta.value;
      if (!value) return;
      if (typeof value === "string") {
        addBrand({ name: value });
      } else if (Array.isArray(value)) {
        value.forEach((item) => {
          if (typeof item === "string") {
            addBrand({ name: item });
          } else if (item?.name) {
            addBrand({
              id: typeof item.id === "number" ? item.id : undefined,
              name: item.name,
              slug: item.slug,
            });
          }
        });
      } else if (typeof value === "object" && value.name) {
        addBrand({
          id: typeof value.id === "number" ? value.id : undefined,
          name: value.name,
          slug: value.slug,
        });
      }
    });
  }

  // Fallback to attribute-based brands
  (product.attributes || []).forEach((attr: any) => {
    if (eq(attr.name, "brand") || eq(attr.name, "pa_brand") || eq(attr.name, "Brand")) {
      const opts = (attr.options as string[]) || [];
      opts.forEach((opt) => addBrand({ name: opt }));
    }
  });

  // If we still have no brands, use the first brand name
  if (brands.length === 0) {
    const single = findBrand(product);
    if (single) {
      addBrand({ name: single });
    }
  }

  return brands;
}

/**
 * Case-insensitive string equality
 */
export function eq(a?: string, b?: string): boolean {
  return (a || "").toLowerCase() === (b || "").toLowerCase();
}

/**
 * Check if all required attributes are selected
 */
export function isAllSelected(
  selected: { [name: string]: string },
  attrs: { name: string; options: string[] }[]
): boolean {
  if (!attrs || attrs.length === 0) return true;
  return attrs.every((a) => !!selected[a.name]);
}

