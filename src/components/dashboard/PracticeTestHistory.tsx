"use client";

import { TestAttempt } from "@/lib/types";
import { FREE_HISTORY_LIMIT } from "@/lib/usePracticeTests";

interface Props {
  attempts: TestAttempt[];
  isPro: boolean;
  onBack: () => void;
  onReview: (attempt: TestAttempt) => void;
  onUpgradeClick: () => void;
}

const DIFFICULTY_BADGE: Record<string, { label: string; className: string }> = {
  easy: { label: "Easy", className: "bg-emerald-100 text-emerald-700" },
  medium: { label: "Medium", className: "bg-amber-100 text-amber-700" },
  hard: { label: "Hard", className: "bg-red-100 text-red-700" },
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function ScoreDisplay({ score }: { score: number }) {
  if (score === -1) {
    return (
      <span className="text-sm font-semibold text-gray-400">Review</span>
    );
  }
  const colorClass =
    score >= 80 ? "text-emerald-600" : score >= 60 ? "text-amber-600" : "text-red-500";
  return (
    <span className={`text-xl font-extrabold ${colorClass}`}>
      {score}
      <span className="text-sm font-bold text-gray-400">%</span>
    </span>
  );
}

export default function PracticeTestHistory({
  attempts,
  isPro,
  onBack,
  onReview,
  onUpgradeClick,
}: Props) {
  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Test History</h1>
          <p className="mt-1 text-sm text-gray-500">
            {attempts.length === 0
              ? "No tests taken yet."
              : `${attempts.length} test${attempts.length !== 1 ? "s" : ""} taken`}
          </p>
        </div>
        <button
          onClick={onBack}
          className="text-sm font-medium text-gray-400 hover:text-indigo-500 transition-colors"
        >
          ← New Test
        </button>
      </div>

      {/* Empty state */}
      {attempts.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50">
            <svg className="h-7 w-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-500">No tests yet</p>
          <p className="mt-1 text-xs text-gray-400">
            Take your first practice test to see your history here.
          </p>
          <button
            onClick={onBack}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
          >
            Take a test
          </button>
        </div>
      )}

      {/* Attempt list */}
      {attempts.length > 0 && (
        <div className="space-y-3">
          {attempts.map((attempt) => {
            const badge = DIFFICULTY_BADGE[attempt.difficulty];
            return (
              <div
                key={attempt.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{attempt.topic}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                      <span className="text-xs text-gray-400">{attempt.totalQuestions} questions</span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-400">{formatDate(attempt.date)}</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <ScoreDisplay score={attempt.score} />
                    {attempt.score !== -1 && (
                      <p className="text-[10px] text-gray-400">
                        {attempt.correctCount}/{attempt.mcCount} correct
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => onReview(attempt)}
                    className="rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
                  >
                    Review →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Free history limit notice */}
      {!isPro && attempts.length >= FREE_HISTORY_LIMIT && (
        <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-gray-700">Unlimited test history</p>
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    ⚡ Pro
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  Free plan shows your last {FREE_HISTORY_LIMIT} tests.
                </p>
              </div>
            </div>
            <button
              onClick={onUpgradeClick}
              className="shrink-0 rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              Unlock
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
