"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Props {
  className?: string;
  children?: React.ReactNode;
}

export default function LogoutButton({ className = "", children }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={className}
    >
      {children ?? (loading ? "Signing out…" : "Sign out")}
    </button>
  );
}
