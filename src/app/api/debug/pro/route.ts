import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Temporary diagnostic endpoint — DELETE AFTER USE.
 * Visit /api/debug/pro to see your exact Pro status from all sources.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated", authError: authError?.message });
  }

  const serviceKeyConfigured = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Regular client (anon key + RLS)
  const { data: regularProfile, error: regularError } = await supabase
    .from("profiles").select("is_pro, analysis_count, stripe_customer_id").eq("id", user.id).single();

  // Admin client (service role, bypasses RLS)
  let adminProfile = null;
  let adminError = null;
  if (serviceKeyConfigured) {
    const admin = createAdminClient();
    const result = await admin
      .from("profiles").select("is_pro, analysis_count, stripe_customer_id").eq("id", user.id).single();
    adminProfile = result.data;
    adminError = result.error?.message ?? null;
  }

  return NextResponse.json({
    userId: user.id,
    email: user.email,
    serviceKeyConfigured,
    regularClient: {
      profile: regularProfile,
      error: regularError?.message ?? null,
    },
    adminClient: serviceKeyConfigured
      ? { profile: adminProfile, error: adminError }
      : { skipped: "SUPABASE_SERVICE_ROLE_KEY not set" },
  });
}
