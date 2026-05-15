"use client";

import { useState, useEffect } from "react";
import { Flashcard, StudySession } from "@/lib/types";
import { saveStudySession } from "@/lib/useStudySessions";
import ExplainerPanel from "./ExplainerPanel";

interface Props {
  chapterName: string;
  courseName: string;
  courseContext?: string;
  onClose: () => void;
}

const DIFFICULTY_BADGE: Record<Flashcard["difficulty"], string> = {
  easy:   "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  hard:   "bg-red-100 text-red-700",
};

function formatDuration(ms: number): string {
  const secs = Math.round(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export default function FlashcardMode({
  chapterName,
  courseName,
  courseContext,
  onClose,
}: Props) {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  // Study state
  const [queue, setQueue] = useState<number[]>([]);
  const [mastered, setMastered] = useState<Set<number>>(new Set());
  const [isFlipped, setIsFlipped] = useState(false);
  const [phase, setPhase] = useState<"loading" | "studying" | "complete">("loading");
  const [startTime] = useState(Date.now());
  const [completedAt, setCompletedAt] = useState<number | null>(null);
  const [showExplainer, setShowExplainer] = useState(false);
  const [showHint, setShowHint] = useState(() => {
    if (typeof window === "undefined") return false;
    return !localStorage.getItem("sai_flashcard_hint_shown");
  });

  useEffect(() => {
    async function fetchCards() {
      try {
        const res = await fetch("/api/flashcards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: chapterName,
            chapterName,
            courseContext: courseContext?.slice(0, 1000),
            count: 12,
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json.error ?? "Failed to generate flashcards.");
          setLoading(false);
          return;
        }
        const fetched: Flashcard[] = json.cards ?? [];
        setCards(fetched);
        setQueue(fetched.map((_, i) => i));
        setIsMock(json.mock ?? false);
        setPhase("studying");
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchCards();
  }, [chapterName, courseContext]);

  const currentIdx = queue[0] ?? null;
  const currentCard = currentIdx !== null ? cards[currentIdx] : null;
  const totalCards = cards.length;
  const masteredCount = mastered.size;
  const progressPct = totalCards > 0 ? (masteredCount / totalCards) * 100 : 0;

  function handleGotIt() {
    if (currentIdx === null) return;
    const newMastered = new Set([...mastered, currentIdx]);
    const newQueue = queue.slice(1);
    setIsFlipped(false);
    if (newQueue.length === 0) {
      const now = Date.now();
      const session: StudySession = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        chapter: chapterName,
        courseName,
        duration: now - startTime,
      };
      saveStudySession(session);
      setCompletedAt(now);
      setMastered(newMastered);
      setPhase("complete");
    } else {
      setMastered(newMastered);
      setQueue(newQueue);
    }
  }

  function handleReviewAgain() {
    if (currentIdx === null) return;
    setQueue((prev) => [...prev.slice(1), prev[0]]);
    setIsFlipped(false);
  }

  function handleRestart() {
    setMastered(new Set());
    setQueue(cards.map((_, i) => i));
    setIsFlipped(false);
    setPhase("studying");
  }

  const duration = completedAt ? completedAt - startTime : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider">
              Flashcards
            </p>
            <h2 className="text-sm font-bold text-gray-900 truncate">{chapterName}</h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {phase === "studying" && (
              <button
                onClick={() => setShowExplainer(true)}
                className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100 transition-colors"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
                  />
                </svg>
                Explain
              </button>
            )}
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
        </div>

        <div className="p-5">
          {/* Mock banner */}
          {isMock && phase === "studying" && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <span className="font-semibold">Demo mode —</span> Sample cards shown (no API key).
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center gap-3 py-14">
              <svg
                className="h-8 w-8 animate-spin text-indigo-400"
                fill="none"
                viewBox="0 0 24 24"
              >
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
              <p className="text-sm text-gray-500">Generating flashcards…</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={onClose}
                className="text-xs font-medium text-gray-400 hover:text-gray-600"
              >
                Close
              </button>
            </div>
          )}

          {/* Studying */}
          {phase === "studying" && currentCard && (
            <>
              {/* Progress bar */}
              <div className="mb-4">
                <div className="mb-1.5 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    <span className="font-semibold text-gray-900 dark:text-slate-100">{masteredCount}</span> of{" "}
                    {totalCards} mastered
                  </span>
                  <span>{queue.length} remaining</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-100">
                  <div
                    className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* Flip card */}
              <div
                style={{ perspective: "1000px" }}
                onClick={!isFlipped ? () => {
                  if (showHint) {
                    setShowHint(false);
                    localStorage.setItem("sai_flashcard_hint_shown", "1");
                  }
                  setIsFlipped(true);
                } : undefined}
                className={!isFlipped ? "cursor-pointer" : ""}
              >
                <div
                  style={{
                    transformStyle: "preserve-3d",
                    transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                    transition: "transform 0.45s ease",
                    position: "relative",
                    height: "210px",
                  }}
                >
                  {/* Front */}
                  <div
                    style={{ backfaceVisibility: "hidden", position: "absolute", inset: 0 }}
                    className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-gradient-to-br from-indigo-50 to-violet-50 p-6 text-center"
                  >
                    <span
                      className={`mb-3 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        DIFFICULTY_BADGE[currentCard.difficulty]
                      }`}
                    >
                      {currentCard.difficulty}
                    </span>
                    <p className="text-base font-semibold leading-relaxed text-gray-900">
                      {currentCard.front}
                    </p>
                    {showHint ? (
                      <div className="mt-4 flex items-center gap-1.5 text-xs text-indigo-400">
                        <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                        Click to reveal answer
                      </div>
                    ) : (
                      <p className="mt-4 text-xs text-gray-400">Tap to reveal</p>
                    )}
                  </div>
                  {/* Back */}
                  <div
                    style={{
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                      position: "absolute",
                      inset: 0,
                    }}
                    className="flex flex-col items-center justify-center rounded-2xl border border-indigo-200 bg-white p-6 text-center"
                  >
                    <p className="text-sm leading-relaxed text-gray-700">{currentCard.back}</p>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="mt-4">
                {isFlipped ? (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleReviewAgain}
                      className="flex items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white py-3 text-sm font-semibold text-gray-600 hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98] transition-all"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"
                        />
                      </svg>
                      Review again
                    </button>
                    <button
                      onClick={handleGotIt}
                      className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-500 active:scale-[0.98] transition-all"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m4.5 12.75 6 6 9-13.5"
                        />
                      </svg>
                      Got it ✓
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      if (showHint) {
                        setShowHint(false);
                        localStorage.setItem("sai_flashcard_hint_shown", "1");
                      }
                      setIsFlipped(true);
                    }}
                    className="w-full rounded-xl border border-indigo-200 bg-indigo-50 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 active:scale-[0.99] transition-all"
                  >
                    Reveal answer
                  </button>
                )}
              </div>
            </>
          )}

          {/* Complete */}
          {phase === "complete" && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-3xl">
                🎉
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">All {totalCards} cards mastered!</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Session complete in {formatDuration(duration)}.
                </p>
                <p className="mt-0.5 text-xs text-gray-400">Session saved to your study history.</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleRestart}
                  className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Study again
                </button>
                <button
                  onClick={onClose}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showExplainer && (
        <ExplainerPanel
          courseName={courseName}
          courseContext={courseContext}
          onClose={() => setShowExplainer(false)}
        />
      )}
    </div>
  );
}
