import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!sig || !webhookSecret || !secretKey) {
    return NextResponse.json(
      { error: "Webhook not configured." },
      { status: 400 }
    );
  }

  // Stripe requires the raw body bytes for signature verification —
  // do NOT parse as JSON before this call.
  const body = await req.text();

  let event: Stripe.Event;
  try {
    const stripe = new Stripe(secretKey, { apiVersion: "2026-03-25.dahlia" });
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("[webhook/stripe] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    // ── Subscription activated (checkout complete) ───────────────────────────
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      // user_id is embedded in metadata when we create the checkout session
      const userId = session.metadata?.user_id;
      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : (session.customer as Stripe.Customer | null)?.id ?? null;

      if (userId) {
        // Try update first (won't disturb other columns), fall back to upsert.
        const { data: updated, error: updateErr } = await supabase
          .from("profiles")
          .update({ is_pro: true, stripe_customer_id: customerId })
          .eq("id", userId)
          .select("id")
          .maybeSingle();

        if (updateErr) {
          console.error("[webhook/stripe] checkout.session.completed update failed:", updateErr);
        }

        if (!updated) {
          const { error: upsertErr } = await supabase.from("profiles").upsert({
            id: userId,
            is_pro: true,
            stripe_customer_id: customerId,
          });
          if (upsertErr)
            console.error("[webhook/stripe] checkout.session.completed upsert failed:", upsertErr);
        }
      } else {
        console.warn("[webhook/stripe] checkout.session.completed missing user_id in metadata");
      }
      break;
    }

    // ── Subscription status changed (upgrade, downgrade, payment failure) ────
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      const isPro = sub.status === "active" || sub.status === "trialing";

      const { error } = await supabase
        .from("profiles")
        .update({ is_pro: isPro })
        .eq("stripe_customer_id", customerId);
      if (error)
        console.error("[webhook/stripe] subscription.updated failed:", error);
      break;
    }

    // ── Subscription cancelled ────────────────────────────────────────────────
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer.id;

      const { error } = await supabase
        .from("profiles")
        .update({ is_pro: false })
        .eq("stripe_customer_id", customerId);
      if (error)
        console.error("[webhook/stripe] subscription.deleted failed:", error);
      break;
    }

    // ── Payment failed (renewal) ──────────────────────────────────────────────
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId =
        typeof invoice.customer === "string"
          ? invoice.customer
          : (invoice.customer as Stripe.Customer | null)?.id ?? "unknown";
      console.warn(
        `[webhook/stripe] invoice.payment_failed — customer: ${customerId}, attempt: ${invoice.attempt_count}`
      );
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
