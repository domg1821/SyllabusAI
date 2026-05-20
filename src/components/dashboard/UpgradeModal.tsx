"use client";

import React, { useEffect, useState } from "react";
import {
  PRO_PRICE_MONTHLY,
  PRO_PRICE_YEARLY,
  PRO_PRICE_YEARLY_FULL,
  PRO_YEARLY_DISCOUNT_PCT,
} from "@/lib/constants";
import type { BillingPeriod } from "@/components/pricing/PricingCards";

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
  "Teach It Back, Memory Map & Exam Style modes",
  "Full practice test history & weak area tracking",
  "Study progress dashboard & heatmap",
  "Track multiple courses at once",
];

interface Props {
  open: boolean;
  onClose: () => void;
  /** Pre-select a billing period (e.g. when user clicks a specific plan CTA) */
  defaultPeriod?: BillingPeriod;
}

export default function UpgradeModal({ open, onClose, defaultPeriod = "monthly" }: Props) {
  const [loading, setLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [period, setPeriod] = useState<BillingPeriod>(defaultPeriod);

  const isYearly = period === "yearly";
  const monthlyEquiv = (PRO_PRICE_YEARLY / 12).toFixed(2);

  // Reset state only when the modal opens — NOT when loading changes
  useEffect(() => {
    if (!open) return;
    setCheckoutError(null);
    setPeriod(defaultPeriod);
  }, [open, defaultPeriod]);

  // Escape key — separate effect so it never triggers a period reset
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function handleCheckout() {
    setLoading(true);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingPeriod: period }),
      });
      const json = await res.json();

      if (!res.ok || !json.sessionId) {
        setCheckoutError(json.error ?? "Could not start checkout. Please try again.");
        return;
      }

      if (!json.url) {
        setCheckoutError("Could not start checkout. Please try again.");
        return;
      }

      window.location.href = json.url;
    } catch {
      setCheckoutError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={() => { if (!loading) onClose(); }}
      />

      {/* Panel */}
      <div className="relative w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200 max-h-[95dvh] overflow-y-auto">
        {/* Close */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40 transition-colors"
          aria-label="Close"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="mb-5 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-200">
              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Upgrade to Pro</h2>
            <p className="mt-1 text-sm text-gray-500">
              Everything you need to get through the semester — stress-free.
            </p>
          </div>

          {/* ── Billing toggle ── */}
          <div className="mb-5 flex justify-center">
            <div className="relative inline-flex rounded-full border border-gray-200 bg-gray-100 p-1">
              {/* Sliding pill — anchored left, slides right by its own width */}
              <span
                aria-hidden
                className="absolute left-1 top-1 h-[calc(100%-8px)] w-[calc(50%-4px)] rounded-full bg-white shadow-sm transition-transform duration-200 ease-out"
                style={{ transform: isYearly ? "translateX(100%)" : "translateX(0)" }}
              />
              <button
                onClick={() => setPeriod("monthly")}
                disabled={loading}
                className={`relative z-10 w-24 rounded-full py-1.5 text-sm font-semibold transition-colors duration-150 ${
                  !isYearly ? "text-gray-900" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setPeriod("yearly")}
                disabled={loading}
                className={`relative z-10 flex w-24 items-center justify-center gap-1.5 rounded-full py-1.5 text-sm font-semibold transition-colors duration-150 ${
                  isYearly ? "text-gray-900" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Yearly
                <span className="inline-flex items-center rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
                  {PRO_YEARLY_DISCOUNT_PCT}%
                </span>
              </button>
            </div>
          </div>

          {/* ── Price box ── */}
          <div className={`mb-5 rounded-xl p-4 text-center ring-1 transition-colors ${
            isYearly
              ? "bg-gradient-to-br from-emerald-50 to-teal-50 ring-emerald-200"
              : "bg-gradient-to-br from-indigo-50 to-violet-50 ring-indigo-100"
          }`}>
            {isYearly ? (
              <>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-4xl font-extrabold text-gray-900">${PRO_PRICE_YEARLY}</span>
                  <span className="text-base text-gray-500">/ year</span>
                  <span className="rounded-md bg-white px-1.5 py-0.5 text-xs font-bold text-gray-400 line-through">
                    ${PRO_PRICE_YEARLY_FULL}
                  </span>
                </div>
                <p className="mt-1 text-sm font-semibold text-emerald-700">
                  = ${monthlyEquiv}/mo — you save ${PRO_PRICE_YEARLY_FULL - PRO_PRICE_YEARLY} a year
                </p>
                <p className="mt-0.5 text-xs font-medium text-emerald-600 uppercase tracking-wide">
                  Best value · Billed once yearly · Cancel anytime
                </p>
              </>
            ) : (
              <>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-extrabold text-gray-900">${PRO_PRICE_MONTHLY}</span>
                  <span className="text-base text-gray-500">/ month</span>
                </div>
                <p className="mt-1 text-xs font-semibold text-indigo-600 uppercase tracking-wide">
                  Student pricing · Cancel anytime
                </p>
              </>
            )}
          </div>

          {/* Features */}
          <ul className="mb-5 space-y-2.5">
            {FEATURES.map((f, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100">
                  <svg className="h-3 w-3 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
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
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white shadow-md hover:opacity-90 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed transition-all ${
              isYearly
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-200"
                : "bg-gradient-to-r from-indigo-500 to-violet-600 shadow-indigo-200"
            }`}
          >
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Redirecting to checkout…
              </>
            ) : isYearly ? (
              `Get Pro — $${PRO_PRICE_YEARLY}/year`
            ) : (
              `Get Pro — $${PRO_PRICE_MONTHLY}/month`
            )}
          </button>
          {/* Trust row */}
          <div className="mt-3 flex items-center justify-center gap-3">
            {/* Stripe badge */}
            <a
              href="https://stripe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-500 hover:border-gray-300 transition-colors"
              aria-label="Payments secured by Stripe"
            >
              <svg className="h-3.5 w-3.5 text-[#635bff]" viewBox="0 0 60 25" fill="currentColor" aria-hidden>
                <path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 0 1-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 2.9 5.96 7.24l-.06 1.74zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.3c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-4.12.87V5.57h3.76l.08 1.02a4.7 4.7 0 0 1 3.23-1.29c2.9 0 5.62 2.6 5.62 7.4 0 5.23-2.7 7.6-5.65 7.6zM40 8.95c-.95 0-1.54.34-1.97.81l.02 6.12c.4.44.98.78 1.95.78 1.52 0 2.54-1.65 2.54-3.87 0-2.15-1.04-3.84-2.54-3.84zM28.24 5.57h4.13v14.44h-4.13V5.57zm0-4.7L32.37 0v3.36l-4.13.88V.87zm-4.32 9.35v9.79H19.8V5.57h3.7l.12 1.22c1-1.77 2.96-1.49 3.57-1.22v3.79c-.59-.28-2.67-.41-3.27 1.06zm-8.55 4.72c0 2.43 2.6 1.68 3.12 1.46v3.36c-.55.3-1.54.54-2.89.54a4.15 4.15 0 0 1-4.27-4.24l.01-13.17 4.02-.86v3.54h3.14V9.1h-3.13v5.84zm-4.92 2.45c-.42 1.84-2.12 2.76-4.4 2.76-2.71 0-4.74-1.3-4.74-4.51V5.57h4.12V18c0 1.08.81 1.56 1.63 1.56.85 0 1.57-.48 1.57-1.56V5.57h4.12v14.44h-3.71l-.59-2.02z"/>
              </svg>
              <span>Secured by Stripe</span>
            </a>
            <span className="text-gray-200">·</span>
            <span className="text-[11px] text-gray-400">30-day money-back guarantee</span>
          </div>
        </div>
      </div>
    </div>
  );
}
