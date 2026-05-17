import React from "react";
import Link from "next/link";
import AnimateIn from "@/components/AnimateIn";

type FeatureColor = "indigo" | "violet" | "emerald" | "amber" | "red" | "sky" | "orange" | "purple";

const features: {
  id: string;
  icon: React.ReactNode;
  label: string;
  title: string;
  description: string;
  color: FeatureColor;
  pro?: boolean;
}[] = [
  {
    id: "extract",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    ),
    label: "Deadline Extraction",
    title: "Every deadline, automatically found",
    description: "Paste any syllabus — PDF, text, or image — and SyllabusAI pulls out every assignment, quiz, exam, and project due date, even when buried in dense paragraph text.",
    color: "indigo",
  },
  {
    id: "plan",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5" />
      </svg>
    ),
    label: "Study Plans",
    title: "A weekly schedule built around your deadlines",
    description: "Get a personalized week-by-week study plan with daily tasks that work backwards from your due dates. Know exactly what to review today, this week, and all semester.",
    color: "violet",
    pro: true,
  },
  {
    id: "grades",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
    label: "Grade Calculator",
    title: "\"What do I need on the final?\"",
    description: "Track grades across all your courses. SyllabusAI automatically calculates what score you need on remaining assignments to hit your target grade — no spreadsheet required.",
    color: "emerald",
  },
  {
    id: "practice",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
    label: "Practice Tests",
    title: "Custom practice tests in seconds",
    description: "Generate AI-powered multiple choice and short answer tests on any topic. Upload a photo of your notes, paste study material, or pick from your saved courses to review weak areas.",
    color: "sky",
  },
  {
    id: "week",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
      </svg>
    ),
    label: "Weekly Dashboard",
    title: "Your whole semester at a glance",
    description: "One dashboard shows everything due today, this week, and coming up — across all your courses. Study tasks are sorted by day so you always know what to focus on.",
    color: "amber",
  },
  {
    id: "assign",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
      </svg>
    ),
    label: "Assignment Decoder",
    title: "Turn any rubric into a clear action plan",
    description: "Paste an assignment prompt and get a step-by-step breakdown: what the professor wants, common mistakes to avoid, and a structured plan to tackle it with confidence.",
    color: "red",
  },
];

const studySmarter = [
  {
    emoji: "🧑‍🏫",
    label: "Teach It Back",
    title: "The Feynman Technique, built in",
    description: "Explain a topic in your own words and get instant AI feedback — score, strengths, gaps, and a model answer. If you can teach it, you know it.",
    color: "orange" as FeatureColor,
  },
  {
    emoji: "🗺️",
    label: "Memory Map",
    title: "See how ideas connect",
    description: "Auto-generates a concept map for any chapter — core ideas, supporting concepts, and details — so you understand structure, not just facts. Mark what you know.",
    color: "purple" as FeatureColor,
  },
  {
    emoji: "📋",
    label: "Exam Style",
    title: "Practice like it's the real thing",
    description: "Generate exam-level short answer and essay questions based on your actual syllabus. Submit and get per-question feedback, a grade, and model answers.",
    color: "emerald" as FeatureColor,
  },
];

const personas = [
  {
    emoji: "😅",
    type: "The Procrastinator",
    quote: "\"I have a midterm in 3 days and haven't started.\"",
    how: "SyllabusAI tells you exactly what to cram, generates a 90-minute study plan, and quizzes you on the most likely exam topics.",
    accent: "border-red-200 dark:border-red-900 bg-red-50/80 dark:bg-red-950/30",
    labelColor: "text-red-600 dark:text-red-400",
  },
  {
    emoji: "📅",
    type: "The Planner",
    quote: "\"I want to stay ahead all semester, not panic at finals.\"",
    how: "Upload all your syllabi and get a semester-long study calendar with weekly tasks, deadlines, and review reminders baked in.",
    accent: "border-indigo-200 dark:border-indigo-900 bg-indigo-50/80 dark:bg-indigo-950/30",
    labelColor: "text-indigo-600 dark:text-indigo-400",
  },
  {
    emoji: "🎯",
    type: "The Test-Taker",
    quote: "\"I study but always blank on the actual exam.\"",
    how: "Teach It Back and Exam Style train your recall under pressure. Practice tests show exactly which topics you're still shaky on.",
    accent: "border-emerald-200 dark:border-emerald-900 bg-emerald-50/80 dark:bg-emerald-950/30",
    labelColor: "text-emerald-600 dark:text-emerald-400",
  },
];

const colorMap = {
  indigo: { bg: "bg-indigo-50 dark:bg-indigo-950/40", icon: "text-indigo-600 dark:text-indigo-400", badge: "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300" },
  violet: { bg: "bg-violet-50 dark:bg-violet-950/40", icon: "text-violet-600 dark:text-violet-400", badge: "bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300" },
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-950/40", icon: "text-emerald-600 dark:text-emerald-400", badge: "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300" },
  amber: { bg: "bg-amber-50 dark:bg-amber-950/40", icon: "text-amber-600 dark:text-amber-400", badge: "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300" },
  red: { bg: "bg-red-50 dark:bg-red-950/40", icon: "text-red-600 dark:text-red-400", badge: "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300" },
  sky: { bg: "bg-sky-50 dark:bg-sky-950/40", icon: "text-sky-600 dark:text-sky-400", badge: "bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300" },
  orange: { bg: "bg-orange-50 dark:bg-orange-950/40", icon: "text-orange-600 dark:text-orange-400", badge: "bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300" },
  purple: { bg: "bg-purple-50 dark:bg-purple-950/40", icon: "text-purple-600 dark:text-purple-400", badge: "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300" },
} as const;

export default function Features() {
  return (
    <>
      {/* Core features */}
      <section id="features" className="bg-gray-50 dark:bg-slate-900 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <AnimateIn direction="up">
            <div className="mb-16 text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                Features
              </p>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-50 sm:text-4xl">
                Everything a student needs
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-gray-500 dark:text-slate-400">
                One tool that turns a wall of text into a working study plan,
                grade tracker, and personalized exam — in seconds.
              </p>
            </div>
          </AnimateIn>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => {
              const c = colorMap[f.color];
              return (
                <AnimateIn key={f.id} direction="up" delay={(i % 3) * 100}>
                  <div className="group h-full rounded-2xl border border-white/60 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-7 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-200 cursor-default">
                    <div className="mb-4 flex items-start justify-between">
                      <div className={`inline-flex rounded-xl p-3 ${c.bg} ${c.icon}`}>
                        {f.icon}
                      </div>
                      {f.pro && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                          Pro
                        </span>
                      )}
                    </div>
                    <span className={`mb-3 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.badge}`}>
                      {f.label}
                    </span>
                    <h3 className="mb-2 text-base font-semibold text-gray-900 dark:text-slate-100">{f.title}</h3>
                    <p className="text-sm leading-relaxed text-gray-500 dark:text-slate-400">{f.description}</p>
                  </div>
                </AnimateIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* Study Smarter — Pro */}
      <section className="bg-white dark:bg-slate-900/50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <AnimateIn direction="up">
            <div className="mb-12 text-center">
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                ✦ Pro
              </span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-50 sm:text-4xl">
                Study smarter, not just longer
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-gray-500 dark:text-slate-400">
                Pro unlocks AI study modes proven to build deeper understanding — not just rote memorisation.
              </p>
            </div>
          </AnimateIn>

          <div className="grid gap-6 sm:grid-cols-3">
            {studySmarter.map((f, i) => {
              const c = colorMap[f.color];
              return (
                <AnimateIn key={f.label} direction="up" delay={i * 100}>
                  <div className={`h-full rounded-2xl border dark:border-slate-700 p-7 ${c.bg} hover:scale-[1.02] hover:shadow-lg transition-all duration-200 cursor-default`}>
                    <div className="mb-4 text-3xl">{f.emoji}</div>
                    <span className={`mb-3 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.badge}`}>
                      {f.label}
                    </span>
                    <h3 className="mb-2 text-base font-semibold text-gray-900 dark:text-slate-100">{f.title}</h3>
                    <p className="text-sm leading-relaxed text-gray-600 dark:text-slate-400">{f.description}</p>
                  </div>
                </AnimateIn>
              );
            })}
          </div>

          <AnimateIn direction="up" delay={100}>
            <div className="mt-10 text-center">
              <Link
                href="/pricing"
                className="btn-shimmer inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500 hover:shadow-md transition-all duration-200"
              >
                See Pro features →
              </Link>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* Student persona cards */}
      <section className="bg-gray-50 dark:bg-slate-900 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <AnimateIn direction="up">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-50 sm:text-4xl">
                Which student are you?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-gray-500 dark:text-slate-400">
                SyllabusAI adapts to how you actually study — wherever you are in the semester.
              </p>
            </div>
          </AnimateIn>

          <div className="grid gap-6 sm:grid-cols-3">
            {personas.map((p, i) => (
              <AnimateIn key={p.type} direction="up" delay={i * 100}>
                <div className={`h-full rounded-2xl border p-7 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg cursor-default ${p.accent}`}>
                  <div className="mb-3 text-4xl">{p.emoji}</div>
                  <p className={`mb-1 text-xs font-bold uppercase tracking-wider ${p.labelColor}`}>{p.type}</p>
                  <p className="mb-4 text-base font-semibold italic text-gray-800 dark:text-slate-200">{p.quote}</p>
                  <p className="text-sm leading-relaxed text-gray-600 dark:text-slate-400">{p.how}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
