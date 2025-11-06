import { NextResponse } from "next/server";
import wcAPI from "@/lib/woocommerce";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { customerId, paymentMethod, billing } = body;

    if (!customerId || !paymentMethod) {
      return NextResponse.json({ error: "Missing customerId or paymentMethod" }, { status: 400 });
    }

    // Update customer meta data with payment method preference
    try {
      // Get current customer data
      const customerRes = await wcAPI.get(`/customers/${customerId}`);
      const customer = customerRes.data;

      // Update customer with payment method in meta_data
      const metaData = customer.meta_data || [];
      
      // Remove existing payment method meta if exists
      const filteredMeta = metaData.filter((m: any) => m.key !== '_preferred_payment_method');
      
      // Add new payment method preference
      filteredMeta.push({
        key: '_preferred_payment_method',
        value: paymentMethod,
      });

      // Also update billing address if provided
      const updateData: any = {
        meta_data: filteredMeta,
      };

      // Update billing address if provided
      if (billing) {
        updateData.billing = {
          first_name: billing.first_name || customer.billing?.first_name || '',
          last_name: billing.last_name || customer.billing?.last_name || '',
          company: billing.company || customer.billing?.company || '',
          address_1: billing.address_1 || customer.billing?.address_1 || '',
          address_2: billing.address_2 || customer.billing?.address_2 || '',
          city: billing.city || customer.billing?.city || '',
          postcode: billing.postcode || customer.billing?.postcode || '',
          country: billing.country || customer.billing?.country || '',
          state: billing.state || customer.billing?.state || '',
          email: billing.email || customer.billing?.email || customer.email || '',
          phone: billing.phone || customer.billing?.phone || '',
        };
      }

      // Update customer
      const updateRes = await wcAPI.put(`/customers/${customerId}`, updateData);
      
      return NextResponse.json({ 
        success: true, 
        customer: updateRes.data,
        message: "Payment method preference saved successfully" 
      });
    } catch (error: any) {
      const status = error?.response?.status || 500;
      const message = error?.response?.data || { message: "Failed to update customer payment method" };
      return NextResponse.json(message, { status });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to update customer payment method" },
      { status: 500 }
    );
  }
}

