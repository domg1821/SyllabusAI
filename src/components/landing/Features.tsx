import React from "react";

type FeatureColor = "indigo" | "violet" | "emerald";

const features: { id: string; icon: React.ReactNode; label: string; title: string; description: string; color: FeatureColor }[] = [
  {
    id: "extract",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
      </svg>
    ),
    label: "Extract Deadlines",
    title: "Every deadline, automatically found",
    description:
      "SyllabusAI scans your entire syllabus and pulls out assignments, quizzes, exams, and project due dates — even when they're buried in dense paragraph text.",
    color: "indigo",
  },
  {
    id: "plan",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
      </svg>
    ),
    label: "Generate Study Plans",
    title: "A study schedule built around your deadlines",
    description:
      "Get a week-by-week study plan with daily tasks that work backwards from your due dates. Know exactly what to review today, this week, and next month.",
    color: "violet",
  },
  {
    id: "track",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
    label: "Stay on Top",
    title: "Never miss an assignment again",
    description:
      "Track your progress as you go. Check off tasks and deadlines as you complete them — completed items fade away so you can focus on what's left.",
    color: "emerald",
  },
];

const colorMap = {
  indigo: {
    bg: "bg-indigo-50",
    icon: "text-indigo-600",
    badge: "bg-indigo-100 text-indigo-700",
  },
  violet: {
    bg: "bg-violet-50",
    icon: "text-violet-600",
    badge: "bg-violet-100 text-violet-700",
  },
  emerald: {
    bg: "bg-emerald-50",
    icon: "text-emerald-600",
    badge: "bg-emerald-100 text-emerald-700",
  },
} as const;

export default function Features() {
  return (
    <section id="features" className="bg-gray-50 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-600">
            Features
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Everything a student needs
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-gray-500">
            One tool that takes you from a wall of text to a working study plan
            in seconds.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {features.map((f) => {
            const c = colorMap[f.color];
            return (
              <div
                key={f.id}
                className="group rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className={`mb-5 inline-flex rounded-xl p-3 ${c.bg} ${c.icon}`}>
                  {f.icon}
                </div>
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.badge} mb-3`}>
                  {f.label}
                </span>
                <h3 className="mb-3 text-lg font-semibold text-gray-900">{f.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{f.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
