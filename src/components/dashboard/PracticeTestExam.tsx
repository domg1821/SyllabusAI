"use client";

import { useState, useEffect } from "react";
import { TestQuestion, MCQuestion, Difficulty } from "@/lib/types";

interface Props {
  topic: string;
  difficulty: Difficulty;
  questions: TestQuestion[];
  userAnswers: Record<string, string>;
  onAnswerChange: (questionId: string, answer: string) => void;
  onSubmit: () => void;
}

const DIFFICULTY_BADGE: Record<Difficulty, { label: string; className: string }> = {
  easy:   { label: "Easy",   className: "bg-emerald-100 text-emerald-700" },
  medium: { label: "Medium", className: "bg-amber-100 text-amber-700"    },
  hard:   { label: "Hard",   className: "bg-red-100 text-red-700"        },
};

// ─── Main Component ────────────────────────────────────────────────────────────

export default function PracticeTestExam({
  topic,
  difficulty,
  questions,
  userAnswers,
  onAnswerChange,
  onSubmit,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  if (!questions.length) return null;

  const question = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const isMC = question.type === "multiple_choice";
  const isRevealed = revealedIds.has(question.id);
  const answer = userAnswers[question.id] ?? "";
  const badge = DIFFICULTY_BADGE[difficulty];

  const canAdvance = isMC ? isRevealed : true;
  const progressPct = ((currentIndex + (canAdvance ? 1 : 0)) / questions.length) * 100;

  function handleMCAnswer(questionId: string, letter: string) {
    if (revealedIds.has(questionId)) return;
    onAnswerChange(questionId, letter);
    setRevealedIds((prev) => new Set([...prev, questionId]));
  }

  function handleNext() {
    if (isLast) {
      onSubmit();
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Progress header */}
      <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-gray-900 dark:text-slate-100 leading-snug">{topic}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}>
                {badge.label}
              </span>
              <span className="text-xs text-gray-500 dark:text-slate-400">
                {questions.length} question{questions.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="flex items-baseline gap-0.5 justify-end">
              <span className="text-3xl font-extrabold tabular-nums text-gray-900 dark:text-slate-100">
                {currentIndex + 1}
              </span>
              <span className="text-lg font-normal text-gray-400 dark:text-slate-500">/{questions.length}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400">question</p>
          </div>
        </div>
        {/* Animated progress bar */}
        <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-slate-700">
          <div
            className={`h-2 rounded-full animate-progress-fill ${
              isLast && canAdvance
                ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                : "bg-gradient-to-r from-indigo-500 to-violet-500"
            }`}
            style={{
              "--progress-width": `${progressPct}%`,
              animationDuration: "600ms",
              animationTimingFunction: "ease-out",
              animationFillMode: "both",
            } as React.CSSProperties}
          />
        </div>
        {isLast && canAdvance && (
          <p className="mt-2 text-center text-xs font-medium text-emerald-600 dark:text-emerald-400">
            Last question — ready to submit!
          </p>
        )}
      </div>

      {/* Single question */}
      <QuestionCard
        question={question}
        index={currentIndex}
        answer={answer}
        isRevealed={isRevealed}
        onMCAnswer={(letter) => handleMCAnswer(question.id, letter)}
        onSAChange={(v) => onAnswerChange(question.id, v)}
      />

      {/* Next / Submit — gated for MC until explanation appears */}
      {canAdvance && (
        <div className="pb-8">
          <button
            onClick={handleNext}
            className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-500 active:scale-[0.99] transition-all"
          >
            {isLast ? "Submit Test" : "Next Question →"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Question Card ─────────────────────────────────────────────────────────────

function QuestionCard({
  question,
  index,
  answer,
  isRevealed,
  onMCAnswer,
  onSAChange,
}: {
  question: TestQuestion;
  index: number;
  answer: string;
  isRevealed: boolean;
  onMCAnswer: (letter: string) => void;
  onSAChange: (v: string) => void;
}) {
  const isMC = question.type === "multiple_choice";
  const mc = question as MCQuestion;
  const isCorrect = isMC && answer === mc.correctAnswer;

  // Trigger shake or glow animation when answer is revealed
  const [animClass, setAnimClass] = useState("");
  useEffect(() => {
    if (!isRevealed) return;
    const cls = isCorrect ? "animate-correct-glow" : "animate-shake";
    setAnimClass(cls);
    const timer = setTimeout(() => setAnimClass(""), isCorrect ? 650 : 430);
    return () => clearTimeout(timer);
  }, [isRevealed, isCorrect]);

  let border = "border-gray-200 dark:border-slate-700";
  if (isRevealed) border = isCorrect ? "border-emerald-300 dark:border-emerald-700" : "border-red-300 dark:border-red-800";
  else if (answer) border = "border-indigo-200 dark:border-indigo-700";

  let bg = "bg-white dark:bg-slate-800";
  if (isRevealed) bg = isCorrect ? "bg-emerald-50/40 dark:bg-emerald-950/30" : "bg-red-50/30 dark:bg-red-950/20";

  return (
    <div className={`rounded-2xl border p-5 shadow-sm transition-all ${border} ${bg} ${animClass}`}>
      {/* Header */}
      <div className="mb-4 flex items-start gap-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
          isRevealed
            ? isCorrect ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
            : answer ? "bg-indigo-600 text-white" : "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400"
        }`}>
          {index + 1}
        </div>
        <div className="flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${
              isMC ? "text-indigo-500" : "text-violet-500"
            }`}>
              {isMC ? "Multiple Choice" : "Short Answer"}
            </span>
            {isRevealed && (
              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                isCorrect ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
              }`}>
                · {isCorrect ? "✓ Correct" : "✗ Incorrect"}
              </span>
            )}
          </div>
          <p className="text-sm font-medium leading-relaxed text-gray-900 dark:text-slate-100">{question.question}</p>
        </div>
      </div>

      {isMC ? (
        <MCAnswerInput
          question={mc}
          selected={answer}
          isRevealed={isRevealed}
          isCorrect={isCorrect}
          onAnswer={onMCAnswer}
        />
      ) : (
        <SAAnswerInput value={answer} onChange={onSAChange} />
      )}
    </div>
  );
}

// ─── Multiple Choice Input ─────────────────────────────────────────────────────

function MCAnswerInput({
  question,
  selected,
  isRevealed,
  isCorrect,
  onAnswer,
}: {
  question: MCQuestion;
  selected: string;
  isRevealed: boolean;
  isCorrect: boolean;
  onAnswer: (letter: string) => void;
}) {
  return (
    <div className="ml-11 space-y-2.5">
      {question.options
        .filter((opt) => opt.trim().length > 0)
        .map((option) => {
          const letter = option[0];
          const isSelected = selected === letter;
          const isCorrectAnswer = question.correctAnswer === letter;

          let cls =
            "flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all duration-200 ";

          if (isRevealed) {
            if (isCorrectAnswer) {
              cls += "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-700 cursor-default";
            } else if (isSelected && !isCorrect) {
              cls += "border-red-400 bg-red-50 dark:bg-red-950/40 dark:border-red-700 cursor-default";
            } else {
              cls += "border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 opacity-50 cursor-default";
            }
          } else {
            cls += isSelected
              ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 dark:border-indigo-600 ring-1 ring-indigo-200 dark:ring-indigo-800 cursor-pointer"
              : "border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 cursor-pointer";
          }

          const dotCls = isRevealed
            ? isCorrectAnswer
              ? "bg-emerald-600 text-white"
              : isSelected && !isCorrect
                ? "bg-red-500 text-white"
                : "bg-gray-200 dark:bg-slate-600 text-gray-400 dark:text-slate-400"
            : isSelected
              ? "bg-indigo-600 text-white"
              : "border border-gray-300 dark:border-slate-500 text-gray-400 dark:text-slate-400";

          return (
            <button
              key={letter}
              onClick={() => !isRevealed && onAnswer(letter)}
              disabled={isRevealed}
              className={cls}
            >
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${dotCls}`}>
                {isRevealed && isCorrectAnswer
                  ? "✓"
                  : isRevealed && isSelected && !isCorrect
                    ? "✗"
                    : letter}
              </div>
              <span className={`text-sm leading-snug ${
                isRevealed
                  ? isCorrectAnswer
                    ? "font-semibold text-emerald-900 dark:text-emerald-200"
                    : isSelected && !isCorrect
                      ? "font-semibold text-red-900 dark:text-red-200"
                      : "text-gray-400 dark:text-slate-500"
                  : isSelected
                    ? "font-medium text-indigo-900 dark:text-indigo-200"
                    : "text-gray-700 dark:text-slate-200"
              }`}>
                {option.slice(3)}
              </span>
            </button>
          );
        })}

      {/* Inline explanation */}
      {isRevealed && (
        <div className={`mt-1 rounded-xl border px-4 py-3 ${
          isCorrect
            ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30"
            : "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30"
        }`}>
          <p className={`mb-1 text-[10px] font-semibold uppercase tracking-wide ${
            isCorrect ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
          }`}>
            {isCorrect ? "Why that's correct" : "Explanation"}
          </p>
          <p className="text-sm leading-relaxed text-gray-700 dark:text-slate-300">
            {isCorrect
              ? question.explanation
              : (question.wrongExplanation || question.explanation)}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Short Answer Input ────────────────────────────────────────────────────────

function SAAnswerInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="ml-11">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write your answer here…"
        rows={4}
        className="w-full resize-none rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 p-3 text-sm leading-relaxed text-gray-700 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all"
      />
      <p className="mt-1 text-right text-xs text-gray-500 dark:text-slate-400">{value.length} chars</p>
    </div>
  );
}
