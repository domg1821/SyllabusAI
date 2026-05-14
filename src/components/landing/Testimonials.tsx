const testimonials = [
  {
    initials: "JR",
    name: "Jamie R.",
    university: "University of Michigan",
    major: "Computer Science",
    quote:
      "I used to spend an hour every Sunday figuring out what to study for the week. SyllabusAI just shows me. My GPA went from a 3.1 to a 3.7 this semester and I'm actually less stressed.",
    color: "bg-indigo-500",
  },
  {
    initials: "MS",
    name: "Maya S.",
    university: "UT Austin",
    major: "Biochemistry",
    quote:
      "I'm taking 5 science courses and the conflict warnings alone saved me twice. I had two exams the same week I didn't notice until SyllabusAI flagged them. Game changer.",
    color: "bg-violet-500",
  },
  {
    initials: "TK",
    name: "Tyler K.",
    university: "Ohio State University",
    major: "Business Administration",
    quote:
      "The practice tests are shockingly good. I pasted my accounting notes, generated a 10-question quiz, and the actual exam questions felt familiar. I walked in confident for the first time.",
    color: "bg-emerald-500",
  },
];

export default function Testimonials() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-14 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-600">
            Student Stories
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Students who got their semester back
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-gray-500">
            Real students, real results. Here&apos;s what happens when you stop guessing and start planning.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="flex flex-col rounded-2xl border border-gray-100 bg-white p-7 shadow-sm"
            >
              {/* Stars */}
              <div className="mb-5 flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg
                    key={i}
                    className="h-4 w-4 fill-amber-400 text-amber-400"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>

              {/* Quote */}
              <blockquote className="flex-1 text-sm leading-relaxed text-gray-600">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              {/* Author */}
              <div className="mt-6 flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${t.color}`}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400">
                    {t.major} · {t.university}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Social proof strip */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-center">
          {[
            { stat: "4.9★", label: "Average rating" },
            { stat: "2,000+", label: "Students using SyllabusAI" },
            { stat: "50+", label: "Universities represented" },
          ].map((s) => (
            <div key={s.stat}>
              <p className="text-2xl font-extrabold text-gray-900">{s.stat}</p>
              <p className="mt-0.5 text-sm text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
