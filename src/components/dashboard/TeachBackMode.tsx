"use client";

import { useState, useEffect } from "react";
import { SavedClass, StudySession } from "@/lib/types";
import { saveStudySession } from "@/lib/useStudySessions";

interface Feedback {
  score: number;
  strengths: string[];
  gaps: string[];
  improvedExplanation: string;
}

interface Props {
  topic: string;
  cls: SavedClass;
  onClose: () => void;
}

function ScoreRing({ score }: { score: number }) {
  const pct = score / 10;
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  const color = score >= 8 ? "#10b981" : score >= 5 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative flex h-20 w-20 items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r} fill="none" stroke="#f3f4f6" strokeWidth="6" />
        <circle
          cx="32" cy="32" r={r} fill="none"
          stroke={color} strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      <div className="text-center">
        <p className="text-xl font-extrabold leading-none" style={{ color }}>{score}</p>
        <p className="text-[10px] text-gray-400">/ 10</p>
      </div>
    </div>
  );
}

export default function TeachBackMode({ topic, cls, onClose }: Props) {
  const [phase, setPhase] = useState<"loading-prompt" | "write" | "submitting" | "feedback">("loading-prompt");
  const [prompt, setPrompt] = useState("");
  const [explanation, setExplanation] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [startTime] = useState(Date.now());
  const [showModel, setShowModel] = useState(false);

  useEffect(() => {
    async function fetchPrompt() {
      try {
        const res = await fetch("/api/teach-back", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic,
            chapterName: topic,
            courseContext: cls.rawText?.slice(0, 800),
          }),
        });
        const json = await res.json();
        setPrompt(json.prompt ?? `Explain "${topic}" as if teaching a 10-year-old. Cover what it is, how it works with a real example, and why it matters.`);
      } catch {
        setPrompt(`Explain "${topic}" as if teaching a 10-year-old. Cover what it is, how it works with a real example, and why it matters.`);
      } finally {
        setPhase("write");
      }
    }
    fetchPrompt();
  }, [topic, cls.rawText]);

  async function handleSubmit() {
    if (!explanation.trim() || explanation.trim().length < 30) {
      setError("Write at least a sentence or two before submitting.");
      return;
    }
    setError(null);
    setPhase("submitting");
    try {
      const res = await fetch("/api/teach-back/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          explanation: explanation.trim(),
          courseContext: cls.rawText?.slice(0, 800),
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Failed to get feedback."); setPhase("write"); return; }
      setFeedback(json.feedback);
      setPhase("feedback");
      const session: StudySession = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        chapter: topic,
        courseName: cls.name,
        duration: Date.now() - startTime,
        score: (json.feedback?.score ?? 0) * 10,
      };
      saveStudySession(session);
    } catch {
      setError("Network error. Please try again.");
      setPhase("write");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-0 sm:p-4">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95dvh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700 shrink-0">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold text-orange-500 uppercase tracking-wider">Teach It Back</p>
            <h2 className="text-sm font-bold text-gray-900 dark:text-slate-100 truncate">{topic}</h2>
          </div>
          <button onClick={onClose} className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {/* Loading prompt */}
          {phase === "loading-prompt" && (
            <div className="flex flex-col items-center gap-3 py-12">
              <svg className="h-7 w-7 animate-spin text-orange-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm text-gray-500 dark:text-slate-400">Setting up your challenge…</p>
            </div>
          )}

          {/* Write phase */}
          {(phase === "write" || phase === "submitting") && (
            <>
              <div className="mb-4 rounded-xl border border-orange-100 dark:border-orange-900/40 bg-orange-50 dark:bg-orange-950/20 p-4">
                <div className="flex items-start gap-2.5">
                  <span className="text-xl shrink-0">🧑‍🏫</span>
                  <p className="text-sm leading-relaxed text-orange-800 dark:text-orange-200">{prompt}</p>
                </div>
              </div>

              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">Your explanation</label>
                <span className={`text-xs ${explanation.length < 50 ? "text-gray-400" : "text-orange-500 font-medium"}`}>
                  {explanation.length} chars
                </span>
              </div>
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Explain it here — use your own words, as if talking to someone who's never studied this before…"
                rows={8}
                disabled={phase === "submitting"}
                className="w-full resize-none rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 p-4 text-sm leading-relaxed text-gray-700 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:border-orange-400 focus:bg-white dark:focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-900/30 transition-all disabled:opacity-60"
              />

              {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

              <button
                onClick={handleSubmit}
                disabled={phase === "submitting" || explanation.trim().length < 30}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-bold text-white hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99] transition-all"
              >
                {phase === "submitting" ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Getting feedback…
                  </>
                ) : "Submit for feedback →"}
              </button>
            </>
          )}

          {/* Feedback phase */}
          {phase === "feedback" && feedback && (
            <div className="space-y-5">
              {/* Score */}
              <div className="flex items-center gap-5 rounded-xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 p-4">
                <ScoreRing score={feedback.score} />
                <div>
                  <p className="text-base font-bold text-gray-900 dark:text-slate-100">
                    {feedback.score >= 8 ? "Excellent explanation!" : feedback.score >= 5 ? "Good start — a few gaps" : "Needs more work"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                    {feedback.score >= 8 ? "You clearly understand this topic." : feedback.score >= 5 ? "You got the core idea — fill in the gaps below." : "Read the model explanation and try again."}
                  </p>
                </div>
              </div>

              {/* Strengths */}
              {feedback.strengths.length > 0 && (
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-emerald-600">What you got right</p>
                  <ul className="space-y-2">
                    {feedback.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 rounded-lg border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2.5 text-sm text-emerald-800 dark:text-emerald-300">
                        <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Gaps */}
              {feedback.gaps.length > 0 && (
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-amber-600">What you missed</p>
                  <ul className="space-y-2">
                    {feedback.gaps.map((g, i) => (
                      <li key={i} className="flex items-start gap-2 rounded-lg border border-amber-100 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 px-3 py-2.5 text-sm text-amber-800 dark:text-amber-300">
                        <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
                        {g}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Model explanation */}
              <div>
                <button
                  onClick={() => setShowModel((v) => !v)}
                  className="flex w-full items-center justify-between rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50 dark:bg-indigo-950/20 px-4 py-3 text-sm font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-950/40 transition-colors"
                >
                  <span>See a strong example answer</span>
                  <svg className={`h-4 w-4 transition-transform ${showModel ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
                </button>
                {showModel && (
                  <div className="mt-2 rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-white dark:bg-slate-800 p-4 text-sm leading-relaxed text-gray-700 dark:text-slate-200">
                    {feedback.improvedExplanation}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => { setExplanation(""); setPhase("write"); setFeedback(null); setShowModel(false); }}
                  className="flex-1 rounded-xl border border-gray-200 dark:border-slate-600 py-2.5 text-sm font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Try again
                </button>
                <button onClick={onClose} className="flex-1 rounded-xl bg-orange-500 py-2.5 text-sm font-bold text-white hover:bg-orange-400 transition-colors">
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
