"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "Do I need a credit card to sign up?",
    a: "No. The free plan requires no payment information at all. You can use SyllabusAI for free as long as you like — upgrade only when you want unlimited access.",
  },
  {
    q: "What's included in the 30-day money-back guarantee?",
    a: "If you upgrade to Pro and aren't satisfied within 30 days of your first charge, just email us and we'll refund you in full — no questions asked.",
  },
  {
    q: "Can I cancel at any time?",
    a: "Yes. Pro is billed monthly and you can cancel anytime from your account settings. You'll keep Pro access until the end of the billing period.",
  },
  {
    q: "What makes SyllabusAI different from just using ChatGPT?",
    a: "ChatGPT doesn't know your syllabus, your deadlines, or your weak topics. SyllabusAI extracts all of that automatically and uses it to personalise every practice test, study plan, and exam question — so you're always studying the right thing.",
  },
  {
    q: "Does it work for any subject or university?",
    a: "Yes. SyllabusAI works with any course format — science, humanities, law, medicine, business — at any university. As long as you can paste or upload your syllabus, it works.",
  },
];

export default function FAQAccordion() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="divide-y divide-gray-100">
      {FAQS.map((faq, i) => (
        <div key={i}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 py-5 text-left"
          >
            <span className="text-sm font-semibold text-gray-900">{faq.q}</span>
            <svg
              className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open === i ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          {open === i && (
            <p className="pb-5 text-sm leading-relaxed text-gray-500">{faq.a}</p>
          )}
        </div>
      ))}
    </div>
  );
}
