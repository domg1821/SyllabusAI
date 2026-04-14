import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-white pb-20 pt-24 sm:pb-28 sm:pt-32">
      {/* Background blob */}
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
            AI-powered for students
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
          Turn your syllabus into
          <br />
          <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            a clear plan.
          </span>
        </h1>

        {/* Subtext */}
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-500 sm:text-xl">
          Paste your course syllabus and SyllabusAI extracts every deadline,
          quiz, and exam — then builds a personalized weekly study schedule so
          you always know what to work on next.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-md hover:bg-indigo-500 transition-colors"
          >
            Get Started — it&apos;s free
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
          No account required &middot; Works with any syllabus format
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
          {/* Preview content */}
          <div className="grid grid-cols-1 divide-y divide-gray-100 p-6 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {[
              { label: "Quiz 1 — Intro to Programming", type: "quiz", date: "Sep 26", done: true },
              { label: "Midterm Exam", type: "exam", date: "Oct 17", done: false },
              { label: "Final Project — Proposal", type: "project", date: "Nov 14", done: false },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3 p-4">
                <div
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                    item.done
                      ? "border-indigo-500 bg-indigo-500"
                      : "border-gray-300"
                  }`}
                >
                  {item.done && (
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  )}
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-medium ${item.done ? "text-gray-400 line-through" : "text-gray-800"}`}>
                    {item.label}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
                        item.type === "exam"
                          ? "bg-red-50 text-red-600"
                          : item.type === "quiz"
                          ? "bg-amber-50 text-amber-600"
                          : "bg-violet-50 text-violet-600"
                      }`}
                    >
                      {item.type}
                    </span>
                    <span className="text-xs text-gray-400">{item.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
