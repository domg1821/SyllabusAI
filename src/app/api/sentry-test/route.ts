import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic";

export async function GET() {
  const eventId = Sentry.captureMessage("Sentry test — /api/sentry-test was called", "info");

  return NextResponse.json({
    ok: true,
    sentryEventId: eventId,
    message: "Test event sent to Sentry. Check your Sentry dashboard in a few seconds.",
    dsn: process.env.SENTRY_DSN ? "configured" : "missing — set SENTRY_DSN in .env.local",
  });
}

// Separate endpoint that throws so you can verify error capture end-to-end.
export async function POST() {
  throw new Error("Sentry test error — intentional throw from /api/sentry-test");
}
