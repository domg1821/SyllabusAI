"use client";

import { useState, useEffect } from "react";
import { SavedClass, StudySession } from "@/lib/types";
import { saveStudySession } from "@/lib/useStudySessions";

type ExamQuestionType = "multiple_choice" | "short_answer" | "essay";

interface ExamQuestion {
  id: string;
  type: ExamQuestionType;
  question: string;
  points: number;
  options?: string[];
  correctAnswer?: string;
  modelAnswer?: string;
  markingCriteria?: string[];
  rubric?: { criterion: string; marks: number }[];
}

interface QuestionResult {
  id: string;
  score: number;
  maxScore: number;
  feedback: string;
  modelAnswer: string;
}

interface Props {
  topic: string;
  cls: SavedClass;
  examType: ExamQuestionType;
  onClose: () => void;
}

const TYPE_LABELS: Record<ExamQuestionType, string> = {
  multiple_choice: "Multiple Choice",
  short_answer: "Short Answer",
  essay: "Essay",
};

export default function ExamStyleMode({ topic, cls, examType, onClose }: Props) {
  const [phase, setPhase] = useState<"loading" | "exam" | "submitting" | "results">("loading");
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const res = await fetch("/api/exam-style", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic,
            examType,
            courseContext: cls.rawText?.slice(0, 1000),
          }),
        });
        const json = await res.json();
        if (!res.ok) { setError(json.error ?? "Failed to generate exam."); setPhase("exam"); return; }
        setQuestions(json.questions ?? []);
        setIsMock(json.mock ?? false);
        setPhase("exam");
      } catch {
        setError("Network error. Please try again.");
        setPhase("exam");
      }
    }
    fetchQuestions();
  }, [topic, examType, cls.rawText]);

  async function handleSubmit() {
    setPhase("submitting");
    try {
      const res = await fetch("/api/exam-style/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          questions,
          answers,
          courseContext: cls.rawText?.slice(0, 600),
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Failed to mark answers."); setPhase("exam"); return; }
      setResults(json.results ?? []);
      setTotalScore(json.totalScore ?? 0);
      setMaxScore(json.maxScore ?? 0);
      setPhase("results");
      const session: StudySession = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        chapter: topic,
        courseName: cls.name,
        duration: Date.now() - startTime,
        score: json.maxScore > 0 ? Math.round((json.totalScore / json.maxScore) * 100) : 0,
      };
      saveStudySession(session);
    } catch {
      setError("Network error. Please try again.");
      setPhase("exam");
    }
  }

  const totalPts = questions.reduce((s, q) => s + q.points, 0);
  const pct = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const grade = pct >= 85 ? "Distinction" : pct >= 70 ? "Merit" : pct >= 50 ? "Pass" : "Needs work";
  const gradeColor = pct >= 85 ? "text-emerald-600" : pct >= 70 ? "text-indigo-600" : pct >= 50 ? "text-amber-600" : "text-red-500";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-0 sm:p-4">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[95dvh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700 shrink-0">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold text-red-500 uppercase tracking-wider">
              Exam Style · {TYPE_LABELS[examType]}
            </p>
            <h2 className="text-sm font-bold text-gray-900 dark:text-slate-100 truncate">{topic}</h2>
          </div>
          {phase === "exam" && (
            <span className="shrink-0 ml-3 text-xs text-gray-400 dark:text-slate-500 tabular-nums">
              {totalPts} marks total
            </span>
          )}
          <button onClick={onClose} className="shrink-0 ml-3 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Loading */}
          {phase === "loading" && (
            <div className="flex flex-col items-center gap-3 py-16">
              <svg className="h-7 w-7 animate-spin text-red-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm text-gray-500 dark:text-slate-400">Setting up your exam…</p>
            </div>
          )}

          {/* Exam paper */}
          {(phase === "exam" || phase === "submitting") && questions.length > 0 && (
            <div className="p-6 space-y-8">
              {isMock && (
                <div className="rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
                  <span className="font-semibold">Demo mode —</span> Sample questions shown (no API key).
                </div>
              )}

              {/* Exam header strip */}
              <div className="border-b-2 border-gray-900 dark:border-slate-100 pb-4">
                <p className="text-xs uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-1">Exam Paper</p>
                <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">{topic}</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{cls.name} · {TYPE_LABELS[examType]} · {totalPts} marks · Answer all questions</p>
              </div>

              {questions.map((q, idx) => (
                <div key={q.id} className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 text-sm font-bold text-gray-900 dark:text-slate-100 w-6">{idx + 1}.</span>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <p className="text-sm leading-relaxed text-gray-800 dark:text-slate-200">{q.question}</p>
                        <span className="shrink-0 text-xs font-semibold text-gray-400 dark:text-slate-500 tabular-nums">[{q.points} marks]</span>
                      </div>

                      {/* MC options */}
                      {q.type === "multiple_choice" && q.options && (
                        <div className="space-y-2">
                          {q.options.filter((opt) => opt.trim().length > 0).map((opt) => {
                            const letter = opt[0];
                            const selected = answers[q.id] === letter;
                            return (
                              <button
                                key={opt}
                                onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: letter }))}
                                disabled={phase === "submitting"}
                                className={`w-full flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm transition-all ${
                                  selected
                                    ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 dark:border-indigo-600 text-indigo-900 dark:text-indigo-100"
                                    : "border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 text-gray-700 dark:text-slate-300 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50/40"
                                } disabled:cursor-default`}
                              >
                                <span className={`shrink-0 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold border ${selected ? "border-indigo-500 bg-indigo-500 text-white" : "border-gray-300 dark:border-slate-500 text-gray-400 dark:text-slate-500"}`}>
                                  {letter}
                                </span>
                                <span>{opt.slice(3)}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* SA / Essay textarea */}
                      {(q.type === "short_answer" || q.type === "essay") && (
                        <>
                          {q.markingCriteria && (
                            <div className="mb-2 flex flex-wrap gap-1.5">
                              {q.markingCriteria.map((c, i) => (
                                <span key={i} className="rounded-full bg-gray-100 dark:bg-slate-700 px-2 py-0.5 text-[10px] text-gray-500 dark:text-slate-400">{c}</span>
                              ))}
                            </div>
                          )}
                          {q.rubric && (
                            <div className="mb-2 rounded-lg border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/30 p-2.5">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-1.5">Marking criteria</p>
                              {q.rubric.map((r, i) => (
                                <div key={i} className="flex justify-between text-xs text-gray-600 dark:text-slate-300">
                                  <span>{r.criterion}</span>
                                  <span className="font-semibold">{r.marks} marks</span>
                                </div>
                              ))}
                            </div>
                          )}
                          <textarea
                            value={answers[q.id] ?? ""}
                            onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                            placeholder={q.type === "essay" ? "Write your essay here — structure your argument clearly…" : "Write your answer here…"}
                            rows={q.type === "essay" ? 10 : 4}
                            disabled={phase === "submitting"}
                            className="w-full resize-none rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 p-3 text-sm leading-relaxed text-gray-700 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all disabled:opacity-60"
                          />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          )}

          {/* Results */}
          {phase === "results" && (
            <div className="p-6 space-y-5">
              {/* Score summary */}
              <div className="rounded-2xl border-2 border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50 p-5 text-center">
                <p className="text-4xl font-extrabold text-gray-900 dark:text-slate-100">{totalScore} <span className="text-xl font-normal text-gray-400">/ {maxScore}</span></p>
                <p className={`mt-1 text-lg font-bold ${gradeColor}`}>{grade}</p>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{pct}% — {pct >= 70 ? "Well done!" : "Review the feedback below to improve."}</p>
              </div>

              {/* Per-question results */}
              <div className="space-y-4">
                {results.map((r, idx) => {
                  const q = questions.find((q) => q.id === r.id);
                  const pctQ = r.maxScore > 0 ? Math.round((r.score / r.maxScore) * 100) : 0;
                  const isGood = pctQ >= 70;
                  return (
                    <div key={r.id} className="rounded-xl border border-gray-200 dark:border-slate-600 overflow-hidden">
                      <div className={`flex items-center justify-between px-4 py-2.5 ${isGood ? "bg-emerald-50 dark:bg-emerald-950/20" : "bg-red-50 dark:bg-red-950/20"}`}>
                        <span className="text-xs font-bold text-gray-700 dark:text-slate-300">Q{idx + 1}</span>
                        <span className={`text-sm font-bold tabular-nums ${isGood ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                          {r.score}/{r.maxScore}
                        </span>
                      </div>
                      <div className="p-4 space-y-2.5">
                        {q && <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">{q.question}</p>}
                        <p className="text-sm leading-relaxed text-gray-700 dark:text-slate-200">{r.feedback}</p>
                        {r.modelAnswer && (
                          <div className="rounded-lg border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50 dark:bg-indigo-950/20 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400 mb-1">Model answer</p>
                            <p className="text-xs leading-relaxed text-indigo-800 dark:text-indigo-200">{r.modelAnswer}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {(phase === "exam" || phase === "submitting") && questions.length > 0 && (
          <div className="border-t border-gray-100 dark:border-slate-700 px-5 py-3 shrink-0">
            <button
              onClick={handleSubmit}
              disabled={phase === "submitting"}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] transition-all"
            >
              {phase === "submitting" ? (
                <><svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Marking your answers…</>
              ) : "Submit & get marks →"}
            </button>
          </div>
        )}

        {phase === "results" && (
          <div className="border-t border-gray-100 dark:border-slate-700 px-5 py-3 shrink-0 flex gap-3">
            <button onClick={() => { setAnswers({}); setResults([]); setPhase("exam"); }} className="flex-1 rounded-xl border border-gray-200 dark:border-slate-600 py-2.5 text-sm font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
              Try again
            </button>
            <button onClick={onClose} className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-bold text-white hover:bg-indigo-500 transition-colors">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
