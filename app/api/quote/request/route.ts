import { NextRequest, NextResponse } from 'next/server';
import { getWpBaseUrl } from '@/lib/auth';

/**
 * POST /api/quote/request
 * Send quote request email to the logged-in user
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      email, 
      userName,
      items, 
      subtotal, 
      shipping, 
      shippingMethod,
      discount,
      total 
    } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Cart items are required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const wpBase = getWpBaseUrl();
    if (!wpBase) {
      return NextResponse.json(
        { error: 'WordPress URL not configured' },
        { status: 500 }
      );
    }

    // Build email content
    const itemsList = items.map((item: any) => {
      const attributes = item.attributes ? Object.entries(item.attributes).map(([k, v]) => `${k}: ${v}`).join(', ') : '';
      const deliveryPlan = item.deliveryPlan && item.deliveryPlan !== 'none' 
        ? ` (Delivery: ${item.deliveryPlan === '7' ? 'Every 7 days' : item.deliveryPlan === '14' ? 'Every 14 days' : 'Every month'})`
        : '';
      return `- ${item.name}${item.sku ? ` (SKU: ${item.sku})` : ''}${attributes ? ` [${attributes}]` : ''}${deliveryPlan} - Qty: ${item.qty} × $${item.price}`;
    }).join('\n');

    const emailSubject = `Quote Request - ${items.length} ${items.length === 1 ? 'Item' : 'Items'}`;
    
    const emailBody = `
Hello ${userName || 'Customer'},

Thank you for your quote request. Below are the details of the items you've requested:

QUOTE REQUEST DETAILS
=====================

Items Requested:
${itemsList}

Pricing Summary:
- Subtotal: $${subtotal.toFixed(2)}
${shippingMethod ? `- Shipping (${shippingMethod}): $${shipping.toFixed(2)}` : '- Shipping: $0.00'}
${discount > 0 ? `- Discount: -$${discount.toFixed(2)}` : ''}
- Total: $${total.toFixed(2)}

Our sales team will review your request and get back to you shortly with a personalized quote.

If you have any questions, please don't hesitate to contact us.

Best regards,
${process.env.NEXT_PUBLIC_SITE_NAME || 'Joya Medical Supplies'}
    `.trim();

    // Try to send email via WordPress
    // Option 1: Use WordPress wp_mail function via REST API (if available)
    try {
      const wpResponse = await fetch(`${wpBase}/wp-json/wp/v2/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          subject: emailSubject,
          message: emailBody,
          headers: {
            'Content-Type': 'text/plain; charset=UTF-8',
          },
        }),
        cache: 'no-store',
      });

      if (wpResponse.ok) {
        return NextResponse.json({ 
          success: true, 
          message: 'Quote request email sent successfully' 
        });
      }
    } catch (wpError) {
      // WordPress email endpoint might not exist, continue to alternative
      console.log('WordPress email endpoint not available, using alternative method');
    }

    // Option 2: Use WooCommerce email system (create a draft order or use webhook)
    // For now, we'll log it and return success
    // In production, you should integrate with your email service (SendGrid, Mailgun, etc.)
    console.log('Quote Request Email:', {
      to: email,
      subject: emailSubject,
      body: emailBody,
    });

    // If you have an email webhook or service, call it here
    const emailWebhook = process.env.QUOTE_EMAIL_WEBHOOK_URL;
    if (emailWebhook) {
      try {
        await fetch(emailWebhook, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: email,
            subject: emailSubject,
            body: emailBody,
            type: 'quote_request',
          }),
        });
      } catch (webhookError) {
        console.error('Email webhook error:', webhookError);
      }
    }

    // Return success even if email sending fails (don't reveal internal errors to user)
    return NextResponse.json({ 
      success: true, 
      message: 'Quote request submitted successfully' 
    });

  } catch (error: any) {
    console.error('Quote request error:', error);
    return NextResponse.json(
      { error: 'Failed to process quote request. Please try again.' },
      { status: 500 }
    );
  }
}

