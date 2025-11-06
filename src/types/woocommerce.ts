// WooCommerce API Types
export interface WooCommerceProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  date_created: string;
  date_modified: string;
  type: string;
  status: string;
  featured: boolean;
  catalog_visibility: string;
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  date_on_sale_from: string | null;
  date_on_sale_to: string | null;
  price_html: string;
  on_sale: boolean;
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
  categories: WooCommerceCategory[];
  tags: WooCommerceTag[];
  images: WooCommerceImage[];
  attributes: WooCommerceAttribute[];
  default_attributes: any[];
  variations: number[];
  grouped_products: number[];
  menu_order: number;
  meta_data: WooCommerceMetaData[];
}

export interface WooCommerceCategory {
  id: number;
  name: string;
  slug: string;
  parent: number;
  description: string;
  display: string;
  image: WooCommerceImage | null;
  menu_order: number;
  count: number;
}

export interface WooCommerceTag {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
}

export interface WooCommerceImage {
  id: number;
  date_created: string;
  date_modified: string;
  src: string;
  name: string;
  alt: string;
}

export interface WooCommerceAttribute {
  id: number;
  name: string;
  position: number;
  visible: boolean;
  variation: boolean;
  options: string[];
}

export interface WooCommerceMetaData {
  id: number;
  key: string;
  value: string;
}

export interface WooCommerceCustomer {
  id: number;
  date_created: string;
  date_modified: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  username: string;
  billing: WooCommerceAddress;
  shipping: WooCommerceAddress;
  is_paying_customer: boolean;
  avatar_url: string;
  meta_data: WooCommerceMetaData[];
}

export interface WooCommerceAddress {
  first_name: string;
  last_name: string;
  company: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  email: string;
  phone: string;
}

export interface WooCommerceOrder {
  id: number;
  parent_id: number;
  status: string;
  currency: string;
  date_created: string;
  date_modified: string;
  discount_total: string;
  discount_tax: string;
  shipping_total: string;
  shipping_tax: string;
  cart_tax: string;
  total: string;
  total_tax: string;
  customer_id: number;
  order_key: string;
  billing: WooCommerceAddress;
  shipping: WooCommerceAddress;
  payment_method: string;
  payment_method_title: string;
  transaction_id: string;
  customer_ip_address: string;
  customer_user_agent: string;
  created_via: string;
  customer_note: string;
  date_completed: string | null;
  date_paid: string | null;
  cart_hash: string;
  number: string;
  meta_data: WooCommerceMetaData[];
  line_items: WooCommerceLineItem[];
  tax_lines: any[];
  shipping_lines: any[];
  fee_lines: any[];
  coupon_lines: any[];
  refunds: any[];
  payment_url: string;
  is_editable: boolean;
  needs_payment: boolean;
  needs_processing: boolean;
  date_created_gmt: string;
  date_modified_gmt: string;
  date_completed_gmt: string | null;
  date_paid_gmt: string | null;
  currency_symbol: string;
}

export interface WooCommerceLineItem {
  id: number;
  name: string;
  product_id: number;
  variation_id: number;
  quantity: number;
  tax_class: string;
  subtotal: string;
  subtotal_tax: string;
  total: string;
  total_tax: string;
  taxes: any[];
  meta_data: WooCommerceMetaData[];
  sku: string;
  price: number;
  image: WooCommerceImage;
  parent_name: string | null;
}

// API Response Types
export interface WooCommerceApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: any;
  config: any;
}

export interface WooCommercePaginatedResponse<T> {
  data: T[];
  total: number;
  totalPages: number;
  currentPage: number;
  perPage: number;
}

// WordPress Menu Types
export interface WordPressMenu {
  ID: number;
  post_author: string;
  post_date: string;
  post_date_gmt: string;
  post_content: string;
  post_title: string;
  post_excerpt: string;
  post_status: string;
  comment_status: string;
  ping_status: string;
  post_password: string;
  post_name: string;
  to_ping: string;
  pinged: string;
  post_modified: string;
  post_modified_gmt: string;
  post_content_filtered: string;
  post_parent: number;
  guid: string;
  menu_order: number;
  post_type: string;
  post_mime_type: string;
  comment_count: string;
  filter: string;
  db_id: number;
  menu_item_parent: string;
  object_id: string;
  object: string;
  type: string;
  type_label: string;
  url: string;
  title: string;
  target: string;
  attr_title: string;
  description: string;
  classes: string[];
  xfn: string;
  current: boolean;
  current_item_ancestor: boolean;
  current_item_parent: boolean;
  classes_string: string;
}

// Search and Filter Types
export interface ProductFilters {
  category?: number;
  tag?: number;
  min_price?: number;
  max_price?: number;
  on_sale?: boolean;
  featured?: boolean;
  stock_status?: 'instock' | 'outofstock' | 'onbackorder';
  orderby?: 'date' | 'price' | 'popularity' | 'rating' | 'title';
  order?: 'asc' | 'desc';
  search?: string;
  page?: number;
  per_page?: number;
}

export interface SearchResult {
  products: WooCommerceProduct[];
  total: number;
  totalPages: number;
  currentPage: number;
}

// Product Variations
export interface WooCommerceProductVariation {
  id: number;
  date_created: string;
  date_modified: string;
  description: string;
  permalink: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  date_on_sale_from: string | null;
  date_on_sale_to: string | null;
  on_sale: boolean;
  status: string;
  purchasable: boolean;
  virtual: boolean;
  downloadable: boolean;
  downloads: any[];
  download_limit: number;
  download_expiry: number;
  tax_status: string;
  tax_class: string;
  manage_stock: boolean;
  stock_quantity: number | null;
  stock_status: string;
  backorders: string;
  backorders_allowed: boolean;
  backordered: boolean;
  weight: string;
  dimensions: {
    length: string;
    width: string;
    height: string;
  };
  shipping_class: string;
  shipping_class_id: number;
  image: WooCommerceImage | null;
  attributes: WooCommerceVariationAttribute[];
  menu_order: number;
  meta_data: WooCommerceMetaData[];
}

export interface WooCommerceVariationAttribute {
  id: number;
  name: string;
  option: string;
}

// Cart Types
export interface WooCommerceCartItem {
  key: string;
  id: number;
  quantity: number;
  name: string;
  title: string;
  price: number;
  line_price: number;
  line_subtotal: number;
  line_subtotal_tax: number;
  line_total: number;
  line_tax: number;
  variation: Record<string, string>;
  product_data: WooCommerceProduct;
  data_hash: string;
  data: any;
}

export interface WooCommerceCart {
  cart_hash: string;
  cart_key: string;
  currency: {
    currency_code: string;
    currency_symbol: string;
    currency_minor_unit: number;
    currency_decimal_separator: string;
    currency_thousand_separator: string;
    currency_prefix: string;
    currency_suffix: string;
  };
  customer: WooCommerceCustomer;
  items: WooCommerceCartItem[];
  needs_payment: boolean;
  needs_shipping: boolean;
  shipping_address: WooCommerceAddress;
  billing_address: WooCommerceAddress;
  totals: {
    subtotal: string;
    subtotal_tax: string;
    fee_total: string;
    fee_tax: string;
    discount_total: string;
    discount_tax: string;
    shipping_total: string;
    shipping_tax: string;
    total: string;
    total_tax: string;
  };
}
