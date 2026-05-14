export default function Demo() {
  return (
    <section id="demo" className="bg-gray-50 py-24">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="mb-14 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-600">
            See It In Action
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            From syllabus to study plan in 30 seconds
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-gray-500">
            Paste any syllabus and SyllabusAI does the rest — deadlines extracted, study plan built, practice test ready.
          </p>
        </div>

        {/* Three-panel demo */}
        <div className="relative grid gap-6 lg:grid-cols-3">

          {/* Arrow: panel 1 → 2 */}
          <div className="absolute left-1/3 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 hidden lg:flex h-8 w-8 items-center justify-center rounded-full border border-indigo-100 bg-white shadow-sm">
            <svg className="h-3.5 w-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </div>

          {/* Arrow: panel 2 → 3 */}
          <div className="absolute left-2/3 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 hidden lg:flex h-8 w-8 items-center justify-center rounded-full border border-indigo-100 bg-white shadow-sm">
            <svg className="h-3.5 w-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </div>

          {/* ── Panel 1: Syllabus Input ── */}
          <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                </div>
                <span className="text-xs font-medium text-gray-400">Step 1</span>
              </div>
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-700">
                Paste syllabus
              </span>
            </div>

            <div className="flex-1 p-4">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3.5 font-mono text-[11px] leading-relaxed">
                <p className="mb-0.5 font-semibold text-gray-800">CS 301 — Operating Systems</p>
                <p className="text-gray-500">Instructor: Prof. Martinez</p>
                <p className="mb-3 text-gray-500">Tu/Th 2:00–3:15pm · Eng Hall 204</p>
                <p className="font-semibold text-gray-700">Grading Policy</p>
                <p className="text-gray-500">Homework 30% · Midterm 25%</p>
                <p className="mb-3 text-gray-500">Final Exam 35% · Project 10%</p>
                <p className="font-semibold text-gray-700">Important Dates</p>
                <p className="text-gray-500">HW1 due Sep 15 · Quiz Oct 3</p>
                <p className="text-gray-500">Midterm Oct 17 · HW2 Nov 2</p>
                <p className="text-gray-500">Final Project Nov 21</p>
                <p className="text-gray-500">Final Exam Dec 12<span className="animate-pulse">▌</span></p>
              </div>
            </div>

            <div className="border-t border-gray-100 px-4 py-3">
              <div className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 py-2.5 text-xs font-semibold text-white shadow-sm">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                </svg>
                Analyze with AI
              </div>
            </div>
          </div>

          {/* ── Panel 2: Deadlines + Study Plan ── */}
          <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                </div>
                <span className="text-xs font-medium text-gray-400">Step 2</span>
              </div>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                6 items found
              </span>
            </div>

            <div className="flex-1 p-4 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Deadlines extracted</p>
              {[
                { label: "Homework 1", date: "Sep 15", type: "assignment", color: "bg-indigo-50 text-indigo-600" },
                { label: "Quiz 1", date: "Oct 3", type: "quiz", color: "bg-amber-50 text-amber-600" },
                { label: "Midterm Exam", date: "Oct 17", type: "exam", color: "bg-red-50 text-red-600" },
                { label: "Final Project", date: "Nov 21", type: "project", color: "bg-violet-50 text-violet-600" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2.5 rounded-lg border border-gray-100 px-3 py-2">
                  <div className="h-4 w-4 shrink-0 rounded border-2 border-gray-200" />
                  <p className="flex-1 text-xs font-medium text-gray-700">{item.label}</p>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${item.color}`}>{item.type}</span>
                  <span className="text-[10px] text-gray-400">{item.date}</span>
                </div>
              ))}

              <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-indigo-600">
                  Week 1 — Study Plan
                </p>
                {[
                  { day: "Mon", task: "Read Ch. 1–2: Intro to OS & Processes" },
                  { day: "Wed", task: "Practice scheduling algorithms" },
                  { day: "Fri", task: "Start HW1 — allow 2 hrs" },
                ].map((t) => (
                  <div key={t.day} className="flex items-start gap-2 py-0.5">
                    <span className="mt-0.5 w-7 shrink-0 text-[10px] font-bold text-indigo-400">{t.day}</span>
                    <p className="text-[10px] leading-relaxed text-indigo-700">{t.task}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Panel 3: Practice Test ── */}
          <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                </div>
                <span className="text-xs font-medium text-gray-400">Step 3</span>
              </div>
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-700">
                AI-generated
              </span>
            </div>

            <div className="flex-1 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Question 1 of 5</p>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Medium</span>
              </div>

              <p className="mb-4 text-sm font-medium leading-relaxed text-gray-800">
                Which scheduling algorithm minimizes average waiting time for a set of processes with known burst times?
              </p>

              <div className="space-y-2">
                {[
                  { letter: "A", text: "First-Come, First-Served (FCFS)", state: "default" },
                  { letter: "B", text: "Shortest Job First (SJF)", state: "correct" },
                  { letter: "C", text: "Round Robin (RR, q=4ms)", state: "default" },
                  { letter: "D", text: "Multilevel Queue", state: "default" },
                ].map((opt) => (
                  <div
                    key={opt.letter}
                    className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-xs ${
                      opt.state === "correct"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-gray-100 text-gray-600"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                        opt.state === "correct"
                          ? "bg-emerald-500 text-white"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {opt.state === "correct" ? (
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      ) : opt.letter}
                    </span>
                    {opt.text}
                  </div>
                ))}
              </div>

              <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2.5">
                <p className="text-[10px] font-semibold leading-relaxed text-emerald-700">
                  Correct! SJF always picks the shortest remaining job, provably minimizing average waiting time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
