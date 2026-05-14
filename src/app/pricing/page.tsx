import Link from "next/link";
import LandingNav from "@/components/landing/LandingNav";
import Footer from "@/components/landing/Footer";
import { PRO_PRICE_MONTHLY } from "@/lib/constants";

export const metadata = {
  title: "Pricing",
  description: `SyllabusAI is free to start. Upgrade to Pro for $${PRO_PRICE_MONTHLY}/month and unlock unlimited analyses, study plans, and practice tests.`,
};

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
  "All courses & grades stored securely",
  "Calendar export (.ics)",
  "Priority support",
];

function Check({ accent = false }: { accent?: boolean }) {
  return (
    <svg
      className={`mt-0.5 h-4 w-4 shrink-0 ${accent ? "text-indigo-500" : "text-gray-400"}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <LandingNav />

      <main className="flex-1 bg-gray-50 py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-600">
              Pricing
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Free to start. Pro when you need it.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-gray-500">
              Try everything free — upgrade when you want unlimited access, AI study plans, and full practice test history.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Free */}
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <div className="mb-6">
                <p className="text-sm font-semibold uppercase tracking-widest text-gray-400">Free</p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold text-gray-900">$0</span>
                  <span className="text-sm text-gray-400">forever</span>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Perfect for trying out the app or a light semester.
                </p>
              </div>
              <ul className="mb-8 space-y-3">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check />
                    <span className="text-sm text-gray-600">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/sign-up"
                className="block w-full rounded-xl border border-gray-200 py-3 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Get started free
              </Link>
            </div>

            {/* Pro */}
            <div className="relative rounded-2xl border-2 border-indigo-500 bg-white p-8 shadow-md">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-3 py-1 text-xs font-bold text-white shadow">
                  Most popular
                </span>
              </div>
              <div className="mb-6">
                <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Pro</p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold text-gray-900">${PRO_PRICE_MONTHLY}</span>
                  <span className="text-sm text-gray-400">/ month</span>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  For students who want to stay on top of every course.
                </p>
              </div>
              <ul className="mb-8 space-y-3">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check accent />
                    <span className="text-sm font-medium text-gray-700">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/sign-up"
                className="block w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-center text-sm font-bold text-white shadow-sm hover:opacity-90 transition-opacity"
              >
                Start free, upgrade anytime
              </Link>
              <p className="mt-3 text-center text-xs text-gray-400">
                Cancel anytime. No commitment.
              </p>
            </div>
          </div>

          {/* FAQ strip */}
          <div className="mt-16 grid gap-6 sm:grid-cols-3">
            {[
              {
                q: "Do I need a credit card to sign up?",
                a: "No. The free plan requires no payment information.",
              },
              {
                q: "How does billing work?",
                a: `Pro is billed monthly at $${PRO_PRICE_MONTHLY}/month. You can cancel anytime from your account settings.`,
              },
              {
                q: "Is there a refund policy?",
                a: "Yes — if you're not satisfied within 7 days of your first charge, contact us for a full refund.",
              },
            ].map(({ q, a }) => (
              <div key={q}>
                <p className="text-sm font-semibold text-gray-900">{q}</p>
                <p className="mt-1.5 text-sm text-gray-500">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
