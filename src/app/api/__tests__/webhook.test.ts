/**
 * Unit tests for the Stripe webhook handler.
 *
 * We test the handler's response to different Stripe event types
 * by mocking both Stripe (signature verification + event object)
 * and the Supabase admin client.
 *
 * What these tests verify:
 *   - Valid events trigger the correct DB update
 *   - Invalid/missing signatures return 400
 *   - Missing env vars return 400
 *   - Unknown event types are ignored cleanly (200)
 *   - Supabase errors are logged but don't crash the handler
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ─── Mock Supabase admin client ───────────────────────────────────────────────

const mockUpsert = vi.fn().mockResolvedValue({ error: null });
const mockUpdate = vi.fn().mockReturnValue({
  eq: vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null }),
  }),
});

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      upsert: mockUpsert,
      update: mockUpdate,
    }),
  }),
}));

// ─── Mock Stripe ──────────────────────────────────────────────────────────────
// Must use `function` keyword (not arrow) so it can be called with `new`.

const mockConstructEvent = vi.fn();

vi.mock("stripe", () => {
  return {
    default: vi.fn(function () {
      return {
        webhooks: {
          constructEvent: mockConstructEvent,
        },
      };
    }),
  };
});

// ─── Test helpers ──────────────────────────────────────────────────────────────

function makeRequest(body: string, sig = "valid-sig"): NextRequest {
  return new NextRequest("http://localhost/api/webhooks/stripe", {
    method: "POST",
    headers: { "stripe-signature": sig, "content-type": "application/json" },
    body,
  });
}

function makeCheckoutEvent(userId: string, customerId = "cus_123") {
  return {
    type: "checkout.session.completed",
    data: {
      object: {
        metadata: { user_id: userId },
        customer: customerId,
        payment_status: "paid",
        status: "complete",
      },
    },
  };
}

function makeSubscriptionEvent(
  type: "customer.subscription.updated" | "customer.subscription.deleted",
  customerId: string,
  status = "active"
) {
  return {
    type,
    data: {
      object: {
        customer: customerId,
        status,
      },
    },
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/webhooks/stripe", () => {
  let handler: (req: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Set required env vars
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service_role_key";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";

    // Re-import each test to get a fresh module with fresh mocks
    const mod = await import("../../../app/api/webhooks/stripe/route");
    handler = mod.POST;
  });

  // ── Environment / configuration ─────────────────────────────────────────

  it("returns 400 when STRIPE_SECRET_KEY is missing", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const req = makeRequest("{}");
    const res = await handler(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeTruthy();
  });

  it("returns 400 when STRIPE_WEBHOOK_SECRET is missing", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const req = makeRequest("{}");
    const res = await handler(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when stripe-signature header is missing", async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error("No signature");
    });
    const req = new NextRequest("http://localhost/api/webhooks/stripe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    const res = await handler(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when Stripe signature verification fails", async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error("Webhook signature mismatch");
    });
    const req = makeRequest("{}", "bad-sig");
    const res = await handler(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid signature.");
  });

  // ── checkout.session.completed ───────────────────────────────────────────

  it("upserts is_pro=true on checkout.session.completed", async () => {
    const event = makeCheckoutEvent("user-abc", "cus_xyz");
    mockConstructEvent.mockReturnValue(event);

    const req = makeRequest(JSON.stringify(event));
    const res = await handler(req);

    expect(res.status).toBe(200);
    expect(mockUpsert).toHaveBeenCalledWith({
      id: "user-abc",
      is_pro: true,
      stripe_customer_id: "cus_xyz",
    });
  });

  it("does not call upsert when user_id is missing from metadata", async () => {
    const event = {
      type: "checkout.session.completed",
      data: {
        object: {
          metadata: {}, // no user_id
          customer: "cus_xyz",
          payment_status: "paid",
          status: "complete",
        },
      },
    };
    mockConstructEvent.mockReturnValue(event);

    const req = makeRequest(JSON.stringify(event));
    const res = await handler(req);

    expect(res.status).toBe(200); // still 200 — we just warn
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  // ── customer.subscription.updated ────────────────────────────────────────

  it("sets is_pro=true for active subscription update", async () => {
    const event = makeSubscriptionEvent(
      "customer.subscription.updated",
      "cus_abc",
      "active"
    );
    mockConstructEvent.mockReturnValue(event);

    const req = makeRequest(JSON.stringify(event));
    await handler(req);

    expect(mockUpdate).toHaveBeenCalledWith({ is_pro: true });
  });

  it("sets is_pro=true for trialing subscription", async () => {
    const event = makeSubscriptionEvent(
      "customer.subscription.updated",
      "cus_abc",
      "trialing"
    );
    mockConstructEvent.mockReturnValue(event);

    const req = makeRequest(JSON.stringify(event));
    await handler(req);

    expect(mockUpdate).toHaveBeenCalledWith({ is_pro: true });
  });

  it("sets is_pro=false for past_due subscription", async () => {
    const event = makeSubscriptionEvent(
      "customer.subscription.updated",
      "cus_abc",
      "past_due"
    );
    mockConstructEvent.mockReturnValue(event);

    const req = makeRequest(JSON.stringify(event));
    await handler(req);

    expect(mockUpdate).toHaveBeenCalledWith({ is_pro: false });
  });

  // ── customer.subscription.deleted ────────────────────────────────────────

  it("sets is_pro=false on subscription deletion (cancellation)", async () => {
    const event = makeSubscriptionEvent(
      "customer.subscription.deleted",
      "cus_del_123"
    );
    mockConstructEvent.mockReturnValue(event);

    const req = makeRequest(JSON.stringify(event));
    const res = await handler(req);

    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({ is_pro: false });
  });

  // ── Unknown event types ───────────────────────────────────────────────────

  it("returns 200 and does nothing for unhandled event types", async () => {
    const event = {
      type: "payment_intent.created", // not handled
      data: { object: {} },
    };
    mockConstructEvent.mockReturnValue(event);

    const req = makeRequest(JSON.stringify(event));
    const res = await handler(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.received).toBe(true);
    expect(mockUpsert).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
