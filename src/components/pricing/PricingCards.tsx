"use client";

import { useState } from "react";
import Link from "next/link";
import {
  PRO_PRICE_MONTHLY,
  PRO_PRICE_YEARLY,
  PRO_PRICE_YEARLY_FULL,
  PRO_YEARLY_DISCOUNT_PCT,
} from "@/lib/constants";

export type BillingPeriod = "monthly" | "yearly";

const FREE_FEATURES = [
  "3 syllabus or assignment analyses",
  "Deadline extraction & grade tracker",
  "2 practice tests per week (5 questions each)",
  "This Week dashboard",
  "Calendar view",
];

const PRO_FEATURES = [
  "Unlimited syllabus & assignment analyses",
  "AI-generated weekly study plan",
  "Unlimited practice tests (up to 25 questions)",
  "Full test history & weak area tracking",
  "🧑‍🏫 Teach It Back — Feynman technique with AI feedback",
  "🗺️ Memory Map — visual concept breakdowns",
  "📋 Exam Style — exam-level questions with marking",
  "🎯 Smart study recommendations",
  "📊 Study progress dashboard & heatmap",
  "All courses & grades stored securely",
  "Priority support",
];

function CheckIcon({ accent = false }: { accent?: boolean }) {
  return (
    <svg
      className={`mt-0.5 h-4 w-4 shrink-0 ${accent ? "text-indigo-500 dark:text-indigo-400" : "text-gray-400 dark:text-slate-500"}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

interface Props {
  /** If provided, clicking Pro CTA calls this instead of navigating to /dashboard */
  onUpgradeClick?: (period: BillingPeriod) => void;
  /** Variant changes how cards look (landing = soft glass, full = solid white) */
  variant?: "landing" | "full";
}

export default function PricingCards({ onUpgradeClick, variant = "landing" }: Props) {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");

  const isYearly = period === "yearly";
  const monthlyEquiv = (PRO_PRICE_YEARLY / 12).toFixed(2); // 3.75

  const cardBase =
    variant === "landing"
      ? "h-full rounded-2xl backdrop-blur-sm p-8 shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all duration-200"
      : "h-full rounded-2xl p-8 shadow-sm";

  return (
    <div>
      {/* ── Billing toggle ── */}
      <div className="mb-10 flex flex-col items-center gap-3">
        <div className="relative inline-flex rounded-full border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 p-1">
          {/* Sliding pill */}
          <span
            aria-hidden
            className={`absolute top-1 h-[calc(100%-8px)] w-[calc(50%-4px)] rounded-full bg-white dark:bg-slate-700 shadow-sm transition-all duration-200 ease-out ${
              isYearly ? "left-[calc(50%+0px)]" : "left-1"
            }`}
          />
          <button
            onClick={() => setPeriod("monthly")}
            className={`relative z-10 rounded-full px-5 py-1.5 text-sm font-semibold transition-colors duration-150 ${
              !isYearly
                ? "text-gray-900 dark:text-slate-100"
                : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setPeriod("yearly")}
            className={`relative z-10 flex items-center gap-2 rounded-full px-5 py-1.5 text-sm font-semibold transition-colors duration-150 ${
              isYearly
                ? "text-gray-900 dark:text-slate-100"
                : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
            }`}
          >
            Yearly
            <span className="inline-flex items-center rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white leading-none">
              {PRO_YEARLY_DISCOUNT_PCT}% OFF
            </span>
          </button>
        </div>
        {isYearly && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium animate-tab-fade-in">
            🎉 You save ${PRO_PRICE_YEARLY_FULL - PRO_PRICE_YEARLY} a year — that&apos;s {PRO_YEARLY_DISCOUNT_PCT}% off the monthly price
          </p>
        )}
      </div>

      {/* ── Cards ── */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Free */}
        <div className={`${cardBase} border border-gray-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80`}>
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-500">Free</p>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-gray-900 dark:text-slate-50">$0</span>
              <span className="text-sm text-gray-400 dark:text-slate-500">forever</span>
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
              Perfect for trying out the app or a light semester.
            </p>
          </div>
          <ul className="mb-8 space-y-3">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5">
                <CheckIcon />
                <span className="text-sm text-gray-600 dark:text-slate-300">{f}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/dashboard"
            className="block w-full rounded-xl border border-gray-200 dark:border-slate-600 py-3 text-center text-sm font-semibold text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 hover:border-gray-300 dark:hover:border-slate-500 transition-all duration-200"
          >
            Get started free
          </Link>
        </div>

        {/* Pro */}
        <div className={`relative ${cardBase} border-2 border-indigo-500 dark:border-indigo-500 bg-white/90 dark:bg-slate-800/90`}>
          {/* Badge */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
            {isYearly ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-1 text-xs font-bold text-white shadow animate-tab-fade-in">
                🏷️ Save {PRO_YEARLY_DISCOUNT_PCT}% — Best value
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-3 py-1 text-xs font-bold text-white shadow">
                Most popular
              </span>
            )}
          </div>

          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Pro</p>

            {/* Price display */}
            {isYearly ? (
              <div className="mt-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-gray-900 dark:text-slate-50">${PRO_PRICE_YEARLY}</span>
                  <span className="text-sm text-gray-400 dark:text-slate-500">/ year</span>
                  <span className="rounded-md bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 line-through decoration-red-400">
                    ${PRO_PRICE_YEARLY_FULL}
                  </span>
                </div>
                <p className="mt-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                  = ${monthlyEquiv}/mo — {PRO_YEARLY_DISCOUNT_PCT}% cheaper than monthly
                </p>
              </div>
            ) : (
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-gray-900 dark:text-slate-50">${PRO_PRICE_MONTHLY}</span>
                <span className="text-sm text-gray-400 dark:text-slate-500">/ month</span>
              </div>
            )}

            <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
              {isYearly
                ? "Billed once a year. Lock in the student rate."
                : "For students who want to stay on top of every course."}
            </p>
          </div>

          <ul className="mb-8 space-y-3">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5">
                <CheckIcon accent />
                <span className="text-sm text-gray-700 dark:text-slate-200 font-medium">{f}</span>
              </li>
            ))}
          </ul>

          {onUpgradeClick ? (
            <button
              onClick={() => onUpgradeClick(period)}
              className="btn-shimmer block w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-center text-sm font-bold text-white shadow-sm hover:opacity-90 hover:shadow-md transition-all duration-200"
            >
              {isYearly
                ? `Get Pro — $${PRO_PRICE_YEARLY}/year`
                : `Get Pro — $${PRO_PRICE_MONTHLY}/month`}
            </button>
          ) : (
            <Link
              href="/dashboard"
              className="btn-shimmer block w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-center text-sm font-bold text-white shadow-sm hover:opacity-90 hover:shadow-md transition-all duration-200"
            >
              Start free, upgrade anytime
            </Link>
          )}
          <p className="mt-3 text-center text-xs text-gray-400 dark:text-slate-500">
            {isYearly ? "One-time yearly charge · Cancel anytime" : "Cancel anytime. No commitment."}
          </p>
        </div>
      </div>
    </div>
  );
}
