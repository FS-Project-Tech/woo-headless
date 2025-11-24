import { NextRequest, NextResponse } from "next/server";

/**
 * Newsletter Subscription API
 * Handles newsletter subscription requests
 * 
 * In production, integrate with your email marketing service (Mailchimp, SendGrid, etc.)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    // Validate email
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
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

    // TODO: Integrate with your email marketing service
    // Example integrations:
    // - Mailchimp API
    // - SendGrid API
    // - ConvertKit API
    // - WordPress plugin API
    
    // For now, just log the subscription
    console.log(`Newsletter subscription: ${email}`);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return NextResponse.json({
      success: true,
      message: "Successfully subscribed to newsletter",
    });
  } catch (error: any) {
    console.error("Newsletter subscription error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to subscribe to newsletter" },
      { status: 500 }
    );
  }
}

