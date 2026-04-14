import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ paid: false });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ paid: false });
  }

  const stripe = new Stripe(secretKey, {
    apiVersion: "2026-03-25.dahlia",
  });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paid =
      session.payment_status === "paid" ||
      session.status === "complete";

    return NextResponse.json({ paid });
  } catch (err) {
    console.error("[checkout/verify] Stripe error:", err);
    return NextResponse.json({ paid: false });
  }
}
