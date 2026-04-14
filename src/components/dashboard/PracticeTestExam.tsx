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
  easy: { label: "Easy", className: "bg-emerald-100 text-emerald-700" },
  medium: { label: "Medium", className: "bg-amber-100 text-amber-700" },
  hard: { label: "Hard", className: "bg-red-100 text-red-700" },
};

export default function PracticeTestExam({
  topic,
  difficulty,
  questions,
  userAnswers,
  onAnswerChange,
  onSubmit,
}: Props) {
  const [submitWarning, setSubmitWarning] = useState(false);

  const answeredCount = questions.filter((q) => userAnswers[q.id]?.trim()).length;
  const unansweredCount = questions.length - answeredCount;
  const badge = DIFFICULTY_BADGE[difficulty];

  function handleSubmitClick() {
    if (unansweredCount > 0) {
      setSubmitWarning(true);
      return;
    }
    onSubmit();
  }

  function handleConfirmSubmit() {
    setSubmitWarning(false);
    onSubmit();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Exam header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-snug">{topic}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}
              >
                {badge.label}
              </span>
              <span className="text-xs text-gray-400">{questions.length} questions</span>
              <span className="text-xs text-gray-300">·</span>
              <span className="text-xs text-gray-400">
                {answeredCount}/{questions.length} answered
              </span>
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-full mt-3">
            <div className="h-1.5 w-full rounded-full bg-gray-100">
              <div
                className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300"
                style={{
                  width: `${questions.length > 0 ? (answeredCount / questions.length) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-5">
        {questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            index={index}
            answer={userAnswers[question.id] ?? ""}
            onAnswerChange={(ans) => onAnswerChange(question.id, ans)}
          />
        ))}
      </div>

      {/* Unanswered warning */}
      {submitWarning && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-800">
            You have {unansweredCount} unanswered question{unansweredCount !== 1 ? "s" : ""}.
          </p>
          <p className="mt-1 text-xs text-amber-700">
            Unanswered questions will be marked incorrect. Are you sure you want to submit?
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleConfirmSubmit}
              className="rounded-lg bg-amber-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-amber-500 transition-colors"
            >
              Submit anyway
            </button>
            <button
              onClick={() => setSubmitWarning(false)}
              className="rounded-lg border border-amber-200 px-4 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors"
            >
              Go back
            </button>
          </div>
        </div>
      )}

      {/* Submit button */}
      <div className="pb-8">
        <button
          onClick={handleSubmitClick}
          className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-500 active:scale-[0.99] transition-all"
        >
          Submit Test
        </button>
        <p className="mt-2 text-center text-xs text-gray-400">
          Your answers will be saved and reviewed after submission.
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
  onAnswerChange,
}: {
  question: TestQuestion;
  index: number;
  answer: string;
  onAnswerChange: (answer: string) => void;
}) {
  const isAnswered = answer.trim().length > 0;

  return (
    <div
      className={`rounded-2xl border bg-white p-5 shadow-sm transition-all ${
        isAnswered ? "border-indigo-200" : "border-gray-200"
      }`}
    >
      {/* Question header */}
      <div className="mb-4 flex items-start gap-3">
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
            isAnswered
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {index + 1}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider ${
                question.type === "multiple_choice"
                  ? "text-indigo-500"
                  : "text-violet-500"
              }`}
            >
              {question.type === "multiple_choice" ? "Multiple Choice" : "Short Answer"}
            </span>
          </div>
          <p className="text-sm font-medium leading-relaxed text-gray-900">
            {question.question}
          </p>
        </div>
      </div>

      {/* Answer area */}
      {question.type === "multiple_choice" ? (
        <MCAnswerInput
          question={question as MCQuestion}
          selected={answer}
          onChange={onAnswerChange}
        />
      ) : (
        <SAAnswerInput value={answer} onChange={onAnswerChange} />
      )}
    </div>
  );
}

// ─── Multiple Choice Input ────────────────────────────────────────────────────

function MCAnswerInput({
  question,
  selected,
  onChange,
}: {
  question: MCQuestion;
  selected: string;
  onChange: (letter: string) => void;
}) {
  return (
    <div className="ml-10 space-y-2">
      {question.options.map((option) => {
        const letter = option[0]; // "A", "B", "C", "D"
        const isSelected = selected === letter;
        return (
          <button
            key={letter}
            onClick={() => onChange(letter)}
            className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm transition-all ${
              isSelected
                ? "border-indigo-400 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-300"
                : "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300 hover:bg-white"
            }`}
          >
            <div
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                isSelected
                  ? "bg-indigo-600 text-white"
                  : "border border-gray-300 text-gray-400"
              }`}
            >
              {letter}
            </div>
            <span className="leading-snug">{option.slice(3)}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Short Answer Input ───────────────────────────────────────────────────────

function SAAnswerInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="ml-10">
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
