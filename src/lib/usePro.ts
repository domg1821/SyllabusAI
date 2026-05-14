import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { FREE_LIMIT } from "@/lib/constants";

export { FREE_LIMIT };

/**
 * Manages Pro subscription status and analysis usage from Supabase profiles table.
 *
 * Sources of truth:
 *   is_pro          — set exclusively by Stripe webhook → profiles.is_pro
 *   analysis_count  — incremented server-side in /api/analyze after each success
 *
 * Client state is optimistic: recordAnalysis() updates the local counter
 * immediately so the UI feels instant. On next mount the DB value is loaded.
 */
export function usePro() {
  const supabase = useMemo(() => createClient(), []);

  const [isPro, setIsPro] = useState(false);
  const [proLoading, setProLoading] = useState(true);
  const [analysisCount, setAnalysisCount] = useState(0);

  // Tracks whether Pro was explicitly activated this session (e.g. after checkout).
  // Prevents a slow/stale initial DB load from overwriting a manual activation.
  const proActivatedRef = useRef(false);

  // ── Initial load ────────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelled) setProLoading(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("is_pro, analysis_count")
        .eq("id", user.id)
        .single();

      if (!cancelled) {
        const isProFromDb = data?.is_pro ?? false;
        // Don't let a stale initial-load false overwrite a manual activation
        // that already happened (e.g. activatePro fired before this resolved).
        if (isProFromDb || !proActivatedRef.current) {
          setIsPro(isProFromDb);
        }
        setAnalysisCount(data?.analysis_count ?? 0);
        setProLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  /**
   * Immediately set Pro = true without a DB round-trip.
   * Safe to call as soon as the verify endpoint confirms payment.
   */
  const activatePro = useCallback(() => {
    proActivatedRef.current = true;
    setIsPro(true);
  }, []);

  /**
   * Re-fetch both is_pro and analysis_count from Supabase.
   * Called after activatePro() as a DB confirmation step.
   * On query error: keeps existing state rather than resetting.
   */
  const refreshPro = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("is_pro, analysis_count")
      .eq("id", user.id)
      .single();

    if (error) {
      console.warn("[usePro] refreshPro failed:", error.message);
      return;
    }

    const isProFromDb = data?.is_pro ?? false;
    // Same guard as initial load: a false DB read must not override a manual
    // activation (e.g. activatePro() fired just before refreshPro resolved).
    // This matters when there is any lag between the verify upsert and a
    // subsequent Supabase read (replica lag, connection reuse, etc.).
    if (isProFromDb || !proActivatedRef.current) {
      proActivatedRef.current = isProFromDb;
      setIsPro(isProFromDb);
    }
    setAnalysisCount(data?.analysis_count ?? 0);
  }, [supabase]);

  /**
   * Clear Pro status locally and in DB.
   * Used when a user has already cancelled via Stripe and wants immediate UI update.
   */
  const clearPro = useCallback(async () => {
    proActivatedRef.current = false;
    setIsPro(false); // optimistic
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({ is_pro: false })
        .eq("id", user.id);
    }
  }, [supabase]);

  /**
   * Optimistic local increment — called by the dashboard after a successful
   * /api/analyze response. The server already incremented the DB count;
   * this just keeps the local display in sync without a round-trip.
   */
  const recordAnalysis = useCallback(() => {
    setAnalysisCount((c) => c + 1);
  }, []);

  return {
    isPro,
    proLoading,
    activatePro,
    refreshPro,
    clearPro,
    canAnalyze: isPro || analysisCount < FREE_LIMIT,
    remainingFree: Math.max(0, FREE_LIMIT - analysisCount),
    analysisCount,
    recordAnalysis,
  };
}
