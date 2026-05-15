"use client";

import { useState } from "react";

interface ExplanationResult {
  simpleExplanation: string;
  realWorldExample: string;
  commonMisconceptions: string[];
  keyPoints: string[];
}

interface Props {
  courseName: string;
  courseContext?: string;
  onClose: () => void;
}

export default function ExplainerPanel({ courseName, courseContext, onClose }: Props) {
  const [concept, setConcept] = useState("");
  const [result, setResult] = useState<ExplanationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExplain() {
    if (!concept.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concept: concept.trim(),
          courseContext: courseContext?.slice(0, 1000) ?? courseName,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to explain concept.");
        return;
      }
      setResult(json.explanation);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-sm bg-white shadow-2xl flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div>
            <p className="text-[10px] font-semibold text-violet-600 uppercase tracking-wider">
              AI Concept Explainer
            </p>
            <h2 className="text-sm font-bold text-gray-900 truncate max-w-[200px]">
              {courseName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-b border-gray-100 shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleExplain()}
              placeholder="Type any concept or term…"
              className="flex-1 min-w-0 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-violet-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-100 transition-all"
            />
            <button
              onClick={handleExplain}
              disabled={!concept.trim() || loading}
              className="shrink-0 rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
                "Ask"
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          {!result && !loading && !error && (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-xl">
                ?
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">
                  Explain any concept instantly
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Simple explanation · real example · key points
                </p>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Simple explanation */}
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-violet-600">
                  Simple Explanation
                </p>
                <p className="text-sm leading-relaxed text-gray-700">
                  {result.simpleExplanation}
                </p>
              </div>

              {/* Real-world example */}
              <div className="rounded-xl border border-violet-100 bg-violet-50 p-3">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-violet-600">
                  Real-World Example
                </p>
                <p className="text-sm leading-relaxed text-violet-900">
                  {result.realWorldExample}
                </p>
              </div>

              {/* Key points */}
              {result.keyPoints.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                    Key Points to Remember
                  </p>
                  <ul className="space-y-2">
                    {result.keyPoints.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-600">
                          {i + 1}
                        </span>
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Common misconceptions */}
              {result.commonMisconceptions.length > 0 && (
                <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-600">
                    Common Misconceptions
                  </p>
                  <ul className="space-y-2">
                    {result.commonMisconceptions.map((m, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-amber-800">
                        <span className="mt-0.5 shrink-0 font-bold text-amber-400">!</span>
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Divider for follow-up */}
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs text-gray-400 text-center">
                  Ask about another concept above
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
