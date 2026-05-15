import Link from "next/link";
import LandingNav from "@/components/landing/LandingNav";
import Footer from "@/components/landing/Footer";
import FAQAccordion from "@/components/pricing/FAQAccordion";
import { PRO_PRICE_MONTHLY } from "@/lib/constants";

export const metadata = {
  title: "Pricing",
  description: `SyllabusAI is free to start. Upgrade to Pro for $${PRO_PRICE_MONTHLY}/month and unlock unlimited analyses, AI study modes, and full practice test history.`,
};

const FREE_FEATURES = [
  "3 syllabus or assignment analyses",
  "Deadline extraction & grade tracker",
  "2 practice tests per week (5 questions each)",
  "This Week dashboard",
  "Calendar view & export",
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

const COMPARISON = [
  { feature: "Deadline extraction", free: true, pro: true, gpt: false },
  { feature: "Personalized study plan", free: false, pro: true, gpt: false },
  { feature: "Practice tests", free: "2/week", pro: "Unlimited", gpt: "Manual prompting" },
  { feature: "Flashcards", free: true, pro: true, gpt: false },
  { feature: "Teach It Back (Feynman)", free: false, pro: true, gpt: false },
  { feature: "Memory Map", free: false, pro: true, gpt: false },
  { feature: "Exam-style questions", free: false, pro: true, gpt: false },
  { feature: "Knows your actual syllabus", free: true, pro: true, gpt: false },
  { feature: "Weekly deadline dashboard", free: true, pro: true, gpt: false },
  { feature: "Study progress tracking", free: false, pro: true, gpt: false },
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

function Cross() {
  return (
    <svg className="mt-0.5 h-4 w-4 shrink-0 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

function CellValue({ value }: { value: boolean | string }) {
  if (value === true) return <Check accent />;
  if (value === false) return <Cross />;
  return <span className="text-xs font-medium text-gray-600">{value}</span>;
}

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <LandingNav />

      <main className="flex-1">
        {/* Hero */}
        <div className="bg-gray-50 py-24">
          <div className="mx-auto max-w-4xl px-6">
            <div className="mb-14 text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-600">
                Pricing
              </p>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                Free to start. Pro when you need it.
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-lg text-gray-500">
                Try everything free — upgrade for unlimited access, AI study modes, and full practice test history.
              </p>
            </div>

            {/* Pricing cards */}
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
                <p className="mt-3 text-center text-xs text-gray-400">Cancel anytime · No commitment.</p>
              </div>
            </div>

            {/* Money-back guarantee */}
            <div className="mt-8 flex items-center justify-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-6 py-4">
              <span className="text-2xl">🛡️</span>
              <div>
                <p className="text-sm font-bold text-emerald-800">30-day money-back guarantee</p>
                <p className="text-xs text-emerald-700">Not happy? Email us within 30 days of your first charge and we&apos;ll refund you in full.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Comparison table */}
        <div className="bg-white py-24">
          <div className="mx-auto max-w-4xl px-6">
            <div className="mb-10 text-center">
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                How we compare
              </h2>
              <p className="mt-3 text-gray-500">SyllabusAI vs Free vs just using ChatGPT</p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="py-4 pl-6 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 w-1/2">Feature</th>
                    <th className="py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Free</th>
                    <th className="py-4 text-center text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50">Pro</th>
                    <th className="py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 pr-6">ChatGPT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {COMPARISON.map((row) => (
                    <tr key={row.feature} className="hover:bg-gray-50">
                      <td className="py-3.5 pl-6 text-sm text-gray-700">{row.feature}</td>
                      <td className="py-3.5 text-center">
                        <div className="flex justify-center"><CellValue value={row.free} /></div>
                      </td>
                      <td className="py-3.5 text-center bg-indigo-50/30">
                        <div className="flex justify-center"><CellValue value={row.pro} /></div>
                      </td>
                      <td className="py-3.5 text-center pr-6">
                        <div className="flex justify-center"><CellValue value={row.gpt} /></div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-gray-50 py-24">
          <div className="mx-auto max-w-2xl px-6">
            <div className="mb-10 text-center">
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Frequently asked questions
              </h2>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white px-6 shadow-sm">
              <FAQAccordion />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
