import Link from "next/link";
import { PRO_PRICE_MONTHLY } from "@/lib/constants";
import AnimateIn from "@/components/AnimateIn";

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
    <section id="pricing" className="bg-gray-50 dark:bg-slate-900 py-24">
      <div className="mx-auto max-w-4xl px-6">
        <AnimateIn direction="up">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              Pricing
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-50 sm:text-4xl">
              Free to start. Pro when you need it.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-gray-500 dark:text-slate-400">
              Try everything free — upgrade when you want unlimited access and study plans.
            </p>
          </div>
        </AnimateIn>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Free */}
          <AnimateIn direction="left" delay={100}>
            <div className="h-full rounded-2xl border border-gray-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-8 shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all duration-200">
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
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-gray-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
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
          </AnimateIn>

          {/* Pro */}
          <AnimateIn direction="right" delay={100}>
            <div className="relative h-full rounded-2xl border-2 border-indigo-500 dark:border-indigo-600 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-8 shadow-md hover:shadow-2xl hover:scale-[1.01] transition-all duration-200">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-3 py-1 text-xs font-bold text-white shadow">
                  Most popular
                </span>
              </div>
              <div className="mb-6">
                <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Pro</p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-gray-900 dark:text-slate-50">${PRO_PRICE_MONTHLY}</span>
                  <span className="text-sm text-gray-400 dark:text-slate-500">/ month</span>
                </div>
                <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
                  For students who want to stay on top of every course.
                </p>
              </div>
              <ul className="mb-8 space-y-3">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    <span className="text-sm text-gray-700 dark:text-slate-200 font-medium">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/dashboard"
                className="btn-shimmer block w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-center text-sm font-bold text-white shadow-sm hover:opacity-90 hover:shadow-md transition-all duration-200"
              >
                Start free, upgrade anytime
              </Link>
              <p className="mt-3 text-center text-xs text-gray-400 dark:text-slate-500">Cancel anytime. No commitment.</p>
            </div>
          </AnimateIn>
        </div>
      </div>
    </section>
  );
}
