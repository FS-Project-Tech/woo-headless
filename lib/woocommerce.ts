import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_WC_API_URL;
const CONSUMER_KEY = process.env.NEXT_PUBLIC_WC_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET;

if (!API_URL || !CONSUMER_KEY || !CONSUMER_SECRET) {
  console.warn('WooCommerce API credentials are not configured. Please set up your .env.local file.');
}

// WooCommerce API Client
const wcAPI = axios.create({
  baseURL: API_URL,
  auth: {
    username: CONSUMER_KEY || '',
    password: CONSUMER_SECRET || '',
  },
});

export interface WooCommerceProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  date_on_sale_from: string | null;
  date_on_sale_to: string | null;
  on_sale: boolean;
  status: string;
  featured: boolean;
  purchasable: boolean;
  total_sales: number;
  virtual: boolean;
  downloadable: boolean;
  downloads: any[];
  download_limit: number;
  download_expiry: number;
  external_url: string;
  button_text: string;
  tax_status: string;
  tax_class: string;
  manage_stock: boolean;
  stock_quantity: number | null;
  stock_status: string;
  backorders: string;
  backorders_allowed: boolean;
  backordered: boolean;
  sold_individually: boolean;
  weight: string;
  dimensions: {
    length: string;
    width: string;
    height: string;
  };
  shipping_required: boolean;
  shipping_taxable: boolean;
  shipping_class: string;
  shipping_class_id: number;
  reviews_allowed: boolean;
  average_rating: string;
  rating_count: number;
  related_ids: number[];
  upsell_ids: number[];
  cross_sell_ids: number[];
  parent_id: number;
  purchase_note: string;
  categories: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  tags: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  images: Array<{
    id: number;
    src: string;
    name: string;
    alt: string;
  }>;
  attributes: any[];
  default_attributes: any[];
  variations: number[];
  grouped_products: number[];
  menu_order: number;
  meta_data: any[];
}

export interface WooCommerceVariationAttribute {
  id?: number;
  name: string; // e.g., 'Color'
  option: string; // e.g., 'Red'
}

export interface WooCommerceVariation {
  id: number;
  sku: string | null;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  image?: { id: number; src: string; name: string; alt: string } | null;
  attributes: WooCommerceVariationAttribute[];
  stock_status: string;
}

// Fetch all products
export const fetchProducts = async (params?: {
  per_page?: number;
  page?: number;
  orderby?: string;
  order?: string;
  category?: string | number;
  search?: string;
  featured?: boolean;
  on_sale?: boolean;
}): Promise<WooCommerceProduct[]> => {
  try {
    // Clean up params - ensure category is a valid number or string
    const cleanParams: any = { ...params };
    
    // Remove empty or invalid category values
    if (cleanParams.category === '' || cleanParams.category === null || cleanParams.category === undefined) {
      delete cleanParams.category;
    }
    
    // Convert category to string if it's a number (WooCommerce API accepts both)
    if (cleanParams.category !== undefined) {
      cleanParams.category = String(cleanParams.category);
    }
    
    // Remove invalid orderby values that might cause 500 errors
    const validOrderBy = ['date', 'id', 'include', 'title', 'slug', 'price', 'popularity', 'rating'];
    if (cleanParams.orderby && !validOrderBy.includes(cleanParams.orderby)) {
      delete cleanParams.orderby;
    }
    
    const response = await wcAPI.get('/products', { params: cleanParams });
    return response.data || [];
  } catch (error: any) {
    console.error('Error fetching products:', error);
    // Log more details for debugging
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      console.error('Request params:', params);
    }
    // Return empty array instead of throwing to prevent page crashes
    return [];
  }
};

// Fetch a single product by ID
export const fetchProduct = async (id: number): Promise<WooCommerceProduct> => {
  try {
    const response = await wcAPI.get(`/products/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
};

// Fetch a single product by slug
export const fetchProductBySlug = async (slug: string): Promise<WooCommerceProduct | null> => {
  try {
    const response = await wcAPI.get('/products', { params: { slug } });
    const products: WooCommerceProduct[] = response.data;
    return products.length > 0 ? products[0] : null;
  } catch (error) {
    console.error('Error fetching product by slug:', error);
    throw error;
  }
};

// Fetch products by category
export const fetchProductsByCategory = async (categoryId: number): Promise<WooCommerceProduct[]> => {
  try {
    const response = await wcAPI.get('/products', {
      params: { category: categoryId },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching products by category:', error);
    throw error;
  }
};

// Fetch variations for a variable product
export const fetchProductVariations = async (
  productId: number,
  params?: { per_page?: number; page?: number }
): Promise<WooCommerceVariation[]> => {
  try {
    const response = await wcAPI.get(`/products/${productId}/variations`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching product variations:', error);
    throw error;
  }
};

export interface WooCommerceCategory {
  id: number;
  name: string;
  slug: string;
  parent: number;
  count: number;
  description?: string;
}

export const fetchCategories = async (params?: { per_page?: number; parent?: number; hide_empty?: boolean }): Promise<WooCommerceCategory[]> => {
  try {
    const response = await wcAPI.get('/products/categories', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

export const fetchCategoryBySlug = async (slug: string): Promise<WooCommerceCategory | null> => {
  try {
    const response = await wcAPI.get('/products/categories', { params: { slug } });
    const categories: WooCommerceCategory[] = response.data;
    return categories.length ? categories[0] : null;
  } catch (error) {
    console.error('Error fetching category by slug:', error);
    throw error;
  }
};

export default wcAPI;
