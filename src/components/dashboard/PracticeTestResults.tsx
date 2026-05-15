"use client";

import { useState } from "react";
import { TestAttempt, TestQuestion, MCQuestion, SAQuestion } from "@/lib/types";
import { LockedFeatureCard } from "./UpgradeModal";

interface Props {
  attempt: TestAttempt;
  isPro: boolean;
  isHistoryReview?: boolean;
  onNewTest: () => void;
  onViewHistory: () => void;
  onUpgrade: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPerformanceMessage(score: number): { message: string; emoji: string } {
  if (score >= 90) return { message: "Outstanding! You've mastered this material.", emoji: "🏆" };
  if (score >= 80) return { message: "Great work! Strong understanding overall.",   emoji: "🎯" };
  if (score >= 70) return { message: "Good job. A few areas to review.",            emoji: "👍" };
  if (score >= 60) return { message: "Passing, but there's room to improve.",       emoji: "📚" };
  if (score >= 50) return { message: "Keep studying — you're about halfway there.", emoji: "💪" };
  return               { message: "This topic needs more practice. Don't give up!", emoji: "🔄" };
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-500";
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min > 0) return `${min}m ${sec}s`;
  return `${totalSec}s`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PracticeTestResults({
  attempt,
  isPro,
  isHistoryReview = false,
  onNewTest,
  onViewHistory,
  onUpgrade,
}: Props) {
  const [reviewOpen, setReviewOpen] = useState(false);

  const isReviewMode = attempt.score === -1;
  const { message, emoji } = isReviewMode
    ? { message: "Review your answers against the model answers below.", emoji: "📝" }
    : getPerformanceMessage(attempt.score);

  const difficultyBadge: Record<string, { label: string; className: string }> = {
    easy:   { label: "Easy",   className: "bg-emerald-100 text-emerald-700" },
    medium: { label: "Medium", className: "bg-amber-100 text-amber-700"    },
    hard:   { label: "Hard",   className: "bg-red-100 text-red-700"        },
  };
  const badge = difficultyBadge[attempt.difficulty];

  const mcQuestions = attempt.questions.filter(
    (q): q is MCQuestion => q.type === "multiple_choice"
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* ── Score card ── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        {/* Meta row */}
        <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}>
            {badge.label}
          </span>
          <span className="text-xs text-gray-400">{attempt.totalQuestions} questions</span>
          <span className="text-xs text-gray-300">·</span>
          <span className="text-xs text-gray-400 max-w-[14rem] truncate">{attempt.topic}</span>
        </div>

        {/* Score */}
        <div className="text-center">
          {isReviewMode ? (
            <div className="text-4xl font-extrabold text-gray-400">—</div>
          ) : (
            <div className={`text-6xl font-extrabold ${scoreColor(attempt.score)}`}>
              {attempt.score}
              <span className="text-3xl font-bold text-gray-400">%</span>
            </div>
          )}
        </div>

        {/* Stats row */}
        {!isReviewMode && (
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-emerald-50 px-3 py-2.5">
              <p className="text-xl font-bold text-emerald-700">{attempt.correctCount}</p>
              <p className="text-[10px] font-medium text-emerald-600 uppercase tracking-wide">Correct</p>
            </div>
            <div className="rounded-xl bg-red-50 px-3 py-2.5">
              <p className="text-xl font-bold text-red-500">{attempt.mcCount - attempt.correctCount}</p>
              <p className="text-[10px] font-medium text-red-500 uppercase tracking-wide">Incorrect</p>
            </div>
            <div className="rounded-xl bg-gray-50 px-3 py-2.5">
              <p className="text-xl font-bold text-gray-700">
                {attempt.duration != null ? formatDuration(attempt.duration) : "—"}
              </p>
              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Time</p>
            </div>
          </div>
        )}

        {/* Message */}
        <div className="mt-4 rounded-xl bg-gray-50 px-5 py-3 text-center">
          <span className="mr-1.5">{emoji}</span>
          <span className="text-sm text-gray-600">{message}</span>
        </div>

        {attempt.questionType !== "multiple_choice" && !isReviewMode && (
          <p className="mt-3 text-center text-xs text-gray-400">
            Score reflects multiple choice only. Short answer shown below for self-review.
          </p>
        )}

        {/* MC quick-scan strip */}
        {mcQuestions.length > 0 && !isReviewMode && (
          <div className="mt-5">
            <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              Question breakdown
            </p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {attempt.questions.map((q, i) => {
                if (q.type !== "multiple_choice") {
                  return (
                    <div
                      key={q.id}
                      title={`Q${i + 1}: Short answer`}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-violet-200 bg-violet-50 text-[10px] font-bold text-violet-500"
                    >
                      {i + 1}
                    </div>
                  );
                }
                const mc = q as MCQuestion;
                const userAns = attempt.userAnswers[q.id] ?? "";
                const correct = userAns === mc.correctAnswer;
                return (
                  <div
                    key={q.id}
                    title={`Q${i + 1}: ${correct ? "Correct" : userAns ? "Incorrect" : "Skipped"}`}
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                      !userAns
                        ? "bg-gray-300"
                        : correct
                          ? "bg-emerald-500"
                          : "bg-red-400"
                    }`}
                  >
                    {correct ? "✓" : userAns ? "✗" : i + 1}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Review answers toggle ── */}
      <button
        onClick={() => setReviewOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
      >
        <span>Review Answers</span>
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform ${reviewOpen ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* ── Detailed review ── */}
      {reviewOpen && (
        <div className="space-y-4">
          {attempt.questions.map((question, index) => (
            <QuestionReview
              key={question.id}
              question={question}
              index={index}
              userAnswer={attempt.userAnswers[question.id] ?? ""}
              isPro={isPro}
              onUpgrade={onUpgrade}
            />
          ))}
        </div>
      )}

      {/* ── Actions ── */}
      <div className="flex gap-3 pb-8">
        {!isHistoryReview && (
          <button
            onClick={onNewTest}
            className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-500 transition-colors"
          >
            New Test
          </button>
        )}
        <button
          onClick={onViewHistory}
          className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          {isHistoryReview ? "← Back to History" : "Test History"}
        </button>
      </div>
    </div>
  );
}

// ─── Individual Question Review ───────────────────────────────────────────────

function QuestionReview({
  question,
  index,
  userAnswer,
  isPro,
  onUpgrade,
}: {
  question: TestQuestion;
  index: number;
  userAnswer: string;
  isPro: boolean;
  onUpgrade: () => void;
}) {
  if (question.type === "multiple_choice") {
    return (
      <MCReview
        question={question as MCQuestion}
        index={index}
        userAnswer={userAnswer}
        isPro={isPro}
        onUpgrade={onUpgrade}
      />
    );
  }
  return (
    <SAReview
      question={question as SAQuestion}
      index={index}
      userAnswer={userAnswer}
      isPro={isPro}
      onUpgrade={onUpgrade}
    />
  );
}

// ─── MC Review ────────────────────────────────────────────────────────────────

function MCReview({
  question,
  index,
  userAnswer,
  isPro,
  onUpgrade,
}: {
  question: MCQuestion;
  index: number;
  userAnswer: string;
  isPro: boolean;
  onUpgrade: () => void;
}) {
  const isCorrect = userAnswer === question.correctAnswer;
  const didAnswer = userAnswer.trim().length > 0;

  return (
    <div className={`rounded-2xl border p-5 ${
      !didAnswer
        ? "border-gray-200 bg-white"
        : isCorrect
          ? "border-emerald-200 bg-emerald-50/40"
          : "border-red-200 bg-red-50/40"
    }`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 flex-1">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
            {index + 1}
          </span>
          <p className="text-sm font-medium text-gray-900 leading-snug">{question.question}</p>
        </div>
        <StatusBadge correct={isCorrect} answered={didAnswer} />
      </div>

      <div className="ml-8 space-y-1.5">
        {question.options.map((option) => {
          const letter = option[0];
          const isUserAnswer = userAnswer === letter;
          const isCorrectAnswer = question.correctAnswer === letter;

          let cls = "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm border border-transparent";
          if (isCorrectAnswer)
            cls += " bg-emerald-100 border-emerald-300 text-emerald-800 font-medium";
          else if (isUserAnswer && !isCorrect)
            cls += " bg-red-100 border-red-300 text-red-800 font-medium";
          else
            cls += " text-gray-500";

          return (
            <div key={letter} className={cls}>
              <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                isCorrectAnswer
                  ? "bg-emerald-600 text-white"
                  : isUserAnswer && !isCorrect
                    ? "bg-red-500 text-white"
                    : "bg-gray-200 text-gray-500"
              }`}>
                {isCorrectAnswer ? "✓" : isUserAnswer && !isCorrect ? "✗" : letter}
              </div>
              <span>{option.slice(3)}</span>
            </div>
          );
        })}
      </div>

      {isPro ? (
        <div className="ml-8 mt-3 space-y-2">
          <div className="rounded-xl bg-white border border-gray-100 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Explanation</p>
            <p className="text-sm text-gray-700 leading-relaxed">{question.explanation}</p>
          </div>
          {!isCorrect && question.wrongExplanation && (
            <div className="rounded-xl bg-white border border-gray-100 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-400 mb-1">Why the other options are wrong</p>
              <p className="text-sm text-gray-700 leading-relaxed">{question.wrongExplanation}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="ml-8 mt-3">
          <LockedFeatureCard
            title="Detailed Explanation"
            description="See why each answer is right or wrong with Pro."
            onUpgrade={onUpgrade}
          />
        </div>
      )}
    </div>
  );
}

// ─── SA Review ────────────────────────────────────────────────────────────────

function SAReview({
  question,
  index,
  userAnswer,
  isPro,
  onUpgrade,
}: {
  question: SAQuestion;
  index: number;
  userAnswer: string;
  isPro: boolean;
  onUpgrade: () => void;
}) {
  const didAnswer = userAnswer.trim().length > 0;

  return (
    <div className="rounded-2xl border border-violet-200 bg-violet-50/30 p-5">
      <div className="mb-3 flex items-start gap-2.5">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-600">
          {index + 1}
        </span>
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-500">
              Short Answer · Self-review
            </span>
          </div>
          <p className="text-sm font-medium text-gray-900 leading-snug">{question.question}</p>
        </div>
      </div>

      <div className="ml-8 space-y-3">
        <div className="rounded-xl bg-white border border-gray-200 px-4 py-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Your answer</p>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {didAnswer ? userAnswer : <span className="italic text-gray-400">No answer provided.</span>}
          </p>
        </div>
        <div className="rounded-xl bg-white border border-emerald-200 px-4 py-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-600">Model answer</p>
          <p className="text-sm text-gray-700 leading-relaxed">{question.sampleAnswer}</p>
        </div>
        {isPro ? (
          <>
            {question.keyPoints.length > 0 && (
              <div className="rounded-xl bg-white border border-gray-100 px-4 py-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Key points to include</p>
                <ul className="space-y-1">
                  {question.keyPoints.map((kp, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[9px] font-bold text-indigo-600">
                        {i + 1}
                      </span>
                      {kp}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="rounded-xl bg-white border border-gray-100 px-4 py-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">What makes a complete answer</p>
              <p className="text-sm text-gray-700 leading-relaxed">{question.explanation}</p>
            </div>
          </>
        ) : (
          <LockedFeatureCard
            title="Key Points & Deep Explanation"
            description="See exactly what a full-credit answer requires with Pro."
            onUpgrade={onUpgrade}
          />
        )}
      </div>
    </div>
  );
}

// ─── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ correct, answered }: { correct: boolean; answered: boolean }) {
  if (!answered) {
    return (
      <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500">
        Skipped
      </span>
    );
  }
  return correct ? (
    <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
      ✓ Correct
    </span>
  ) : (
    <span className="shrink-0 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-600">
      ✗ Incorrect
    </span>
  );
}
