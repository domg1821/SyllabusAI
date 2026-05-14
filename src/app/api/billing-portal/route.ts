import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    return NextResponse.json(
      { error: "Billing portal is not configured on this server." },
      { status: 500 }
    );
  }

  let email: string;
  try {
    const body = await req.json();
    email = String(body.email ?? "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const stripe = new Stripe(secretKey, {
    apiVersion: "2026-03-25.dahlia",
  });

  const origin = new URL(req.url).origin;

  try {
    // Find the Stripe customer associated with this email
    const customers = await stripe.customers.list({ email, limit: 1 });

    if (customers.data.length === 0) {
      return NextResponse.json(
        {
          error:
            "No billing account found for this email address. If you subscribed recently, please wait a moment and try again.",
        },
        { status: 404 }
      );
    }

    const customer = customers.data[0];

    // Create a Billing Portal session — the user can cancel, update payment, view invoices, etc.
    const session = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${origin}/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[billing-portal] Stripe error:", err);
    return NextResponse.json(
      { error: "Failed to open the billing portal. Please try again." },
      { status: 500 }
    );
  }
}
