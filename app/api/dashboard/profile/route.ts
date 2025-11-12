import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken, getWpBaseUrl } from '@/lib/auth';
import wcAPI from '@/lib/woocommerce';

/**
 * GET /api/dashboard/profile
 * Fetch user profile and WooCommerce customer data
 */
export async function GET(req: NextRequest) {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      console.error('Profile GET: No token found in cookies');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const wpBase = getWpBaseUrl();
    if (!wpBase) {
      console.error('Profile GET: WordPress URL not configured');
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
      const errorText = await userResponse.text();
      console.error('Profile GET: Failed to get user data', {
        status: userResponse.status,
        statusText: userResponse.statusText,
        error: errorText,
      });
      return NextResponse.json(
        { error: 'Failed to get user data', details: errorText },
        { status: 401 }
      );
    }

    const user = await userResponse.json();

    // Get WooCommerce customer data
    let customerData = null;
    try {
      const customerResponse = await wcAPI.get('/customers', {
        params: { email: user.email },
      });

      if (customerResponse.data && customerResponse.data.length > 0) {
        customerData = customerResponse.data[0];
      }
    } catch (wcError: any) {
      console.error('Error fetching WooCommerce customer:', wcError.message);
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.slug || user.user_login,
        roles: user.roles || [],
      },
      customer: customerData ? {
        id: customerData.id,
        first_name: customerData.first_name || '',
        last_name: customerData.last_name || '',
        email: customerData.email || user.email,
        username: customerData.username || user.slug,
        date_created: customerData.date_created,
        billing: customerData.billing || {},
        shipping: customerData.shipping || {},
      } : null,
    });
  } catch (error: any) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching profile' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/dashboard/profile
 * Update user profile information
 */
export async function PUT(req: NextRequest) {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { 
      first_name, 
      last_name, 
      email, 
      phone,
      company,
      billing,
      shipping,
    } = body;

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

    // Update WordPress user
    const updateUserResponse = await fetch(`${wpBase}/wp-json/wp/v2/users/${user.id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email || user.email,
        meta: {
          first_name: first_name || '',
          last_name: last_name || '',
        },
      }),
      cache: 'no-store',
    });

    if (!updateUserResponse.ok) {
      const error = await updateUserResponse.json();
      return NextResponse.json(
        { error: error.message || 'Failed to update user' },
        { status: updateUserResponse.status }
      );
    }

    // Update WooCommerce customer if exists
    try {
      const customerResponse = await wcAPI.get('/customers', {
        params: { email: user.email },
      });

      if (customerResponse.data && customerResponse.data.length > 0) {
        const customer = customerResponse.data[0];
        
        // Prepare billing data
        const billingData = billing ? {
          first_name: billing.first_name || first_name || customer.billing?.first_name || '',
          last_name: billing.last_name || last_name || customer.billing?.last_name || '',
          company: billing.company || company || customer.billing?.company || '',
          address_1: billing.address_1 || customer.billing?.address_1 || '',
          address_2: billing.address_2 || customer.billing?.address_2 || '',
          city: billing.city || customer.billing?.city || '',
          state: billing.state || customer.billing?.state || '',
          postcode: billing.postcode || customer.billing?.postcode || '',
          country: billing.country || customer.billing?.country || 'AU',
          email: email || customer.billing?.email || customer.email || '',
          phone: billing.phone || phone || customer.billing?.phone || '',
        } : {
          ...customer.billing,
          first_name: first_name || customer.billing?.first_name || customer.first_name || '',
          last_name: last_name || customer.billing?.last_name || customer.last_name || '',
          company: company || customer.billing?.company || '',
          email: email || customer.billing?.email || customer.email || '',
          phone: phone || customer.billing?.phone || '',
        };

        // Prepare shipping data
        const shippingData = shipping ? {
          first_name: shipping.first_name || first_name || customer.shipping?.first_name || '',
          last_name: shipping.last_name || last_name || customer.shipping?.last_name || '',
          company: shipping.company || company || customer.shipping?.company || '',
          address_1: shipping.address_1 || customer.shipping?.address_1 || '',
          address_2: shipping.address_2 || customer.shipping?.address_2 || '',
          city: shipping.city || customer.shipping?.city || '',
          state: shipping.state || customer.shipping?.state || '',
          postcode: shipping.postcode || customer.shipping?.postcode || '',
          country: shipping.country || customer.shipping?.country || 'AU',
        } : {
          ...customer.shipping,
        };

        // Update WooCommerce customer
        const updateCustomerResponse = await wcAPI.put(`/customers/${customer.id}`, {
          email: email || customer.email,
          first_name: first_name || customer.first_name || '',
          last_name: last_name || customer.last_name || '',
          username: customer.username,
          billing: billingData,
          shipping: shippingData,
        });

        if (!updateCustomerResponse.data) {
          console.error('Failed to update WooCommerce customer');
        }
      }
    } catch (wcError: any) {
      console.error('Error updating WooCommerce customer:', wcError.message);
      // Don't fail the entire request if WooCommerce update fails
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: email || user.email,
        name: `${first_name || ''} ${last_name || ''}`.trim() || user.name,
      },
    });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating profile' },
      { status: 500 }
    );
  }
}

