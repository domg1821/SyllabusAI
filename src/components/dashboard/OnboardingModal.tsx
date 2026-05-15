"use client";

import { useState } from "react";

interface Props {
  open: boolean;
  onDone: () => void;
}

const TOTAL_STEPS = 3;

// ─── Step visuals ──────────────────────────────────────────────────────────────

function WelcomeVisual() {
  return (
    <div className="text-left space-y-2.5">
      {[
        { emoji: "📅", text: "Extract all deadlines automatically" },
        { emoji: "📚", text: "Get a week-by-week study plan" },
        { emoji: "✅", text: "Track grades and practice for exams" },
      ].map((item) => (
        <div key={item.text} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
          <span className="text-xl">{item.emoji}</span>
          <span className="text-sm font-medium text-gray-700">{item.text}</span>
        </div>
      ))}
    </div>
  );
}

function SyllabusVisual() {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
      <div className="flex items-center gap-3">
        {/* Fake syllabus input */}
        <div className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white p-2.5">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Syllabus
          </p>
          <div className="space-y-0.5 font-mono text-[9px] leading-relaxed text-gray-400">
            <p>Midterm Exam: Oct 15 — 20%</p>
            <p>Assignment 2: Oct 22 — 15%</p>
            <p>Final Exam: Dec 10 — 35%</p>
            <p className="text-gray-300">...</p>
          </div>
        </div>

        {/* Arrow */}
        <svg className="h-5 w-5 shrink-0 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
        </svg>

        {/* Extracted results */}
        <div className="min-w-0 flex-1 space-y-1.5">
          {[
            { label: "Midterm", date: "Oct 15", color: "bg-red-50 text-red-600 border-red-100" },
            { label: "Assignment 2", date: "Oct 22", color: "bg-indigo-50 text-indigo-600 border-indigo-100" },
            { label: "Final Exam", date: "Dec 10", color: "bg-red-50 text-red-600 border-red-100" },
          ].map((item) => (
            <div
              key={item.label}
              className={`flex items-center justify-between rounded-lg border px-2 py-1 text-[9px] font-semibold ${item.color}`}
            >
              <span className="truncate">{item.label}</span>
              <span className="ml-1 shrink-0 text-gray-400">{item.date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tip */}
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2">
        <span className="text-sm">💡</span>
        <p className="text-xs text-amber-800">
          <span className="font-semibold">Tip:</span> Even a photo of your syllabus works
        </p>
      </div>
    </div>
  );
}

const FEATURE_CARDS = [
  { emoji: "📅", title: "This Week", desc: "See what's due each day" },
  { emoji: "📚", title: "Study Plan", desc: "Chapter-by-chapter prep" },
  { emoji: "✏️", title: "Practice Tests", desc: "Quiz yourself with AI" },
  { emoji: "🎯", title: "Grade Tracker", desc: "Track your progress" },
];

function FeaturesVisual() {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {FEATURE_CARDS.map((card) => (
        <div
          key={card.title}
          className="flex flex-col items-start gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3.5"
        >
          <span className="text-2xl">{card.emoji}</span>
          <div>
            <p className="text-xs font-bold text-gray-800">{card.title}</p>
            <p className="mt-0.5 text-[11px] text-gray-500">{card.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Step definitions ──────────────────────────────────────────────────────────

const STEPS = [
  {
    title: "Turn any syllabus into a study plan",
    subtitle: "in seconds",
    visual: <WelcomeVisual />,
    cta: "Get started →",
  },
  {
    title: "Upload your syllabus",
    subtitle: "Paste or upload your syllabus — we'll extract every deadline, build your study plan, and organize everything automatically.",
    visual: <SyllabusVisual />,
    cta: "Next →",
  },
  {
    title: "You're ready! 🎉",
    subtitle: "Here's everything waiting for you:",
    visual: <FeaturesVisual />,
    cta: "Analyze My First Syllabus →",
  },
];

// ─── Main Component ────────────────────────────────────────────────────────────

export default function OnboardingModal({ open, onDone }: Props) {
  const [step, setStep] = useState(0);

  if (!open) return null;

  const current = STEPS[step];
  const isLast = step === TOTAL_STEPS - 1;
  const progressPct = ((step + 1) / TOTAL_STEPS) * 100;

  function advance() {
    if (isLast) {
      onDone();
    } else {
      setStep((s) => s + 1);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden">

        {/* Progress bar */}
        <div className="h-1 w-full bg-gray-100">
          <div
            className="h-1 bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="px-8 py-7">
          {/* App logo (step 1 only) */}
          {step === 0 && (
            <div className="mb-5 flex items-center justify-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                </svg>
              </div>
              <span className="text-lg font-extrabold tracking-tight text-gray-900">SyllabusAI</span>
            </div>
          )}

          {/* Title */}
          <div className="mb-5 text-center">
            <h2 className="text-xl font-extrabold text-gray-900 leading-snug">{current.title}</h2>
            {step === 0 ? (
              <p className="mt-1 text-sm font-medium text-indigo-600">{current.subtitle}</p>
            ) : (
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">{current.subtitle}</p>
            )}
          </div>

          {/* Step visual */}
          <div className="mb-6">{current.visual}</div>

          {/* Step dots (numbered) */}
          <div className="mb-5 flex justify-center gap-2">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => i < step && setStep(i)}
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                  i === step
                    ? "bg-indigo-600 text-white shadow-sm"
                    : i < step
                      ? "bg-indigo-100 text-indigo-600 cursor-pointer"
                      : "bg-gray-100 text-gray-400 cursor-default"
                }`}
              >
                {i < step ? "✓" : i + 1}
              </button>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={advance}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 py-3 text-sm font-bold text-white shadow-sm hover:opacity-90 active:scale-[0.99] transition-all"
          >
            {current.cta}
          </button>

          {/* Skip tour */}
          {!isLast && (
            <button
              onClick={onDone}
              className="mt-3 w-full text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              Skip tour
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
