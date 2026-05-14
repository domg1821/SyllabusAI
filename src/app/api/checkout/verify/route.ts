import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Verifies a Stripe checkout session and, if paid, activates Pro in Supabase.
 *
 * This is called by the dashboard immediately after the user returns from Stripe,
 * before the webhook has necessarily fired. It ensures the user sees Pro status
 * right away rather than waiting for the async webhook.
 *
 * The webhook is still the authoritative/durable path — this is just the fast path.
 */
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ paid: false });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ paid: false });
  }

  const stripe = new Stripe(secretKey, { apiVersion: "2026-03-25.dahlia" });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paid =
      session.payment_status === "paid" || session.status === "complete";

    if (paid) {
      const userId = session.metadata?.user_id;
      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : (session.customer as Stripe.Customer | null)?.id ?? null;

      if (userId) {
        const supabase = createAdminClient();
        await supabase.from("profiles").upsert({
          id: userId,
          is_pro: true,
          stripe_customer_id: customerId,
        });
      }
    }

    return NextResponse.json({ paid });
  } catch (err) {
    console.error("[checkout/verify] Stripe error:", err);
    return NextResponse.json({ paid: false });
  }
}
