"use client";

import { useState } from "react";
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
  // Set of question IDs whose answers are locked in (MC only)
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [submitWarning, setSubmitWarning] = useState(false);

  const saQuestions = questions.filter((q) => q.type === "short_answer");

  // "answered" = MC locked or SA has non-empty text
  const mcAnswered = revealedIds.size;
  const saAnswered = saQuestions.filter((q) => userAnswers[q.id]?.trim()).length;
  const answeredTotal = mcAnswered + saAnswered;
  const unansweredCount = questions.length - answeredTotal;
  const badge = DIFFICULTY_BADGE[difficulty];
  const progress = questions.length > 0 ? (answeredTotal / questions.length) * 100 : 0;

  function handleMCAnswer(questionId: string, letter: string) {
    if (revealedIds.has(questionId)) return;
    onAnswerChange(questionId, letter);
    setRevealedIds((prev) => new Set([...prev, questionId]));
  }

  function handleSubmitClick() {
    if (unansweredCount > 0) {
      setSubmitWarning(true);
      return;
    }
    onSubmit();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Progress header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-gray-900 leading-snug">{topic}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}>
                {badge.label}
              </span>
              <span className="text-xs text-gray-400">{questions.length} question{questions.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="flex items-baseline gap-0.5 justify-end">
              <span className={`text-3xl font-extrabold tabular-nums ${answeredTotal === questions.length ? "text-emerald-600" : "text-gray-900"}`}>
                {answeredTotal}
              </span>
              <span className="text-lg font-normal text-gray-400">/{questions.length}</span>
            </div>
            <p className="text-xs text-gray-400">answered</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-2 w-full rounded-full bg-gray-100">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              answeredTotal === questions.length
                ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                : "bg-gradient-to-r from-indigo-500 to-violet-500"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        {answeredTotal === questions.length && (
          <p className="mt-2 text-center text-xs font-medium text-emerald-600">
            All answered — ready to submit!
          </p>
        )}
      </div>

      {/* Questions */}
      <div className="space-y-5">
        {questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            index={index}
            answer={userAnswers[question.id] ?? ""}
            isRevealed={revealedIds.has(question.id)}
            onMCAnswer={(letter) => handleMCAnswer(question.id, letter)}
            onSAChange={(v) => onAnswerChange(question.id, v)}
          />
        ))}
      </div>

      {/* Unanswered warning */}
      {submitWarning && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-800">
            {unansweredCount} question{unansweredCount !== 1 ? "s" : ""} still unanswered.
          </p>
          <p className="mt-1 text-xs text-amber-700">
            Unanswered MC questions count as incorrect. Submit anyway?
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => { setSubmitWarning(false); onSubmit(); }}
              className="rounded-lg bg-amber-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-amber-500 transition-colors"
            >
              Submit anyway
            </button>
            <button
              onClick={() => setSubmitWarning(false)}
              className="rounded-lg border border-amber-200 px-4 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors"
            >
              Keep answering
            </button>
          </div>
        </div>
      )}

      {/* Submit */}
      <div className="pb-8">
        <button
          onClick={handleSubmitClick}
          className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-500 active:scale-[0.99] transition-all"
        >
          Submit Test
        </button>
        <p className="mt-2 text-center text-xs text-gray-400">
          {unansweredCount > 0
            ? `${unansweredCount} question${unansweredCount !== 1 ? "s" : ""} remaining`
            : "All questions answered — tap to see your results."}
        </p>
      </div>
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

  let border = "border-gray-200";
  if (isRevealed) border = isCorrect ? "border-emerald-300" : "border-red-300";
  else if (answer) border = "border-indigo-200";

  let bg = "bg-white";
  if (isRevealed) bg = isCorrect ? "bg-emerald-50/40" : "bg-red-50/30";

  return (
    <div className={`rounded-2xl border p-5 shadow-sm transition-all ${border} ${bg}`}>
      {/* Header */}
      <div className="mb-4 flex items-start gap-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
          isRevealed
            ? isCorrect ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
            : answer ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500"
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
                isCorrect ? "text-emerald-600" : "text-red-500"
              }`}>
                · {isCorrect ? "✓ Correct" : "✗ Incorrect"}
              </span>
            )}
          </div>
          <p className="text-sm font-medium leading-relaxed text-gray-900">{question.question}</p>
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
      {question.options.map((option) => {
        const letter = option[0];
        const isSelected = selected === letter;
        const isCorrectAnswer = question.correctAnswer === letter;

        let cls =
          "flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all ";

        if (isRevealed) {
          if (isCorrectAnswer) {
            cls += "border-emerald-400 bg-emerald-50 cursor-default";
          } else if (isSelected && !isCorrect) {
            cls += "border-red-400 bg-red-50 cursor-default";
          } else {
            cls += "border-gray-100 bg-gray-50 opacity-50 cursor-default";
          }
        } else {
          cls += isSelected
            ? "border-indigo-400 bg-indigo-50 ring-1 ring-indigo-200 cursor-pointer"
            : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/40 cursor-pointer";
        }

        const dotCls = isRevealed
          ? isCorrectAnswer
            ? "bg-emerald-600 text-white"
            : isSelected && !isCorrect
              ? "bg-red-500 text-white"
              : "bg-gray-200 text-gray-400"
          : isSelected
            ? "bg-indigo-600 text-white"
            : "border border-gray-300 text-gray-400";

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
                  ? "font-semibold text-emerald-900"
                  : isSelected && !isCorrect
                    ? "font-semibold text-red-900"
                    : "text-gray-400"
                : isSelected
                  ? "font-medium text-indigo-900"
                  : "text-gray-700"
            }`}>
              {option.slice(3)}
            </span>
          </button>
        );
      })}

      {/* Inline explanation revealed after answer */}
      {isRevealed && (
        <div className={`mt-1 rounded-xl border px-4 py-3 ${
          isCorrect
            ? "border-emerald-200 bg-emerald-50"
            : "border-amber-200 bg-amber-50"
        }`}>
          <p className={`mb-1 text-[10px] font-semibold uppercase tracking-wide ${
            isCorrect ? "text-emerald-600" : "text-amber-600"
          }`}>
            {isCorrect ? "Why that's correct" : "Explanation"}
          </p>
          <p className="text-sm leading-relaxed text-gray-700">
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
        className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm leading-relaxed text-gray-700 placeholder-gray-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
      />
      <p className="mt-1 text-right text-xs text-gray-400">{value.length} chars</p>
    </div>
  );
}
