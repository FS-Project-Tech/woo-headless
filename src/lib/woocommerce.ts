import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  WooCommerceProduct,
  WooCommerceCategory,
  WooCommerceTag,
  WooCommerceCustomer,
  WooCommerceOrder,
  WooCommercePaginatedResponse,
  ProductFilters,
  SearchResult,
  WordPressMenu,
  WooCommerceProductVariation,
  WooCommerceCart,
} from '@/types/woocommerce';

class WooCommerceAPI {
  private api: AxiosInstance;
  private wpApi: AxiosInstance;

  constructor() {
    const woocommerceUrl = process.env.NEXT_PUBLIC_WOOCOMMERCE_URL || 'https://your-woocommerce-site.com';
    const consumerKey = process.env.NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_KEY || 'your_consumer_key';
    const consumerSecret = process.env.NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_SECRET || 'your_consumer_secret';
    const wordpressUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://your-wordpress-site.com';

    // Only throw error in production if credentials are missing
    if (process.env.NODE_ENV === 'production' && 
        (!process.env.NEXT_PUBLIC_WOOCOMMERCE_URL || 
         !process.env.NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_KEY || 
         !process.env.NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_SECRET)) {
      throw new Error('Missing WooCommerce API credentials');
    }

    // WooCommerce API client
    this.api = axios.create({
      baseURL: `${woocommerceUrl}/wp-json/wc/v3`,
      auth: {
        username: consumerKey,
        password: consumerSecret,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // WordPress API client for menus
    this.wpApi = axios.create({
      baseURL: `${wordpressUrl}/wp-json/wp/v2`,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Products
  async getProducts(filters: ProductFilters = {}): Promise<WooCommercePaginatedResponse<WooCommerceProduct>> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response: AxiosResponse<WooCommerceProduct[]> = await this.api.get(`/products?${params.toString()}`);
    
    return {
      data: response.data,
      total: parseInt(response.headers['x-wp-total'] || '0'),
      totalPages: parseInt(response.headers['x-wp-totalpages'] || '0'),
      currentPage: filters.page || 1,
      perPage: filters.per_page || 10,
    };
  }

  async getProduct(id: number): Promise<WooCommerceProduct> {
    const response: AxiosResponse<WooCommerceProduct> = await this.api.get(`/products/${id}`);
    return response.data;
  }

  async getProductBySlug(slug: string): Promise<WooCommerceProduct> {
    const response: AxiosResponse<WooCommerceProduct[]> = await this.api.get(`/products?slug=${slug}`);
    if (response.data.length === 0) {
      throw new Error('Product not found');
    }
    return response.data[0];
  }

  async getFeaturedProducts(limit: number = 8): Promise<WooCommerceProduct[]> {
    const response: AxiosResponse<WooCommerceProduct[]> = await this.api.get(
      `/products?featured=true&per_page=${limit}`
    );
    return response.data;
  }

  async getRelatedProducts(productId: number, limit: number = 4): Promise<WooCommerceProduct[]> {
    const product = await this.getProduct(productId);
    const categoryIds = product.categories.map(cat => cat.id);
    
    if (categoryIds.length === 0) return [];
    
    const response: AxiosResponse<WooCommerceProduct[]> = await this.api.get(
      `/products?category=${categoryIds.join(',')}&exclude=${productId}&per_page=${limit}`
    );
    return response.data;
  }

  // Product Variations
  async getProductVariations(productId: number): Promise<WooCommerceProductVariation[]> {
    const response: AxiosResponse<WooCommerceProductVariation[]> = await this.api.get(
      `/products/${productId}/variations`
    );
    return response.data;
  }

  async getProductVariation(productId: number, variationId: number): Promise<WooCommerceProductVariation> {
    const response: AxiosResponse<WooCommerceProductVariation> = await this.api.get(
      `/products/${productId}/variations/${variationId}`
    );
    return response.data;
  }

  async searchProducts(query: string, limit: number = 10): Promise<SearchResult> {
    const response: AxiosResponse<WooCommerceProduct[]> = await this.api.get(
      `/products?search=${encodeURIComponent(query)}&per_page=${limit}`
    );
    
    return {
      products: response.data,
      total: parseInt(response.headers['x-wp-total'] || '0'),
      totalPages: parseInt(response.headers['x-wp-totalpages'] || '0'),
      currentPage: 1,
    };
  }

  // Categories
  async getCategories(): Promise<WooCommerceCategory[]> {
    const response: AxiosResponse<WooCommerceCategory[]> = await this.api.get('/products/categories');
    return response.data;
  }

  async getCategory(id: number): Promise<WooCommerceCategory> {
    const response: AxiosResponse<WooCommerceCategory> = await this.api.get(`/products/categories/${id}`);
    return response.data;
  }

  async getCategoryBySlug(slug: string): Promise<WooCommerceCategory> {
    const response: AxiosResponse<WooCommerceCategory[]> = await this.api.get(`/products/categories?slug=${slug}`);
    if (response.data.length === 0) {
      throw new Error('Category not found');
    }
    return response.data[0];
  }

  // Tags
  async getTags(): Promise<WooCommerceTag[]> {
    const response: AxiosResponse<WooCommerceTag[]> = await this.api.get('/products/tags');
    return response.data;
  }

  // Customers
  async createCustomer(customerData: Partial<WooCommerceCustomer>): Promise<WooCommerceCustomer> {
    const response: AxiosResponse<WooCommerceCustomer> = await this.api.post('/customers', customerData);
    return response.data;
  }

  async getCustomer(id: number): Promise<WooCommerceCustomer> {
    const response: AxiosResponse<WooCommerceCustomer> = await this.api.get(`/customers/${id}`);
    return response.data;
  }

  // Orders
  async createOrder(orderData: Partial<WooCommerceOrder>): Promise<WooCommerceOrder> {
    const response: AxiosResponse<WooCommerceOrder> = await this.api.post('/orders', orderData);
    return response.data;
  }

  async getOrder(id: number): Promise<WooCommerceOrder> {
    const response: AxiosResponse<WooCommerceOrder> = await this.api.get(`/orders/${id}`);
    return response.data;
  }

  // WordPress Menu
  async getMenu(location: string = 'primary'): Promise<WordPressMenu[]> {
    try {
      const response: AxiosResponse<WordPressMenu[]> = await this.wpApi.get(`/menu-locations/${location}`);
      return response.data;
    } catch (error) {
      console.warn('Failed to fetch menu:', error);
      return [];
    }
  }

  // Utility methods
  async getCartUrl(): Promise<string> {
    return `${process.env.NEXT_PUBLIC_WOOCOMMERCE_URL}/cart/`;
  }

  async getCheckoutUrl(): Promise<string> {
    return `${process.env.NEXT_PUBLIC_WOOCOMMERCE_URL}/checkout/`;
  }

  async addToCartUrl(productId: number, quantity: number = 1, variationId?: number): Promise<string> {
    let url = `${process.env.NEXT_PUBLIC_WOOCOMMERCE_URL}/cart/?add-to-cart=${productId}&quantity=${quantity}`;
    if (variationId) {
      url += `&variation_id=${variationId}`;
    }
    return url;
  }

  // Cart functionality
  async addToCart(productId: number, quantity: number = 1, variationId?: number, attributes?: Record<string, string>): Promise<{ success: boolean; message: string; cart?: WooCommerceCart; cartUrl?: string }> {
    try {
      // Use WooCommerce REST API to add to cart
      const cartData: any = {
        id: productId,
        quantity: quantity
      };

      if (variationId) {
        cartData.variation_id = variationId;
      }

      if (attributes) {
        cartData.attributes = Object.entries(attributes).map(([name, option]) => ({
          name,
          option
        }));
      }

      // Try to add to cart using REST API
      const response = await this.api.post('/cart/add', cartData);
      
      if (response.status === 200 || response.status === 201) {
        // Fetch updated cart after successful add
        try {
          const cart = await this.getCart();
          return { success: true, message: 'Product added to cart', cart };
        } catch (cartError) {
          // If cart fetch fails, still return success for the add operation
          return { success: true, message: 'Product added to cart' };
        }
      } else {
        return { success: false, message: 'Failed to add product to cart' };
      }
    } catch (error: any) {
      console.error('Add to cart error:', error);
      
      // If REST API fails, fallback to URL-based approach
      try {
        const cartUrl = await this.addToCartUrl(productId, quantity, variationId);
        
        // Add attributes to URL if provided
        if (attributes) {
          const attributeParams = Object.entries(attributes)
            .map(([key, value]) => `attribute_${key}=${encodeURIComponent(value)}`)
            .join('&');
          const finalUrl = `${cartUrl}&${attributeParams}`;
          
          return { success: true, message: 'Product added to cart (redirect method)', cartUrl: finalUrl };
        }
        
        return { success: true, message: 'Product added to cart (redirect method)', cartUrl };
      } catch (fallbackError) {
        return { success: false, message: 'Network error occurred' };
      }
    }
  }

  async getCart(): Promise<WooCommerceCart> {
    const response: AxiosResponse<WooCommerceCart> = await this.api.get('/cart');
    return response.data;
  }

  async updateCartItem(cartItemKey: string, quantity: number): Promise<WooCommerceCart> {
    const response: AxiosResponse<WooCommerceCart> = await this.api.put(`/cart/${cartItemKey}`, {
      quantity
    });
    return response.data;
  }

  async removeCartItem(cartItemKey: string): Promise<WooCommerceCart> {
    const response: AxiosResponse<WooCommerceCart> = await this.api.delete(`/cart/${cartItemKey}`);
    return response.data;
  }

  async clearCart(): Promise<WooCommerceCart> {
    const response: AxiosResponse<WooCommerceCart> = await this.api.delete('/cart');
    return response.data;
  }
}

// Create singleton instance
export const wooCommerceAPI = new WooCommerceAPI();
export default wooCommerceAPI;
