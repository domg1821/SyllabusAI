"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { usePro } from "@/lib/usePro";
import { ProBadge } from "@/components/dashboard/UpgradeModal";
import { PRO_PRICE_MONTHLY, PRO_PRICE_YEARLY } from "@/lib/constants";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { useTheme } from "@/components/ThemeProvider";
import { Difficulty } from "@/lib/types";
import { getStudySessions } from "@/lib/useStudySessions";

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
        checked ? "bg-indigo-600" : "bg-gray-200 dark:bg-slate-600"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

// ─── Section card wrapper ──────────────────────────────────────────────────────

function Section({
  title,
  description,
  children,
  danger,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border bg-white dark:bg-slate-800 p-6 shadow-sm ${
        danger ? "border-red-100 dark:border-red-900/40" : "border-gray-200 dark:border-slate-700"
      }`}
    >
      <div className={`mb-5 border-b pb-4 ${danger ? "border-red-100 dark:border-red-900/40" : "border-gray-100 dark:border-slate-700"}`}>
        <h2
          className={`text-base font-bold ${danger ? "text-red-700 dark:text-red-400" : "text-gray-900 dark:text-slate-100"}`}
        >
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">{description}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

// ─── Row: label + value/action ─────────────────────────────────────────────────

function Row({
  label,
  sublabel,
  children,
}: {
  label: string;
  sublabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div>
        <span className="text-sm font-medium text-gray-600 dark:text-slate-300">{label}</span>
        {sublabel && <p className="text-xs text-gray-400 dark:text-slate-500">{sublabel}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter();
  const { isPro, clearPro } = usePro();
  const { theme, toggle: toggleTheme } = useTheme();

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Billing portal state
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  // Checkout / upgrade state
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Password reset state
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Sign out state
  const [signingOut, setSigningOut] = useState(false);

  // Notification preferences
  const [notifDeadlines, setNotifDeadlines] = useState(false);
  const [notifWeekly, setNotifWeekly] = useState(false);

  // Study preferences
  const [defaultDifficulty, setDefaultDifficulty] = useState<Difficulty>("medium");
  const [defaultCount, setDefaultCount] = useState(5);

  // Academic profile
  const [profileUniversity, setProfileUniversity] = useState("");
  const [profileMajor, setProfileMajor] = useState("");
  const [profileGpa, setProfileGpa] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);

  // Data & Privacy
  const [clearConfirm, setClearConfirm] = useState(false);
  const [historyCleared, setHistoryCleared] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Load user
  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      setUserEmail(data.user?.email ?? null);
      setLoadingUser(false);
    }
    load();
  }, []);

  // Load localStorage preferences
  useEffect(() => {
    try {
      setNotifDeadlines(localStorage.getItem("sai_notif_deadlines") === "true");
      setNotifWeekly(localStorage.getItem("sai_notif_weekly") === "true");
      const diff = localStorage.getItem("sai_default_difficulty") as Difficulty | null;
      if (diff && ["easy", "medium", "hard"].includes(diff)) setDefaultDifficulty(diff);
      const count = Number(localStorage.getItem("sai_default_count"));
      if (count >= 1 && count <= 25) setDefaultCount(count);
      setProfileUniversity(localStorage.getItem("sai_profile_university") ?? "");
      setProfileMajor(localStorage.getItem("sai_profile_major") ?? "");
      setProfileGpa(localStorage.getItem("sai_profile_gpa") ?? "");
    } catch {}
  }, []);

  // ── Actions ──────────────────────────────────────────────────────────────

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  async function handlePasswordReset() {
    if (!userEmail) return;
    setResetLoading(true);
    setResetError(null);
    setResetSent(false);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
      redirectTo: `${window.location.origin}/settings`,
    });

    if (error) {
      setResetError(error.message);
    } else {
      setResetSent(true);
    }
    setResetLoading(false);
  }

  async function handleUpgrade() {
    setCheckoutLoading(true);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingPeriod: "monthly" }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) {
        setCheckoutError(json.error ?? "Could not start checkout. Please try again.");
        return;
      }
      window.location.href = json.url;
    } catch {
      setCheckoutError("Network error. Please check your connection and try again.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function handleManageSubscription() {
    if (!userEmail) return;
    setPortalLoading(true);
    setPortalError(null);
    try {
      const res = await fetch("/api/billing-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setPortalError(json.error ?? "Failed to open billing portal. Please try again.");
        return;
      }
      window.location.href = json.url;
    } catch {
      setPortalError("Network error. Please check your connection and try again.");
    } finally {
      setPortalLoading(false);
    }
  }

  function toggleNotifDeadlines() {
    const next = !notifDeadlines;
    setNotifDeadlines(next);
    try { localStorage.setItem("sai_notif_deadlines", String(next)); } catch {}
  }

  function toggleNotifWeekly() {
    const next = !notifWeekly;
    setNotifWeekly(next);
    try { localStorage.setItem("sai_notif_weekly", String(next)); } catch {}
  }

  function handleDifficultyChange(d: Difficulty) {
    setDefaultDifficulty(d);
    try { localStorage.setItem("sai_default_difficulty", d); } catch {}
  }

  function handleCountChange(c: number) {
    setDefaultCount(c);
    try { localStorage.setItem("sai_default_count", String(c)); } catch {}
  }

  function saveProfile() {
    try {
      localStorage.setItem("sai_profile_university", profileUniversity.trim());
      localStorage.setItem("sai_profile_major", profileMajor.trim());
      localStorage.setItem("sai_profile_gpa", profileGpa.trim());
    } catch {}
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  }

  async function handleExportData() {
    setExporting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      let courses: unknown[] = [];
      if (user) {
        const { data } = await supabase.from("courses").select("*").eq("user_id", user.id);
        courses = data ?? [];
      }
      const studySessions = getStudySessions();
      const payload = {
        exportedAt: new Date().toISOString(),
        courses,
        studySessions,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `syllabusai-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  function handleClearHistory() {
    try {
      localStorage.removeItem("sai_study_sessions");
      localStorage.removeItem("sai_test_history");
    } catch {}
    setHistoryCleared(true);
    setClearConfirm(false);
    setTimeout(() => setHistoryCleared(false), 3500);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const DIFFICULTIES: { value: Difficulty; label: string }[] = [
    { value: "easy", label: "Easy" },
    { value: "medium", label: "Medium" },
    { value: "hard", label: "Hard" },
  ];

  const COUNT_OPTIONS = [5, 10, 15, 20];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col">
      <DashboardNav isPro={isPro} onUpgradeClick={handleUpgrade} />

      <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Page header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-slate-100">Settings</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Manage your account, preferences, and data.</p>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-indigo-500 dark:text-slate-500 dark:hover:text-indigo-400 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Back to dashboard
          </Link>
        </div>

        <div className="space-y-5">
          {/* ── Account ── */}
          <Section
            title="Account"
            description="Your sign-in information and security settings."
          >
            <Row label="Email address">
              {loadingUser ? (
                <div className="h-4 w-48 animate-pulse rounded-full bg-gray-200 dark:bg-slate-700" />
              ) : (
                <span className="text-sm text-gray-700 dark:text-slate-300">{userEmail ?? "—"}</span>
              )}
            </Row>

            <Row label="Password">
              <div className="flex flex-col items-end gap-1.5">
                <button
                  onClick={handlePasswordReset}
                  disabled={resetLoading || resetSent || !userEmail}
                  className="rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-slate-200 hover:border-gray-300 dark:hover:border-slate-500 hover:bg-gray-50 dark:hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                >
                  {resetLoading
                    ? "Sending…"
                    : resetSent
                      ? "Email sent ✓"
                      : "Send password reset email"}
                </button>
                {resetSent && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                    Check your inbox for a reset link.
                  </p>
                )}
                {resetError && (
                  <p className="text-xs text-red-600 dark:text-red-400">{resetError}</p>
                )}
              </div>
            </Row>
          </Section>

          {/* ── Plan & Billing ── */}
          <Section
            title="Plan & Billing"
            description="Manage your subscription and payment details."
          >
            <Row label="Current plan">
              {isPro ? (
                <ProBadge className="px-3 py-1 text-xs" />
              ) : (
                <span className="rounded-full border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 px-2.5 py-0.5 text-xs font-semibold text-gray-500 dark:text-slate-400">
                  Free
                </span>
              )}
            </Row>

            {isPro ? (
              <>
                <Row label="Subscription">
                  <div className="flex flex-col items-end gap-1.5">
                    <button
                      onClick={handleManageSubscription}
                      disabled={portalLoading || !userEmail}
                      className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                    >
                      {portalLoading ? (
                        <>
                          <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Opening portal…
                        </>
                      ) : (
                        <>
                          Manage subscription
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                          </svg>
                        </>
                      )}
                    </button>
                    {portalError && (
                      <p className="max-w-xs text-right text-xs text-red-600 dark:text-red-400">{portalError}</p>
                    )}
                  </div>
                </Row>

                <div className="flex items-start gap-2.5 rounded-xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50 px-4 py-3">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-gray-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  </svg>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-slate-300">
                      Billing, cancellation, and payment updates are handled securely through{" "}
                      <span className="font-semibold">Stripe</span>. Click{" "}
                      <em>Manage subscription</em> to open the Stripe customer portal.
                    </p>
                    <p className="mt-1.5 text-xs text-gray-400 dark:text-slate-500">
                      After cancelling, your Pro access continues until the end of the current billing period.{" "}
                      <button
                        onClick={clearPro}
                        className="font-medium text-indigo-500 hover:text-indigo-600 underline underline-offset-2 transition-colors"
                      >
                        Already cancelled? Clear Pro status now.
                      </button>
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Row label="Upgrade">
                  <div className="flex flex-col items-end gap-1.5">
                    <button
                      onClick={handleUpgrade}
                      disabled={checkoutLoading}
                      className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 transition-opacity"
                    >
                      {checkoutLoading ? (
                        <>
                          <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Redirecting…
                        </>
                      ) : (
                        <>
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                          </svg>
                          Upgrade to Pro — ${PRO_PRICE_MONTHLY}/mo or ${PRO_PRICE_YEARLY}/yr
                        </>
                      )}
                    </button>
                    {checkoutError && (
                      <p className="text-xs text-red-600 dark:text-red-400">{checkoutError}</p>
                    )}
                  </div>
                </Row>

                <div className="flex items-start gap-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-3">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                  <p className="text-xs text-indigo-700 dark:text-indigo-300">
                    Pro includes unlimited analyses, smart study plans, multiple course tracking, and priority AI. Cancel anytime from the Stripe portal.
                  </p>
                </div>
              </>
            )}
          </Section>

          {/* ── Preferences ── */}
          <Section
            title="Preferences"
            description="App preferences and display options."
          >
            <Row label="Appearance">
              <div className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 p-1">
                {(["light", "dark"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => { if (theme !== t) toggleTheme(); }}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                      theme === t
                        ? "bg-white dark:bg-slate-600 text-gray-900 dark:text-slate-100 shadow-sm"
                        : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
                    }`}
                  >
                    {t === "light" ? (
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                      </svg>
                    ) : (
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                      </svg>
                    )}
                    {t}
                  </button>
                ))}
              </div>
            </Row>
          </Section>

          {/* ── Notification Preferences ── */}
          <Section
            title="Notification Preferences"
            description="Choose which email notifications you'd like to receive."
          >
            <Row
              label="Deadline reminders"
              sublabel="Email me 24 hours before an assignment is due"
            >
              <Toggle checked={notifDeadlines} onChange={toggleNotifDeadlines} />
            </Row>
            <Row
              label="Weekly study summary"
              sublabel="A recap of your progress every Sunday"
            >
              <Toggle checked={notifWeekly} onChange={toggleNotifWeekly} />
            </Row>
          </Section>

          {/* ── Study Preferences ── */}
          <Section
            title="Study Preferences"
            description="Default settings pre-filled when you open the practice test builder."
          >
            <div>
              <p className="mb-2 text-sm font-medium text-gray-600 dark:text-slate-300">Default difficulty</p>
              <div className="flex gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => handleDifficultyChange(d.value)}
                    className={`flex-1 rounded-xl border py-2 text-xs font-semibold transition-all ${
                      defaultDifficulty === d.value
                        ? d.value === "easy"
                          ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-300"
                          : d.value === "medium"
                            ? "border-amber-400 bg-amber-50 dark:bg-amber-900/30 dark:border-amber-600 text-amber-700 dark:text-amber-300 ring-1 ring-amber-300"
                            : "border-red-400 bg-red-50 dark:bg-red-900/30 dark:border-red-600 text-red-700 dark:text-red-300 ring-1 ring-red-300"
                        : "border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 text-gray-600 dark:text-slate-400 hover:border-gray-300 dark:hover:border-slate-500 hover:bg-white dark:hover:bg-slate-700"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-gray-600 dark:text-slate-300">Default question count</p>
              <div className="flex gap-2">
                {COUNT_OPTIONS.map((c) => (
                  <button
                    key={c}
                    onClick={() => handleCountChange(c)}
                    className={`flex-1 rounded-xl border py-2 text-xs font-semibold transition-all ${
                      defaultCount === c
                        ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-300"
                        : "border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 text-gray-600 dark:text-slate-400 hover:border-gray-300 dark:hover:border-slate-500 hover:bg-white dark:hover:bg-slate-700"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-gray-400 dark:text-slate-500">Pro unlocks up to 25 questions per test.</p>
            </div>
          </Section>

          {/* ── Academic Profile ── */}
          <Section
            title="Academic Profile"
            description="Optional context that helps the AI personalize study plans and recommendations."
          >
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wide">University</label>
                <input
                  type="text"
                  value={profileUniversity}
                  onChange={(e) => setProfileUniversity(e.target.value)}
                  placeholder="e.g. University of Michigan"
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 px-3.5 py-2 text-sm text-gray-700 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wide">Major / Program</label>
                <input
                  type="text"
                  value={profileMajor}
                  onChange={(e) => setProfileMajor(e.target.value)}
                  placeholder="e.g. Computer Science"
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 px-3.5 py-2 text-sm text-gray-700 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wide">Current GPA</label>
                <input
                  type="text"
                  value={profileGpa}
                  onChange={(e) => setProfileGpa(e.target.value)}
                  placeholder="e.g. 3.5"
                  maxLength={5}
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 px-3.5 py-2 text-sm text-gray-700 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all"
                />
              </div>
              <button
                onClick={saveProfile}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
              >
                {profileSaved ? (
                  <>
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    Saved
                  </>
                ) : (
                  "Save profile"
                )}
              </button>
            </div>
          </Section>

          {/* ── Data & Privacy ── */}
          <Section
            title="Data & Privacy"
            description="Export or delete your personal data."
          >
            <Row label="Export my data" sublabel="Download all your courses, grades, and study sessions as JSON">
              <button
                onClick={handleExportData}
                disabled={exporting}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-slate-200 hover:border-gray-300 dark:hover:border-slate-500 hover:bg-gray-50 dark:hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              >
                {exporting ? (
                  <>
                    <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Exporting…
                  </>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    Export data
                  </>
                )}
              </button>
            </Row>

            <Row label="Study history" sublabel="Clears all study sessions and practice test history">
              <div className="flex flex-col items-end gap-1">
                <button
                  onClick={() => setClearConfirm(true)}
                  className="rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                >
                  Clear history
                </button>
                {historyCleared && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">History cleared.</p>
                )}
              </div>
            </Row>
          </Section>

          {/* ── Danger Zone ── */}
          <Section
            title="Danger Zone"
            danger
          >
            <Row label="Sign out of all devices">
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              >
                {signingOut ? (
                  <>
                    <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing out…
                  </>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
                    </svg>
                    Sign out
                  </>
                )}
              </button>
            </Row>

            <Row label="Delete account">
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs text-gray-400 dark:text-slate-500">
                  To permanently delete your account and all data, email{" "}
                  <a
                    href="mailto:support@syllabusai.com"
                    className="font-medium text-indigo-500 hover:text-indigo-600 transition-colors"
                  >
                    support@syllabusai.com
                  </a>
                </span>
              </div>
            </Row>
          </Section>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-gray-400 dark:text-slate-500">
          SyllabusAI · For questions, contact{" "}
          <a href="mailto:support@syllabusai.com" className="hover:text-gray-600 dark:hover:text-slate-300 transition-colors">
            support@syllabusai.com
          </a>
        </p>
      </main>

      {/* ── Clear history confirmation modal ── */}
      {clearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-xl border border-gray-100 dark:border-slate-700">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <svg className="h-5 w-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">Clear all study history?</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
              This will permanently delete your study sessions and practice test history. This cannot be undone.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setClearConfirm(false)}
                className="flex-1 rounded-xl border border-gray-200 dark:border-slate-600 py-2.5 text-sm font-semibold text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearHistory}
                className="flex-1 rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-white hover:bg-amber-400 transition-colors"
              >
                Clear history
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
