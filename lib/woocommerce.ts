import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_WC_API_URL;
const CONSUMER_KEY = process.env.NEXT_PUBLIC_WC_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET;

if (!API_URL || !CONSUMER_KEY || !CONSUMER_SECRET) {
  console.warn('WooCommerce API credentials are not configured. Please set up your .env.local file.');
  console.warn('Required environment variables:');
  console.warn('- NEXT_PUBLIC_WC_API_URL');
  console.warn('- NEXT_PUBLIC_WC_CONSUMER_KEY');
  console.warn('- NEXT_PUBLIC_WC_CONSUMER_SECRET');
}

// WooCommerce API Client with timeout configuration
const WOOCOMMERCE_TIMEOUT = parseInt(process.env.WOOCOMMERCE_API_TIMEOUT || '20000', 10); // Default 20 seconds

const wcAPI = axios.create({
  baseURL: API_URL,
  auth: {
    username: CONSUMER_KEY || '',
    password: CONSUMER_SECRET || '',
  },
  timeout: WOOCOMMERCE_TIMEOUT, // Configurable timeout (default 20s)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Some hosts disable Basic Auth for the REST API. Ensure keys are also sent as query params.
// WooCommerce accepts consumer_key/consumer_secret in the query string.
wcAPI.defaults.params = {
  ...(wcAPI.defaults.params || {}),
  consumer_key: CONSUMER_KEY || '',
  consumer_secret: CONSUMER_SECRET || '',
};

// Add request interceptor for performance tracking (server-side only)
if (typeof window === 'undefined') {
  try {
    const { fetchMonitor } = require('./monitoring/fetch-instrumentation');
    
    wcAPI.interceptors.request.use(
      (config) => {
        // Store start time in config metadata
        (config as any).__startTime = Date.now();
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Performance tracking response interceptor (runs first)
    wcAPI.interceptors.response.use(
      (response) => {
        const config = response.config as any;
        if (config.__startTime) {
          const duration = Date.now() - config.__startTime;
          const url = `${wcAPI.defaults.baseURL}${config.url || ''}`;
          fetchMonitor.track(
            url,
            config.method?.toUpperCase() || 'GET',
            duration,
            response.status,
            config.__route,
            false,
            undefined
          );
        }
        return response;
      },
      (error) => {
        const config = error.config as any;
        if (config?.__startTime) {
          const duration = Date.now() - config.__startTime;
          const url = `${wcAPI.defaults.baseURL}${config.url || ''}`;
          fetchMonitor.track(
            url,
            config.method?.toUpperCase() || 'GET',
            duration,
            error.response?.status,
            config.__route,
            false,
            error.message || 'Unknown error'
          );
        }
        return Promise.reject(error); // Continue to error handler
      }
    );
  } catch (error) {
    // Silently fail if monitoring not available
    if (process.env.NODE_ENV === 'development') {
      console.warn('Performance monitoring not available:', error);
    }
  }
}

// Add response interceptor for better error handling (runs after performance tracking)
wcAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log API errors for debugging
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      const url = error.config?.url || 'Unknown URL';
      
      if (status === 401 || status === 403) {
        console.error('WooCommerce API Authentication Error:', {
          status,
          message: data?.message || 'Invalid API credentials',
          code: data?.code,
          url,
        });
      } else if (status === 500) {
        // Check if it's a known backend issue (Redis, etc.)
        const errorMessage = data?.message || error.message || '';
        const isKnownBackendIssue = 
          typeof errorMessage === 'string' && (
            errorMessage.includes('Redis') || 
            errorMessage.includes('object-cache') ||
            errorMessage.includes('wp_die')
          );
        
        if (isKnownBackendIssue) {
          // Only log in development - these are handled gracefully
          if (process.env.NODE_ENV === 'development') {
            console.warn('WooCommerce Backend Issue (handled gracefully):', {
              status,
              message: typeof errorMessage === 'string' ? errorMessage.substring(0, 150) : 'Backend configuration issue',
              url,
              code: data?.code,
            });
          }
          // Still reject the promise so fetchProducts can handle it
          return Promise.reject(error);
        }
        
        // Log full details for unknown 500 errors
        const errorDetails: Record<string, any> = {
          status: status || 'Unknown',
          statusText: error.response?.statusText || 'Internal Server Error',
          url: url,
          message: data?.message || error.message || 'Internal server error',
        };
        
        // Add code if available
        if (data?.code) {
          errorDetails.code = data.code;
        }
        
        // Add params if available
        if (error.config?.params && Object.keys(error.config.params).length > 0) {
          errorDetails.params = error.config.params;
        }
        
        // Handle response data - check if it's actually empty
        if (data !== undefined && data !== null) {
          if (typeof data === 'string' && data.trim().length > 0) {
            errorDetails.responseBody = data;
          } else if (typeof data === 'object') {
            const dataKeys = Object.keys(data);
            if (dataKeys.length > 0) {
              errorDetails.responseData = data;
            } else {
              // Empty object - don't add it, just note it
              errorDetails.note = 'Server returned empty object response';
            }
          } else if (data !== '') {
            errorDetails.responseData = String(data);
          }
        }
        
        // Always log - we guarantee at least status, statusText, url, and message
        console.error('WooCommerce API Server Error:', JSON.stringify(errorDetails, null, 2));
      } else {
        // Log other errors - always include basic fields
        const errorInfo: Record<string, any> = {
          status: status || 'Unknown',
          statusText: error.response?.statusText || 'Error',
          url: url,
          message: data?.message || error.message || `HTTP ${status} error`,
        };
        
        if (data?.code) {
          errorInfo.code = data.code;
        }
        
        // Handle response data
        if (data !== undefined && data !== null) {
          if (typeof data === 'string' && data.trim().length > 0) {
            errorInfo.responseBody = data;
          } else if (typeof data === 'object' && Object.keys(data).length > 0) {
            errorInfo.responseData = data;
          } else if (typeof data === 'object' && Object.keys(data).length === 0) {
            errorInfo.note = 'Server returned empty object response';
          }
        }
        
        // Always log with guaranteed fields
        console.error('WooCommerce API Error:', JSON.stringify(errorInfo, null, 2));
      }
    } else if (error.request) {
      // Request was made but no response received
      // Timeout errors are expected in some scenarios (slow API, network issues)
      // and are handled gracefully by components returning empty arrays/defaults
      // Don't log timeout errors to reduce console noise
      const isTimeoutError = error.code === 'ECONNABORTED' || 
                            error.code === 'ETIMEDOUT' ||
                            error.code === 'UND_ERR_CONNECT_TIMEOUT' ||
                            error.message?.toLowerCase().includes('timeout') ||
                            error.message?.toLowerCase().includes('exceeded') ||
                            error.message?.toLowerCase().includes('aborted') ||
                            error.message?.includes('Connect Timeout');
      
      // Only log non-timeout network errors in development mode
      if (process.env.NODE_ENV === 'development' && !isTimeoutError) {
        const errorInfo: Record<string, any> = {
          message: error.message || 'No response from server',
          url: error.config?.url || 'Unknown URL',
        };
        
        // Only add additional info if available
        if (error.code) {
          errorInfo.code = error.code;
        }
        if (error.config?.method) {
          errorInfo.method = error.config.method;
        }
        
        // Only log if we have meaningful information
        if (errorInfo.message && errorInfo.url) {
          console.warn('WooCommerce API Network Error (handled gracefully):', errorInfo);
        }
      }
      // Timeout errors are silently handled - components will show empty states
    } else {
      // Error setting up the request
      console.error('WooCommerce API Request Setup Error:', error.message || 'Unknown error');
    }
    return Promise.reject(error);
  }
);

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
}): Promise<WooCommerceProduct[]> => {
  try {
    // Clean up params - ensure category is a valid number or string
    const cleanParams: any = {};
    
    // Only include valid parameters
    if (params?.per_page !== undefined && params.per_page > 0) {
      cleanParams.per_page = params.per_page;
    }
    
    if (params?.page !== undefined && params.page > 0) {
      cleanParams.page = params.page;
    }
    
    // Validate and set orderby
    const validOrderBy = ['date', 'id', 'include', 'title', 'slug', 'price', 'popularity', 'rating'];
    if (params?.orderby && validOrderBy.includes(params.orderby)) {
      cleanParams.orderby = params.orderby;
    }
    
    // Validate and set order (asc or desc)
    if (params?.order && ['asc', 'desc'].includes(params.order.toLowerCase())) {
      cleanParams.order = params.order.toLowerCase();
    }
    
    // Handle category - remove if empty/invalid
    if (params?.category !== undefined && params.category !== '' && params.category !== null) {
      cleanParams.category = String(params.category);
    }
    
    // Handle search
    if (params?.search && params.search.trim()) {
      cleanParams.search = params.search.trim();
    }
    
    // Convert boolean to 1/0 for WooCommerce API (WooCommerce expects 1 or 0, not true/false)
    if (params?.featured !== undefined) {
      cleanParams.featured = params.featured ? 1 : 0;
    }
    
    const response = await wcAPI.get('/products', { params: cleanParams });
    return response.data || [];
  } catch (error: any) {
    // Don't duplicate error logging - the interceptor already handles response errors
    // Timeout errors are expected in some scenarios and handled gracefully
    // Suppress all timeout-related errors to reduce console noise
    const isTimeoutError = error.code === 'ECONNABORTED' || 
                          error.code === 'ETIMEDOUT' ||
                          error.message?.toLowerCase().includes('timeout') ||
                          error.message?.toLowerCase().includes('exceeded') ||
                          error.message?.toLowerCase().includes('aborted');
    
    if (!error.response && process.env.NODE_ENV === 'development' && !isTimeoutError) {
      console.warn('Network error fetching products (handled gracefully):', {
        message: error.message,
        url: error.config?.url,
      });
    }
    
    // Return empty array instead of throwing to prevent page crashes
    // Components handle empty arrays gracefully
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
  // Validate slug input
  if (!slug || typeof slug !== 'string' || slug.trim().length === 0) {
    console.error('Invalid slug provided to fetchProductBySlug:', slug);
    return null;
  }

  try {
    const response = await wcAPI.get('/products', { params: { slug: slug.trim() } });
    const products: WooCommerceProduct[] = response.data;
    
    if (!Array.isArray(products)) {
      console.error('Unexpected response format from WooCommerce API:', response.data);
      return null;
    }
    
    return products.length > 0 ? products[0] : null;
  } catch (error: any) {
    // Log error details with better error handling
    const errorDetails: any = { slug };
    
    if (error?.response) {
      // Axios response error
      errorDetails.status = error.response.status;
      errorDetails.statusText = error.response.statusText;
      errorDetails.message = error.response.data?.message || error.message || String(error);
      errorDetails.code = error.response.data?.code;
      if (error.response.data) {
        errorDetails.data = error.response.data;
      }
    } else if (error?.request) {
      // Request was made but no response received
      errorDetails.message = 'No response received from server';
      errorDetails.type = 'network_error';
    } else if (error instanceof Error) {
      // Standard Error object
      errorDetails.message = error.message;
      errorDetails.name = error.name;
      errorDetails.stack = error.stack;
    } else if (typeof error === 'string') {
      // String error
      errorDetails.message = error;
    } else if (error && typeof error === 'object') {
      // Generic object error
      errorDetails.message = error.message || error.toString() || 'Unknown error';
      errorDetails.error = error;
    } else {
      // Unknown error type
      errorDetails.message = 'Unknown error occurred';
      errorDetails.error = String(error);
    }
    
    console.error('Error fetching product by slug:', errorDetails);
    
    // Return null instead of throwing to allow graceful degradation
    // The interceptor already logs the error, so we don't need to throw
    return null;
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
    return response.data || [];
  } catch (error: any) {
    // Log error details for debugging (only in development)
    // Network errors are already logged by the interceptor
    if (process.env.NODE_ENV === 'development' && error.response) {
      console.warn('Error fetching categories:', {
        status: error.response.status,
        statusText: error.response.statusText,
        url: error.config?.url,
        message: error.response.data?.message || error.message,
      });
    }
    // Return empty array instead of throwing to prevent breaking the UI
    // Components handle empty arrays gracefully
    return [];
  }
};

export const fetchCategoryBySlug = async (slug: string): Promise<WooCommerceCategory | null> => {
  try {
    const response = await wcAPI.get('/products/categories', { params: { slug } });
    const categories: WooCommerceCategory[] = response.data;
    return categories.length ? categories[0] : null;
  } catch (error: any) {
    // Timeout errors are expected in some scenarios and handled gracefully
    // Components handle null returns gracefully
    // Suppress all timeout-related errors to reduce console noise
    const isTimeoutError = error.code === 'ECONNABORTED' || 
                          error.code === 'ETIMEDOUT' ||
                          error.message?.toLowerCase().includes('timeout') ||
                          error.message?.toLowerCase().includes('exceeded') ||
                          error.message?.toLowerCase().includes('aborted');
    
    // Don't log timeout errors - they're handled gracefully
    // Only log other network errors in development mode
    if (process.env.NODE_ENV === 'development' && !error.response && !isTimeoutError) {
      console.warn(`Network error fetching category by slug "${slug}" (handled gracefully)`);
    }
    // Timeout errors are silently handled - return null gracefully
    // Return null instead of throwing to prevent breaking the UI
    return null;
  }
};

export default wcAPI;

