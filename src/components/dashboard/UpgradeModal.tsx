"use client";

import React, { useEffect, useState } from "react";

// ─── Pro Badge ─────────────────────────────────────────────────────────────────

export function ProBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white ${className}`}
    >
      ⚡ Pro
    </span>
  );
}

// ─── Locked Feature Card ───────────────────────────────────────────────────────

export function LockedFeatureCard({
  title,
  description = "Unlock with SyllabusAI Pro",
  onUpgrade,
  preview,
}: {
  title: string;
  description?: string;
  onUpgrade: () => void;
  preview?: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Blurred content preview */}
      {preview && (
        <div className="pointer-events-none select-none blur-[3px] opacity-40">
          {preview}
        </div>
      )}

      {/* Lock overlay */}
      <div
        className={`${
          preview ? "absolute inset-0" : "py-10"
        } flex flex-col items-center justify-center gap-3 bg-white/80 px-6 text-center backdrop-blur-[1px]`}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-50 to-violet-100 ring-1 ring-indigo-100">
          <svg
            className="h-5 w-5 text-indigo-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
            />
          </svg>
        </div>

        <div>
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-sm font-semibold text-gray-900">{title}</span>
            <ProBadge />
          </div>
          <p className="mt-0.5 text-xs text-gray-500">{description}</p>
        </div>

        <button
          onClick={onUpgrade}
          className="rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
        >
          Upgrade to Pro
        </button>
      </div>
    </div>
  );
}

// ─── Upgrade Modal ─────────────────────────────────────────────────────────────

const FEATURES = [
  "Unlimited syllabus & assignment analyses",
  "Smart weekly study plan generation",
  "Full assignment breakdown with step-by-step action plan",
  "Track multiple courses at once",
  "Priority AI processing",
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function UpgradeModal({ open, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setCheckoutError(null);
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, loading]);

  if (!open) return null;

  async function handleCheckout() {
    setLoading(true);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const json = await res.json();

      if (!res.ok || !json.url) {
        setCheckoutError(json.error ?? "Could not start checkout. Please try again.");
        return;
      }

      // Navigate to Stripe Checkout — page will leave, no need to close modal
      window.location.href = json.url;
    } catch {
      setCheckoutError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => { if (!loading) onClose(); }}
      />

      {/* Panel */}
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200">
        {/* Close */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40 transition-colors"
          aria-label="Close"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-200">
              <svg
                className="h-7 w-7 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Upgrade to Pro</h2>
            <p className="mt-1.5 text-sm text-gray-500">
              Everything you need to get through the semester — stress-free.
            </p>
          </div>

          {/* Pricing */}
          <div className="mb-6 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 p-5 text-center ring-1 ring-indigo-100">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-extrabold text-gray-900">$5</span>
              <span className="text-base text-gray-500">/ month</span>
            </div>
            <p className="mt-1 text-xs font-semibold text-indigo-600 uppercase tracking-wide">
              Student pricing · Cancel anytime
            </p>
          </div>

          {/* Features */}
          <ul className="mb-6 space-y-3">
            {FEATURES.map((f, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100">
                  <svg
                    className="h-3 w-3 text-indigo-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>
                <span className="text-sm text-gray-700">{f}</span>
              </li>
            ))}
          </ul>

          {/* Checkout error */}
          {checkoutError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {checkoutError}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 py-3 text-sm font-bold text-white shadow-md shadow-indigo-200 hover:opacity-90 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Redirecting to checkout…
              </>
            ) : (
              "Upgrade to Pro — $5/month"
            )}
          </button>
          <p className="mt-3 text-center text-xs text-gray-400">
            Secure checkout via Stripe · Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
}
