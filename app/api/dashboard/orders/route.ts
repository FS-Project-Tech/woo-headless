import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken, getWpBaseUrl } from '@/lib/auth';
import wcAPI from '@/lib/woocommerce';

/**
 * GET /api/dashboard/orders
 * Fetch orders for the authenticated user
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

    // Get user data to get customer ID
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

    // Get WooCommerce customer ID
    const customerResponse = await fetch(`${wpBase}/wp-json/wc/v3/customers?email=${encodeURIComponent(user.email)}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    let customerId = null;
    if (customerResponse.ok) {
      const customers = await customerResponse.json();
      if (customers && customers.length > 0) {
        customerId = customers[0].id;
      }
    }

    // If no customer ID found, try to use WordPress user ID
    if (!customerId && user.id) {
      customerId = user.id;
    }

    // Get pagination parameters from query string
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = 10; // Display 10 orders per page

    // Build query parameters for orders
    const orderParams: any = {
      per_page: 100, // Fetch more to ensure we get all orders including pending
      page: 1,
      orderby: 'date',
      order: 'desc',
    };

    // Set customer filter - try customer ID first, then email
    if (customerId) {
      orderParams.customer = customerId.toString();
    } else if (user.email) {
      orderParams.customer = user.email;
    } else {
      console.warn('No customer ID or email found for orders query');
      return NextResponse.json({ 
        orders: [],
        pagination: {
          page,
          per_page: perPage,
          total: 0,
          total_pages: 0,
        }
      });
    }

    // Method 1: Try using WooCommerce API client (with consumer key/secret)
    try {
      // Fetch orders by customer ID/email
      const response = await wcAPI.get('/orders', { params: orderParams });
      let orders = response.data || [];
      
      // Also fetch orders by billing email to catch pending/guest orders
      if (user.email) {
        try {
          const emailParams = {
            ...orderParams,
            customer: user.email, // Use email instead of ID
          };
          const emailResponse = await wcAPI.get('/orders', { params: emailParams });
          const emailOrders = emailResponse.data || [];
          
          // Combine and deduplicate orders by ID
          const orderMap = new Map();
          [...orders, ...emailOrders].forEach((order: any) => {
            if (!orderMap.has(order.id)) {
              // Verify order belongs to user by checking billing email
              if (order.billing?.email?.toLowerCase() === user.email?.toLowerCase() ||
                  order.customer_id === customerId ||
                  order.customer_id === user.id) {
                orderMap.set(order.id, order);
              }
            }
          });
          orders = Array.from(orderMap.values());
        } catch (emailError) {
          console.warn('Failed to fetch orders by email:', emailError);
          // Continue with customer ID results
        }
      }
      
      // Sort orders by date (newest first)
      orders.sort((a: any, b: any) => {
        const dateA = new Date(a.date_created).getTime();
        const dateB = new Date(b.date_created).getTime();
        return dateB - dateA;
      });
      
      // Apply pagination manually since we fetched all orders
      const total = orders.length;
      const totalPages = Math.ceil(total / perPage);
      const startIndex = (page - 1) * perPage;
      const endIndex = startIndex + perPage;
      const paginatedOrders = orders.slice(startIndex, endIndex);
      
      return NextResponse.json({ 
        orders: paginatedOrders,
        pagination: {
          page,
          per_page: perPage,
          total,
          total_pages: totalPages,
        }
      });
    } catch (wcError: any) {
      console.error('WooCommerce API client error:', {
        status: wcError.response?.status,
        message: wcError.response?.data?.message || wcError.message,
        customerId,
        userEmail: user.email,
      });

      // Method 2: Try with JWT token as fallback
      try {
        // Fetch orders by customer ID/email
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
          let orders = await ordersResponse.json() || [];
          
          // Also fetch orders by billing email to catch pending/guest orders
          if (user.email) {
            try {
              const emailOrdersUrl = new URL(`${wpBase}/wp-json/wc/v3/orders`);
              const emailParams = { ...orderParams, customer: user.email };
              Object.keys(emailParams).forEach(key => {
                emailOrdersUrl.searchParams.set(key, emailParams[key]);
              });
              
              const emailOrdersResponse = await fetch(emailOrdersUrl.toString(), {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                cache: 'no-store',
              });
              
              if (emailOrdersResponse.ok) {
                const emailOrders = await emailOrdersResponse.json() || [];
                
                // Combine and deduplicate orders by ID
                const orderMap = new Map();
                [...orders, ...emailOrders].forEach((order: any) => {
                  if (!orderMap.has(order.id)) {
                    // Verify order belongs to user by checking billing email
                    if (order.billing?.email?.toLowerCase() === user.email?.toLowerCase() ||
                        order.customer_id === customerId ||
                        order.customer_id === user.id) {
                      orderMap.set(order.id, order);
                    }
                  }
                });
                orders = Array.from(orderMap.values());
              }
            } catch (emailError) {
              console.warn('Failed to fetch orders by email (JWT):', emailError);
            }
          }
          
          // Sort orders by date (newest first)
          orders.sort((a: any, b: any) => {
            const dateA = new Date(a.date_created).getTime();
            const dateB = new Date(b.date_created).getTime();
            return dateB - dateA;
          });
          
          // Apply pagination manually
          const total = orders.length;
          const totalPages = Math.ceil(total / perPage);
          const startIndex = (page - 1) * perPage;
          const endIndex = startIndex + perPage;
          const paginatedOrders = orders.slice(startIndex, endIndex);
          
          return NextResponse.json({ 
            orders: paginatedOrders,
            pagination: {
              page,
              per_page: perPage,
              total,
              total_pages: totalPages,
            }
          });
        } else {
          const errorText = await ordersResponse.text();
          console.error('JWT auth failed:', {
            status: ordersResponse.status,
            error: errorText,
          });
        }
      } catch (jwtError: any) {
        console.error('JWT auth error:', jwtError.message);
      }
    }

    // If all methods failed, return empty array with pagination
    return NextResponse.json({ 
      orders: [],
      pagination: {
        page,
        per_page: perPage,
        total: 0,
        total_pages: 0,
      }
    });
  } catch (error: any) {
    console.error('Orders API error:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching orders' },
      { status: 500 }
    );
  }
}

