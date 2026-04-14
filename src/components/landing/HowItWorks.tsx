const steps = [
  {
    number: "01",
    title: "Paste or upload your syllabus",
    description:
      "Copy and paste the syllabus text, or upload a PDF or DOCX. SyllabusAI handles any format your professor uses.",
  },
  {
    number: "02",
    title: "AI extracts every deadline",
    description:
      "Our model identifies assignments, quizzes, exams, and project due dates — even when buried in paragraphs of dense course policy text.",
  },
  {
    number: "03",
    title: "Get your personalized study plan",
    description:
      "SyllabusAI maps out daily study tasks working backwards from each deadline, so you always know exactly what to do next.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-600">
            How it works
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            From syllabus to study plan in 30 seconds
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.number} className="relative flex flex-col">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="absolute left-[calc(100%+1rem)] top-6 hidden h-px w-8 bg-gray-200 md:block" />
              )}
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-lg font-black text-white shadow-sm">
                {step.number}
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">{step.title}</h3>
              <p className="text-sm leading-relaxed text-gray-500">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
