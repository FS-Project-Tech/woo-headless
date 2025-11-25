import { NextRequest, NextResponse } from "next/server";
import { getWpBaseUrl } from "@/lib/auth";

/**
 * POST /api/consultation/request
 * Send consultation request email to info@joyamedicalsupplies.com.au
 * and thank you email to customer
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, productName, comment } = body;

    // Validation
    if (!email || !comment || !productName) {
      return NextResponse.json(
        { error: "Email, product name, and comment are required" },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const wpBase = getWpBaseUrl();
    if (!wpBase) {
      return NextResponse.json(
        { error: "WordPress URL not configured" },
        { status: 500 }
      );
    }

    // Email to info@joyamedicalsupplies.com.au
    const adminEmailSubject = `Consultation Request - ${productName}`;
    const adminEmailBody = `
New Consultation Request

Product: ${productName}
Customer Name: ${name || "Not provided"}
Customer Email: ${email}

Comment:
${comment}

---
This is an automated message from ${process.env.NEXT_PUBLIC_SITE_NAME || "Joya Medical Supplies"}.
    `.trim();

    // Thank you email to customer
    const customerEmailSubject = `Thank you for your consultation request - ${productName}`;
    const customerEmailBody = `
Hello ${name || "Customer"},

Thank you for your consultation request regarding "${productName}".

We have received your request and one of our team members will contact you shortly to assist you.

Your Request Details:
- Product: ${productName}
- Comment: ${comment}

If you have any urgent questions, please don't hesitate to contact us directly.

Best regards,
${process.env.NEXT_PUBLIC_SITE_NAME || "Joya Medical Supplies"}
    `.trim();

    // Try to send emails via WordPress
    try {
      // Send to admin
      const adminResponse = await fetch(`${wpBase}/wp-json/wp/v2/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: "info@joyamedicalsupplies.com.au",
          subject: adminEmailSubject,
          message: adminEmailBody,
          headers: {
            "Content-Type": "text/plain; charset=UTF-8",
          },
        }),
        cache: "no-store",
      });

      // Send to customer
      const customerResponse = await fetch(`${wpBase}/wp-json/wp/v2/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: email,
          subject: customerEmailSubject,
          message: customerEmailBody,
          headers: {
            "Content-Type": "text/plain; charset=UTF-8",
          },
        }),
        cache: "no-store",
      });

      if (adminResponse.ok && customerResponse.ok) {
        return NextResponse.json({
          success: true,
          message: "Consultation request submitted successfully",
        });
      }
    } catch (wpError) {
      console.log("WordPress email endpoint not available, using alternative method");
    }

    // Fallback: Log emails (for development/testing)
    // In production, integrate with your email service (SendGrid, Mailgun, etc.)
    console.log("Consultation Request Email (Admin):", {
      to: "info@joyamedicalsupplies.com.au",
      subject: adminEmailSubject,
      body: adminEmailBody,
    });

    console.log("Consultation Request Email (Customer):", {
      to: email,
      subject: customerEmailSubject,
      body: customerEmailBody,
    });

    // If you have an email webhook or service, call it here
    const emailWebhook = process.env.CONSULTATION_EMAIL_WEBHOOK_URL;
    if (emailWebhook) {
      try {
        await fetch(emailWebhook, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "consultation_request",
            adminEmail: {
              to: "info@joyamedicalsupplies.com.au",
              subject: adminEmailSubject,
              body: adminEmailBody,
            },
            customerEmail: {
              to: email,
              subject: customerEmailSubject,
              body: customerEmailBody,
            },
          }),
        });
      } catch (webhookError) {
        console.error("Email webhook error:", webhookError);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Consultation request submitted successfully",
    });
  } catch (error: any) {
    console.error("Consultation request error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to submit consultation request" },
      { status: 500 }
    );
  }
}

