import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken, getWpBaseUrl } from '@/lib/auth';
import wcAPI from '@/lib/woocommerce';

/**
 * GET /api/dashboard/customer
 * Fetch customer stats and information
 */
export async function GET(req: NextRequest) {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const wpBase = getWpBaseUrl();
    if (!wpBase) {
      return NextResponse.json(
        { error: 'WordPress URL not configured' },
        { status: 500 }
      );
    }

    // Get user data
    const userResponse = await fetch(`${wpBase}/wp-json/wp/v2/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!userResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to get user data' },
        { status: 401 }
      );
    }

    const user = await userResponse.json();

    // Get WooCommerce customer data
    let customerId = null;
    let ordersCount = 0;
    let totalSpent = '0';
    let currency = 'AUD';

    try {
      // Try to get customer data using WooCommerce API client
      const customerResponse = await wcAPI.get('/customers', {
        params: { email: user.email },
      });

      if (customerResponse.data && customerResponse.data.length > 0) {
        const customer = customerResponse.data[0];
        customerId = customer.id;
        ordersCount = customer.orders_count || 0;
        totalSpent = customer.total_spent || '0';
        currency = customer.currency || 'AUD';
      }
    } catch (error: any) {
      console.error('Error fetching customer data:', error.message);
      // Continue to try fetching orders directly
    }

    // Fetch actual orders to get accurate count and total
    try {
      const orderParams: any = {
        per_page: 100,
        orderby: 'date',
        order: 'desc',
      };

      // Set customer filter - try customer ID first, then email
      if (customerId) {
        orderParams.customer = customerId.toString();
      } else if (user.email) {
        orderParams.customer = user.email;
      }

      // Method 1: Try using WooCommerce API client
      try {
        const ordersResponse = await wcAPI.get('/orders', { params: orderParams });
        const orders = ordersResponse.data || [];
        
        if (Array.isArray(orders) && orders.length > 0) {
          ordersCount = orders.length;
          // Calculate total spent from orders with status "completed" or "processing"
          totalSpent = orders
            .filter((order: any) => {
              const status = (order.status || '').toLowerCase();
              return status === 'completed' || status === 'processing';
            })
            .reduce((sum: number, order: any) => {
              return sum + parseFloat(order.total || 0);
            }, 0).toFixed(2);
          // Get currency from first order if available
          if (orders[0].currency) {
            currency = orders[0].currency;
          }
        }
      } catch (wcError: any) {
        console.error('WooCommerce API client error for orders:', {
          status: wcError.response?.status,
          message: wcError.response?.data?.message || wcError.message,
        });

        // Method 2: Fallback to JWT token
        try {
          const ordersUrl = new URL(`${wpBase}/wp-json/wc/v3/orders`);
          Object.keys(orderParams).forEach(key => {
            ordersUrl.searchParams.set(key, orderParams[key]);
          });

          const ordersResponse = await fetch(ordersUrl.toString(), {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            cache: 'no-store',
          });

          if (ordersResponse.ok) {
            const orders = await ordersResponse.json();
            if (Array.isArray(orders) && orders.length > 0) {
              ordersCount = orders.length;
              // Calculate total spent from orders with status "completed" or "processing"
              totalSpent = orders
                .filter((order: any) => {
                  const status = (order.status || '').toLowerCase();
                  return status === 'completed' || status === 'processing';
                })
                .reduce((sum: number, order: any) => {
                  return sum + parseFloat(order.total || 0);
                }, 0).toFixed(2);
              if (orders[0].currency) {
                currency = orders[0].currency;
              }
            }
          }
        } catch (jwtError: any) {
          console.error('JWT auth error for orders:', jwtError.message);
        }
      }
    } catch (error: any) {
      console.error('Error fetching orders for count:', error.message);
    }

    // Get wishlist count
    let wishlistCount = 0;
    try {
      const wishlistResponse = await fetch(`${wpBase}/wp-json/custom/v1/wishlist`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (wishlistResponse.ok) {
        const wishlistData = await wishlistResponse.json();
        wishlistCount = wishlistData.wishlist?.length || 0;
      }
    } catch (error) {
      // Ignore wishlist errors
    }

    return NextResponse.json({
      orders_count: ordersCount,
      total_spent: totalSpent,
      currency: currency,
      wishlist_count: wishlistCount,
      date_created: user.date || new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Customer API error:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching customer data' },
      { status: 500 }
    );
  }
}

