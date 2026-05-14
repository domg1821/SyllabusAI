import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-white pb-20 pt-24 sm:pb-28 sm:pt-32">
      {/* Background gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 overflow-hidden"
      >
        <div className="relative left-1/2 aspect-[1155/678] w-[80rem] -translate-x-1/2 rotate-[25deg] bg-gradient-to-tr from-indigo-100 via-violet-100 to-pink-100 opacity-40" />
      </div>

      <div className="mx-auto max-w-5xl px-6 text-center">
        {/* Badge */}
        <div className="mb-8 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
            </span>
            Built for students, by students
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
          Stop guessing what to study.
          <br />
          <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            Start knowing.
          </span>
        </h1>

        {/* Subtext */}
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-500 sm:text-xl">
          Paste any syllabus and SyllabusAI extracts every deadline, builds a
          personalized weekly study plan, tracks your grades, and generates
          practice tests — so you always know exactly what to do next.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-md hover:bg-indigo-500 transition-colors"
          >
            Get started free
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-6 py-3.5 text-base font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors"
          >
            See how it works
          </a>
        </div>

        <p className="mt-6 text-sm text-gray-400">
          Free to start &middot; No card required &middot; Works with any syllabus or course format
        </p>
      </div>

      {/* App preview mockup */}
      <div className="mx-auto mt-20 max-w-5xl px-6">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl ring-1 ring-gray-100">
          {/* Fake browser chrome */}
          <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3">
            <div className="h-3 w-3 rounded-full bg-red-400" />
            <div className="h-3 w-3 rounded-full bg-yellow-400" />
            <div className="h-3 w-3 rounded-full bg-green-400" />
            <div className="mx-auto flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1 text-xs text-gray-400">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
              syllabusai.app/dashboard
            </div>
          </div>

          {/* Two-panel preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
            {/* Left: deadline list */}
            <div className="p-5 space-y-2">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Upcoming deadlines</p>
              {[
                { label: "Quiz 1 — Intro to Programming", type: "quiz", date: "Sep 26", done: true },
                { label: "Midterm Exam", type: "exam", date: "Oct 17", done: false },
                { label: "Homework 3", type: "assignment", date: "Nov 7", done: false },
                { label: "Final Project", type: "project", date: "Dec 5", done: false },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2.5 rounded-lg px-3 py-2 bg-gray-50">
                  <div
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 ${
                      item.done ? "border-indigo-500 bg-indigo-500" : "border-gray-300"
                    }`}
                  >
                    {item.done && (
                      <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    )}
                  </div>
                  <p className={`flex-1 text-sm font-medium ${item.done ? "line-through text-gray-400" : "text-gray-700"}`}>
                    {item.label}
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                        item.type === "exam"
                          ? "bg-red-50 text-red-600"
                          : item.type === "quiz"
                          ? "bg-amber-50 text-amber-600"
                          : item.type === "project"
                          ? "bg-violet-50 text-violet-600"
                          : "bg-indigo-50 text-indigo-600"
                      }`}
                    >
                      {item.type}
                    </span>
                    <span className="text-xs text-gray-400">{item.date}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: grade tracker */}
            <div className="p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Grade tracker</p>
              <div className="space-y-2">
                {[
                  { label: "CS 101", grade: "A−", pct: 91, color: "bg-emerald-500" },
                  { label: "MATH 201", grade: "B+", pct: 88, color: "bg-indigo-500" },
                  { label: "HIST 110", grade: "B−", pct: 80, color: "bg-amber-500" },
                ].map((c) => (
                  <div key={c.label} className="flex items-center gap-3">
                    <p className="w-20 text-xs font-semibold text-gray-600 truncate">{c.label}</p>
                    <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className={`h-full rounded-full ${c.color}`} style={{ width: `${c.pct}%` }} />
                    </div>
                    <span className="w-8 text-right text-xs font-bold text-gray-700">{c.grade}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2">
                <p className="text-xs font-semibold text-indigo-700">Need 78 pts on HIST 110 final to keep B−</p>
                <p className="text-[10px] text-indigo-500 mt-0.5">Calculated automatically from your grades</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
