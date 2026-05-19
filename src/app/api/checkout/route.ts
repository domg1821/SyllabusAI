import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const monthlyPriceId = process.env.STRIPE_PRICE_ID;
  const yearlyPriceId = process.env.STRIPE_PRICE_ID_YEARLY;

  if (!secretKey || !monthlyPriceId) {
    return NextResponse.json(
      { error: "Stripe is not configured on this server." },
      { status: 500 }
    );
  }

  // Log a warning if using test keys in production, but allow it through for testing.
  if (process.env.NODE_ENV === "production" && secretKey.startsWith("sk_test_")) {
    console.warn(
      "[checkout] Using Stripe test key in production — OK for testing, but swap to sk_live_ before real payments."
    );
  }

  // Parse billing period from request body — defaults to monthly
  let billingPeriod: "monthly" | "yearly" = "monthly";
  try {
    const body = await req.json();
    if (body?.billingPeriod === "yearly") billingPeriod = "yearly";
  } catch {
    // No body or invalid JSON — treat as monthly
  }

  // Choose the correct Stripe price ID
  const isYearly = billingPeriod === "yearly";
  const priceId = isYearly ? (yearlyPriceId ?? monthlyPriceId) : monthlyPriceId;

  // If yearly was requested but no yearly price ID is set, fall back to monthly
  if (isYearly && !yearlyPriceId) {
    console.warn("[checkout] STRIPE_PRICE_ID_YEARLY not set — falling back to monthly price.");
  }

  // Require an authenticated session — user_id goes into Stripe metadata
  // so the webhook knows which Supabase user to activate.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const stripe = new Stripe(secretKey, { apiVersion: "2026-03-25.dahlia" });
  const origin = new URL(req.url).origin;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      // Pre-fill email so the user doesn't have to type it
      customer_email: user.email,
      // user_id in metadata lets the webhook find the right Supabase profile
      metadata: { user_id: user.id, billing_period: billingPeriod },
      // {CHECKOUT_SESSION_ID} is a Stripe template variable — replaced at redirect time
      success_url: `${origin}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard?checkout=cancel`,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error("[checkout] Stripe error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session. Please try again." },
      { status: 500 }
    );
  }
}
