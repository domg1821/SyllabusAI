import Link from "next/link";
import { PRO_PRICE_MONTHLY } from "@/lib/constants";

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
  "Priority support",
];

export default function Pricing() {
  return (
    <section id="pricing" className="bg-gray-50 py-24">
      <div className="mx-auto max-w-4xl px-6">
        <div className="mb-14 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-600">
            Pricing
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Free to start. Pro when you need it.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-gray-500">
            Try everything free — upgrade when you want unlimited access and study plans.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Free */}
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-widest text-gray-400">Free</p>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-gray-900">$0</span>
                <span className="text-sm text-gray-400">forever</span>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Perfect for trying out the app or a light semester.
              </p>
            </div>
            <ul className="mb-8 space-y-3">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  <span className="text-sm text-gray-600">{f}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/dashboard"
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
                <span className="text-4xl font-extrabold text-gray-900">${PRO_PRICE_MONTHLY}</span>
                <span className="text-sm text-gray-400">/ month</span>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                For students who want to stay on top of every course.
              </p>
            </div>
            <ul className="mb-8 space-y-3">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  <span className="text-sm text-gray-700 font-medium">{f}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/dashboard"
              className="block w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-center text-sm font-bold text-white shadow-sm hover:opacity-90 transition-opacity"
            >
              Start free, upgrade anytime
            </Link>
            <p className="mt-3 text-center text-xs text-gray-400">Cancel anytime. No commitment.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
