import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE() {
  // Verify the caller is authenticated
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const admin = createAdminClient();

  // Delete all user data (courses and practice_sessions cascade via FK)
  // then delete the auth user itself
  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    console.error("[account/delete] deleteUser failed:", error);
    return NextResponse.json(
      { error: "Failed to delete account. Please try again or contact support." },
      { status: 500 }
    );
  }

  return NextResponse.json({ deleted: true });
}
