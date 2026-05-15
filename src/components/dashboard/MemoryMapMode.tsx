"use client";

import { useState, useEffect } from "react";
import { SavedClass } from "@/lib/types";

interface Concept {
  term: string;
  definition: string;
  connections: string[];
  importance: "core" | "supporting" | "detail";
}

interface Props {
  topic: string;
  cls: SavedClass;
  onClose: () => void;
  onQuizMe: (topic: string) => void;
}

const IMPORTANCE_CONFIG = {
  core: {
    label: "Core",
    card: "border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/40",
    badge: "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300",
    dot: "bg-indigo-500",
    size: "text-sm font-bold",
  },
  supporting: {
    label: "Supporting",
    card: "border-violet-200 dark:border-violet-800/60 bg-violet-50 dark:bg-violet-950/30",
    badge: "bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300",
    dot: "bg-violet-400",
    size: "text-sm font-semibold",
  },
  detail: {
    label: "Detail",
    card: "border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800",
    badge: "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400",
    dot: "bg-gray-300 dark:bg-slate-500",
    size: "text-xs font-semibold",
  },
} as const;

function ConceptCard({
  concept,
  mastered,
  onToggle,
}: {
  concept: Concept;
  mastered: boolean;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = IMPORTANCE_CONFIG[concept.importance];

  return (
    <div
      className={`relative rounded-xl border p-3.5 transition-all duration-200 ${cfg.card} ${mastered ? "opacity-60" : ""}`}
    >
      {mastered && (
        <div className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
          <svg className="h-3 w-3 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
      )}

      <div className="mb-2 flex items-start gap-2 pr-6">
        <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${cfg.dot}`} />
        <button onClick={() => setExpanded((v) => !v)} className="text-left">
          <p className={`leading-snug text-gray-900 dark:text-slate-100 ${cfg.size}`}>{concept.term}</p>
        </button>
      </div>

      {expanded && (
        <p className="mb-3 ml-4 text-xs leading-relaxed text-gray-600 dark:text-slate-300">
          {concept.definition}
        </p>
      )}

      {!expanded && (
        <button onClick={() => setExpanded(true)} className="ml-4 text-[10px] text-gray-400 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">
          See definition →
        </button>
      )}

      <div className="mt-2.5 ml-4 flex flex-wrap gap-1.5">
        <button
          onClick={onToggle}
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold transition-all ${
            mastered
              ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300"
              : "border border-gray-200 dark:border-slate-600 text-gray-400 dark:text-slate-500 hover:border-emerald-300 hover:text-emerald-600 dark:hover:text-emerald-400"
          }`}
        >
          {mastered ? "✓ Know it" : "Know it"}
        </button>
      </div>
    </div>
  );
}

export default function MemoryMapMode({ topic, cls, onClose, onQuizMe }: Props) {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);
  const [mastered, setMastered] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchConcepts() {
      try {
        const res = await fetch("/api/memory-map", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic,
            chapterName: topic,
            courseContext: cls.rawText?.slice(0, 1000),
          }),
        });
        const json = await res.json();
        if (!res.ok) { setError(json.error ?? "Failed to generate memory map."); return; }
        setConcepts(json.concepts ?? []);
        setIsMock(json.mock ?? false);
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchConcepts();
  }, [topic, cls.rawText]);

  const toggleMastered = (term: string) => {
    setMastered((prev) => {
      const next = new Set(prev);
      if (next.has(term)) next.delete(term);
      else next.add(term);
      return next;
    });
  };

  const byImportance = {
    core: concepts.filter((c) => c.importance === "core"),
    supporting: concepts.filter((c) => c.importance === "supporting"),
    detail: concepts.filter((c) => c.importance === "detail"),
  };

  const masteredCount = mastered.size;
  const totalCount = concepts.length;
  const pct = totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700 shrink-0">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold text-violet-600 uppercase tracking-wider">Memory Map</p>
            <h2 className="text-sm font-bold text-gray-900 dark:text-slate-100 truncate">{topic}</h2>
          </div>
          <button onClick={onClose} className="shrink-0 ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        {!loading && concepts.length > 0 && (
          <div className="px-5 pt-3 pb-2 shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-500 dark:text-slate-400">
                <span className="font-bold text-gray-900 dark:text-slate-100">{masteredCount}</span> of {totalCount} concepts mastered
              </span>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{pct}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-slate-700">
              <div className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5">
          {loading && (
            <div className="flex flex-col items-center gap-3 py-12">
              <svg className="h-7 w-7 animate-spin text-violet-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm text-gray-500 dark:text-slate-400">Mapping key concepts…</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-sm text-red-500">{error}</p>
              <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600">Close</button>
            </div>
          )}

          {isMock && !loading && (
            <div className="mb-4 rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
              <span className="font-semibold">Demo mode —</span> Sample concepts shown (no API key).
            </div>
          )}

          {!loading && !error && concepts.length > 0 && (
            <div className="space-y-5">
              {byImportance.core.length > 0 && (
                <section>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-indigo-500" />
                    <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Core Concepts</p>
                  </div>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {byImportance.core.map((c) => (
                      <ConceptCard key={c.term} concept={c} mastered={mastered.has(c.term)} onToggle={() => toggleMastered(c.term)} />
                    ))}
                  </div>
                </section>
              )}

              {byImportance.supporting.length > 0 && (
                <section>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-violet-400" />
                    <p className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">Supporting Concepts</p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {byImportance.supporting.map((c) => (
                      <ConceptCard key={c.term} concept={c} mastered={mastered.has(c.term)} onToggle={() => toggleMastered(c.term)} />
                    ))}
                  </div>
                </section>
              )}

              {byImportance.detail.length > 0 && (
                <section>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-gray-300 dark:bg-slate-500" />
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">Details &amp; Nuance</p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {byImportance.detail.map((c) => (
                      <ConceptCard key={c.term} concept={c} mastered={mastered.has(c.term)} onToggle={() => toggleMastered(c.term)} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && concepts.length > 0 && (
          <div className="border-t border-gray-100 dark:border-slate-700 px-5 py-3 shrink-0 flex gap-3">
            <button
              onClick={() => onQuizMe(`${topic} — ${cls.name}`)}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/30 py-2.5 text-sm font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 transition-colors"
            >
              📝 Quiz me on these
            </button>
            <button onClick={onClose} className="rounded-xl border border-gray-200 dark:border-slate-600 px-5 py-2.5 text-sm font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
