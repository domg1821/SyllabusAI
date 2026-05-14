"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { usePro } from "@/lib/usePro";
import { ProBadge } from "@/components/dashboard/UpgradeModal";
import DashboardNav from "@/components/dashboard/DashboardNav";

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
      className={`rounded-2xl border bg-white p-6 shadow-sm ${
        danger ? "border-red-100" : "border-gray-200"
      }`}
    >
      <div className="mb-5 border-b pb-4 ${danger ? 'border-red-100' : 'border-gray-100'}">
        <h2
          className={`text-base font-bold ${danger ? "text-red-700" : "text-gray-900"}`}
        >
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-xs text-gray-500">{description}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

// ─── Row: label + value/action ─────────────────────────────────────────────────

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="text-sm font-medium text-gray-600">{label}</span>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter();
  const { isPro, clearPro } = usePro();

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
      const res = await fetch("/api/checkout", { method: "POST" });
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

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardNav isPro={isPro} onUpgradeClick={handleUpgrade} />

      <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-12">
        {/* Page header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Settings</h1>
            <p className="mt-1 text-sm text-gray-500">Manage your account and subscription.</p>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-indigo-500 transition-colors"
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
                <div className="h-4 w-48 animate-pulse rounded-full bg-gray-200" />
              ) : (
                <span className="text-sm text-gray-700">{userEmail ?? "—"}</span>
              )}
            </Row>

            <Row label="Password">
              <div className="flex flex-col items-end gap-1.5">
                <button
                  onClick={handlePasswordReset}
                  disabled={resetLoading || resetSent || !userEmail}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                >
                  {resetLoading
                    ? "Sending…"
                    : resetSent
                      ? "Email sent ✓"
                      : "Send password reset email"}
                </button>
                {resetSent && (
                  <p className="text-xs text-emerald-600">
                    Check your inbox for a reset link.
                  </p>
                )}
                {resetError && (
                  <p className="text-xs text-red-600">{resetError}</p>
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
                <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-semibold text-gray-500">
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
                      <p className="max-w-xs text-right text-xs text-red-600">{portalError}</p>
                    )}
                  </div>
                </Row>

                <div className="flex items-start gap-2.5 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  </svg>
                  <div>
                    <p className="text-xs text-gray-600">
                      Billing, cancellation, and payment updates are handled securely through{" "}
                      <span className="font-semibold">Stripe</span>. Click{" "}
                      <em>Manage subscription</em> to open the Stripe customer portal.
                    </p>
                    <p className="mt-1.5 text-xs text-gray-400">
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
                          Upgrade to Pro — $5/month
                        </>
                      )}
                    </button>
                    {checkoutError && (
                      <p className="text-xs text-red-600">{checkoutError}</p>
                    )}
                  </div>
                </Row>

                <div className="flex items-start gap-2.5 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                  <p className="text-xs text-indigo-700">
                    Pro includes unlimited analyses, smart study plans, multiple course tracking, and priority AI. Cancel anytime from the Stripe portal.
                  </p>
                </div>
              </>
            )}
          </Section>

          {/* ── Preferences ── */}
          <Section
            title="Preferences"
            description="App preferences and customization options."
          >
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-4">
              <svg className="h-4 w-4 shrink-0 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
              <p className="text-xs text-gray-400">
                Additional preferences — such as notification settings and display options — are coming soon.
              </p>
            </div>
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
                className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
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
                <span className="text-xs text-gray-400">
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
        <p className="mt-8 text-center text-xs text-gray-400">
          SyllabusAI · For questions, contact{" "}
          <a href="mailto:support@syllabusai.com" className="hover:text-gray-600 transition-colors">
            support@syllabusai.com
          </a>
        </p>
      </main>
    </div>
  );
}
