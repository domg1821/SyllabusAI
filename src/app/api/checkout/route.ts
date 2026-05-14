import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID;

  if (!secretKey || !priceId) {
    return NextResponse.json(
      { error: "Stripe is not configured on this server." },
      { status: 500 }
    );
  }

  // Guard: prevent accidentally charging real money with test keys in production.
  if (process.env.NODE_ENV === "production" && secretKey.startsWith("sk_test_")) {
    console.error(
      "[checkout] MISCONFIGURATION: STRIPE_SECRET_KEY is a test key but NODE_ENV is production. " +
      "Set STRIPE_SECRET_KEY to a live key (sk_live_...) before taking real payments."
    );
    return NextResponse.json(
      { error: "Payment system is not configured for production. Contact support." },
      { status: 503 }
    );
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
      metadata: { user_id: user.id },
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
