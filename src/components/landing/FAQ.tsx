import Link from "next/link";
import AnimateIn from "@/components/AnimateIn";

const faqs = [
  {
    q: "What file types can I upload?",
    a: "SyllabusAI accepts plain text (paste directly), PDF files, Word documents (.docx), and images (JPEG, PNG) via the upload button. Our AI can read dense paragraph text, tables, and even handwritten-style notes from photos.",
  },
  {
    q: "Is my data private?",
    a: "Yes. Your syllabi and course data are stored securely in your account and never used to train AI models. We use Supabase for database storage (with row-level security) and Anthropic's API to analyze content. See our Privacy Policy for full details.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. Pro is billed monthly and you can cancel from your account settings at any time — no questions asked. If you cancel, you keep Pro access until the end of your billing period. We also offer a 7-day refund if you're not satisfied.",
  },
  {
    q: "Does it work for any subject?",
    a: "Yes. SyllabusAI works for any course — STEM, humanities, business, law, medical school, and more. It reads the structure of your syllabus (not just the subject) to extract deadlines and build study tasks. The practice test generator adapts to whatever content you provide.",
  },
  {
    q: "What's the difference between Free and Pro?",
    a: "Free gives you 3 syllabus analyses, deadline tracking, grade calculator, 2 practice tests per week, and the weekly dashboard. Pro unlocks unlimited analyses, AI-generated weekly study plans, unlimited practice tests (up to 25 questions), full test history, calendar export (.ics), and priority support.",
  },
];

export default function FAQ() {
  return (
    <section id="faq" className="bg-gray-50 dark:bg-slate-900 py-24">
      <div className="mx-auto max-w-3xl px-6">
        <AnimateIn direction="up">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              FAQ
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-50 sm:text-4xl">
              Common questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map(({ q, a }) => (
              <details
                key={q}
                className="group rounded-2xl border border-gray-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-sm open:shadow-md transition-all duration-200"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-sm font-semibold text-gray-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors [&::-webkit-details-marker]:hidden">
                  {q}
                  <svg
                    className="h-4 w-4 shrink-0 text-gray-400 dark:text-slate-500 transition-transform duration-200 group-open:rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </summary>
                <div className="border-t border-gray-100 dark:border-slate-700 px-6 pb-5 pt-4">
                  <p className="text-sm leading-relaxed text-gray-500 dark:text-slate-400">{a}</p>
                </div>
              </details>
            ))}
          </div>

          <p className="mt-10 text-center text-sm text-gray-400 dark:text-slate-500">
            Still have questions?{" "}
            <a
              href="mailto:domgbp21@gmail.com"
              className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors"
            >
              Email us
            </a>{" "}
            or check the{" "}
            <Link href="/pricing" className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors">
              pricing page
            </Link>.
          </p>
        </AnimateIn>
      </div>
    </section>
  );
}
