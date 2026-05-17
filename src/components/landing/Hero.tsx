import Link from "next/link";
import AnimateIn from "@/components/AnimateIn";

export default function Hero() {
  return (
    <section className="relative overflow-hidden pb-20 pt-24 sm:pb-28 sm:pt-32">
      {/* Animated gradient background */}
      <div aria-hidden className="hero-gradient-animate absolute inset-0 -z-20" />

      {/* Floating depth shapes */}
      <div aria-hidden className="pointer-events-none absolute -left-32 -top-32 -z-10 h-96 w-96 rounded-full bg-indigo-500 opacity-[0.07] dark:opacity-[0.12] blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-24 top-12 -z-10 h-80 w-80 rounded-full bg-violet-500 opacity-[0.08] dark:opacity-[0.12] blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute bottom-0 left-1/2 -z-10 h-64 w-96 -translate-x-1/2 rounded-full bg-purple-400 opacity-[0.05] dark:opacity-[0.08] blur-3xl" />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center">
        {/* Badge */}
        <AnimateIn direction="fade">
          <div className="mb-8 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 dark:border-indigo-900 bg-indigo-50/80 dark:bg-indigo-950/80 backdrop-blur-sm px-4 py-1.5 text-sm font-medium text-indigo-700 dark:text-indigo-300 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
              </span>
              Built for students, by students
            </span>
          </div>
        </AnimateIn>

        {/* Headline */}
        <AnimateIn direction="up">
          <h1 className="text-4xl font-extrabold leading-[1.15] tracking-tight text-gray-900 dark:text-slate-50 sm:text-5xl lg:text-7xl">
            The AI study partner that{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              actually knows your syllabus.
            </span>
          </h1>
        </AnimateIn>

        {/* Subtext */}
        <AnimateIn direction="up" delay={100}>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600 dark:text-slate-300 sm:text-xl">
            Upload your syllabus and SyllabusAI builds a personalized study plan, tracks every deadline,
            generates practice tests, and coaches you with AI — all tailored to exactly what you need to know.
          </p>
        </AnimateIn>

        {/* CTAs */}
        <AnimateIn direction="up" delay={200}>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/dashboard"
              className="btn-shimmer inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-md hover:bg-indigo-500 hover:shadow-lg transition-all duration-200"
            >
              Get started free
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-6 py-3.5 text-base font-semibold text-gray-700 dark:text-slate-200 hover:border-gray-300 dark:hover:border-slate-500 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md transition-all duration-200"
            >
              See how it works
            </a>
          </div>
          <p className="mt-6 text-sm text-gray-400 dark:text-slate-500">
            Free to start &middot; No card required &middot; Works with any syllabus or course format
          </p>
        </AnimateIn>

        {/* Social proof stats */}
        <AnimateIn direction="up" delay={300}>
          <div className="mt-12 flex flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-12">
            {[
              { stat: "10,000+", label: "deadlines tracked" },
              { stat: "50,000+", label: "flashcards generated" },
              { stat: "1 grade higher", label: "students report on average" },
            ].map(({ stat, label }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-extrabold text-gray-900 dark:text-slate-100">{stat}</p>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </AnimateIn>
      </div>

      {/* App preview mockup */}
      <AnimateIn direction="up" delay={150} className="mx-auto mt-16 max-w-5xl px-4 sm:px-6">
        <div className="overflow-hidden rounded-2xl border border-gray-200/80 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 shadow-2xl dark:shadow-slate-900/60 ring-1 ring-gray-100 dark:ring-slate-700 backdrop-blur-sm hover:shadow-[0_32px_80px_-12px_rgba(99,102,241,0.18)] transition-shadow duration-500">
          {/* Fake browser chrome */}
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-slate-700 bg-gray-50/80 dark:bg-slate-900/60 px-4 py-3">
            <div className="h-3 w-3 rounded-full bg-red-400" />
            <div className="h-3 w-3 rounded-full bg-yellow-400" />
            <div className="h-3 w-3 rounded-full bg-green-400" />
            <div className="mx-auto flex items-center gap-2 rounded-md border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1 text-xs text-gray-400 dark:text-slate-500">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
              syllabusai.app/dashboard
            </div>
          </div>

          {/* Two-panel preview */}
          <div className="grid grid-cols-1 divide-y dark:divide-slate-700 sm:grid-cols-2 sm:divide-x sm:divide-y-0 divide-gray-100">
            {/* Left: deadline list */}
            <div className="space-y-2 p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-500">Upcoming deadlines</p>
              {[
                { label: "Quiz 1 — Intro to Programming", type: "quiz", date: "Sep 26", done: true },
                { label: "Midterm Exam", type: "exam", date: "Oct 17", done: false },
                { label: "Homework 3", type: "assignment", date: "Nov 7", done: false },
                { label: "Final Project", type: "project", date: "Dec 5", done: false },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2.5 rounded-lg bg-gray-50 dark:bg-slate-700/60 px-3 py-2 transition-colors hover:bg-gray-100/80 dark:hover:bg-slate-700">
                  <div
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 ${
                      item.done ? "border-indigo-500 bg-indigo-500" : "border-gray-300 dark:border-slate-500"
                    }`}
                  >
                    {item.done && (
                      <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    )}
                  </div>
                  <p className={`flex-1 text-sm font-medium ${item.done ? "line-through text-gray-400 dark:text-slate-500" : "text-gray-700 dark:text-slate-200"}`}>
                    {item.label}
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                        item.type === "exam"
                          ? "bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400"
                          : item.type === "quiz"
                          ? "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400"
                          : item.type === "project"
                          ? "bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400"
                          : "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400"
                      }`}
                    >
                      {item.type}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-slate-500">{item.date}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: study hub preview */}
            <div className="p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-500">Study Hub</p>
              <div className="space-y-2">
                {[
                  { topic: "Week 3 — Recursion & Sorting", tools: ["📝 Practice", "🃏 Flashcards", "🧑‍🏫 Teach It"] },
                  { topic: "Week 5 — Data Structures", tools: ["🗺️ Memory Map", "📋 Exam Style"] },
                ].map((item) => (
                  <div key={item.topic} className="rounded-lg border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50 p-3 transition-colors hover:bg-gray-100/60 dark:hover:bg-slate-700">
                    <p className="mb-2 text-xs font-semibold text-gray-700 dark:text-slate-200">{item.topic}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {item.tools.map((t) => (
                        <span key={t} className="rounded-md bg-white dark:bg-slate-600 border border-gray-200 dark:border-slate-500 px-2 py-0.5 text-[10px] font-semibold text-gray-600 dark:text-slate-200 shadow-sm">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="mt-3 rounded-lg border border-indigo-100 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-2">
                  <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">🎯 Study Midterm Exam — 3 days away</p>
                  <p className="mt-0.5 text-[10px] text-indigo-500 dark:text-indigo-400">Suggested: 90 min of exam-style questions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AnimateIn>
    </section>
  );
}
