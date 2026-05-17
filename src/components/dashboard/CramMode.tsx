"use client";

import { useState, useEffect, useRef } from "react";
import { DeadlineItem, Flashcard, MCQuestion, TestQuestion } from "@/lib/types";
import { saveStudySession } from "@/lib/useStudySessions";
import ExplainerPanel from "./ExplainerPanel";

interface Props {
  exam: DeadlineItem;
  courseName: string;
  courseContext?: string;
  onClose: () => void;
}

type Phase = "setup" | "concepts" | "questions" | "summary";
const TIME_OPTIONS = [30, 60, 90, 120] as const;

function formatTimer(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDuration(ms: number): string {
  const secs = Math.round(ms / 1000);
  if (secs <= 0) return "0m";
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export default function CramMode({ exam, courseName, courseContext, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>("setup");
  const [minutes, setMinutes] = useState<30 | 60 | 90 | 120>(60);
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Concepts
  const [concepts, setConcepts] = useState<Flashcard[]>([]);
  const [conceptsLoading, setConceptsLoading] = useState(false);

  // Questions
  const [questions, setQuestions] = useState<MCQuestion[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  const [showExplainer, setShowExplainer] = useState(false);

  // Countdown timer
  useEffect(() => {
    // Always clear any running interval before potentially starting a new one
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (phase !== "concepts" && phase !== "questions") return;
    if (timeLeft <= 0) {
      setPhase("summary");
      return;
    }
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          setPhase("summary");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  async function handleStart() {
    const now = Date.now();
    setStartTime(now);
    setTimeLeft(minutes * 60);
    setConceptsLoading(true);
    setPhase("concepts");

    try {
      const res = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: exam.title,
          chapterName: exam.title,
          courseContext: courseContext?.slice(0, 1000),
          count: 7,
        }),
      });
      const json = await res.json();
      setConcepts((json.cards ?? []).slice(0, 7));
    } catch {
      setConcepts([]);
    } finally {
      setConceptsLoading(false);
    }
  }

  async function moveToQuestions() {
    setQuestionsLoading(true);
    setPhase("questions");
    try {
      const res = await fetch("/api/practice-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: exam.title,
          questionCount: 5,
          questionType: "multiple_choice",
          difficulty: "medium",
        }),
      });
      const json = await res.json();
      const qs: TestQuestion[] = json.data?.questions ?? [];
      setQuestions(
        qs.filter((q): q is MCQuestion => q.type === "multiple_choice").slice(0, 5)
      );
    } catch {
      setQuestions([]);
    } finally {
      setQuestionsLoading(false);
    }
  }

  function handleMCAnswer(questionId: string, letter: string) {
    if (revealedIds.has(questionId)) return;
    setUserAnswers((prev) => ({ ...prev, [questionId]: letter }));
    setRevealedIds((prev) => new Set([...prev, questionId]));
  }

  function handleFinish() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPhase("summary");
  }

  function handleClose() {
    if (startTime && phase !== "setup") {
      saveStudySession({
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        chapter: exam.title,
        courseName,
        duration: Date.now() - startTime,
        score:
          questions.length > 0
            ? Math.round(
                (questions.filter((q) => userAnswers[q.id] === q.correctAnswer).length /
                  questions.length) *
                  100
              )
            : undefined,
      });
    }
    if (intervalRef.current) clearInterval(intervalRef.current);
    onClose();
  }

  const timerPct = minutes > 0 ? (timeLeft / (minutes * 60)) * 100 : 0;
  const timerColor =
    timerPct > 40 ? "text-indigo-600" : timerPct > 15 ? "text-amber-600" : "text-red-600";
  const timerBarColor =
    timerPct > 40
      ? "from-indigo-500 to-violet-500"
      : timerPct > 15
      ? "from-amber-400 to-orange-400"
      : "from-red-400 to-red-500";

  const correctCount = questions.filter((q) => userAnswers[q.id] === q.correctAnswer).length;
  const studiedDuration = startTime ? Date.now() - startTime : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white dark:bg-slate-800 shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 dark:border-slate-700 px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-red-600">
              Exam Cram
            </p>
            <h2 className="truncate text-sm font-bold text-gray-900 dark:text-slate-100">{exam.title}</h2>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {(phase === "concepts" || phase === "questions") && (
              <>
                <button
                  onClick={() => setShowExplainer(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100 transition-colors"
                >
                  Explain
                </button>
                <span className={`font-mono text-lg font-bold tabular-nums ${timerColor}`}>
                  {formatTimer(timeLeft)}
                </span>
              </>
            )}
            <button
              onClick={handleClose}
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

        {/* Timer progress bar */}
        {(phase === "concepts" || phase === "questions") && (
          <div className="h-1 w-full shrink-0 bg-gray-100">
            <div
              className={`h-1 bg-gradient-to-r ${timerBarColor} transition-all duration-1000`}
              style={{ width: `${timerPct}%` }}
            />
          </div>
        )}

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* ── Setup ── */}
          {phase === "setup" && (
            <div className="space-y-5">
              <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-red-600">
                    Exam
                  </span>
                  <span className="text-xs text-red-400">Due {exam.dueDate}</span>
                </div>
                <p className="text-base font-bold text-red-900">{exam.title}</p>
              </div>

              <div>
                <p className="mb-3 text-sm font-semibold text-gray-700">
                  How much time do you have?
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {TIME_OPTIONS.map((m) => (
                    <button
                      key={m}
                      onClick={() => setMinutes(m)}
                      className={`rounded-xl border py-3 text-sm font-semibold transition-all ${
                        minutes === m
                          ? "border-indigo-400 bg-indigo-600 text-white shadow-sm"
                          : "border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50"
                      }`}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="mb-2.5 text-xs font-semibold text-gray-600">
                  Your {minutes}-minute cram plan:
                </p>
                <ol className="space-y-2 text-xs text-gray-600">
                  <li className="flex items-center gap-2">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-600">
                      1
                    </span>
                    Key concepts review (~{Math.round(minutes * 0.4)}min)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-600">
                      2
                    </span>
                    5 quick practice questions (~{Math.round(minutes * 0.4)}min)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-600">
                      3
                    </span>
                    What to review (~{Math.round(minutes * 0.2)}min)
                  </li>
                </ol>
              </div>

              <button
                onClick={handleStart}
                className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3.5 text-sm font-bold text-white shadow-sm hover:opacity-90 active:scale-[0.99] transition-all"
              >
                Start Cram Session
              </button>
            </div>
          )}

          {/* ── Concepts ── */}
          {phase === "concepts" && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600">
                    Step 1 of 2
                  </p>
                  <h3 className="text-base font-bold text-gray-900">Key Concepts</h3>
                </div>
                <button
                  onClick={moveToQuestions}
                  disabled={conceptsLoading}
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-500 hover:text-indigo-700 transition-colors disabled:opacity-40"
                >
                  Skip to questions
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m8.25 4.5 7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </button>
              </div>

              {conceptsLoading ? (
                <div className="flex flex-col items-center gap-3 py-10">
                  <svg
                    className="h-7 w-7 animate-spin text-indigo-400"
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
                  <p className="text-sm text-gray-400">Generating key concepts…</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {concepts.map((card, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-gray-200 bg-white p-4"
                    >
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-indigo-500">
                        Concept {i + 1}
                      </p>
                      <p className="mb-2 text-sm font-semibold text-gray-900">
                        {card.front}
                      </p>
                      <p className="border-t border-gray-50 pt-2 text-sm leading-relaxed text-gray-600">
                        {card.back}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {!conceptsLoading && (
                <button
                  onClick={moveToQuestions}
                  className="mt-4 w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-500 active:scale-[0.99] transition-all"
                >
                  Continue to Practice Questions →
                </button>
              )}
            </div>
          )}

          {/* ── Questions ── */}
          {phase === "questions" && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600">
                    Step 2 of 2
                  </p>
                  <h3 className="text-base font-bold text-gray-900">Quick Quiz</h3>
                </div>
                <span className="text-xs text-gray-400">
                  {Object.keys(userAnswers).length}/{questions.length} answered
                </span>
              </div>

              {questionsLoading ? (
                <div className="flex flex-col items-center gap-3 py-10">
                  <svg
                    className="h-7 w-7 animate-spin text-indigo-400"
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
                  <p className="text-sm text-gray-400">Generating questions…</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((q, i) => {
                    const isRevealed = revealedIds.has(q.id);
                    const selected = userAnswers[q.id];
                    const isCorrect = selected === q.correctAnswer;

                    return (
                      <div
                        key={q.id}
                        className={`rounded-xl border p-4 transition-all ${
                          isRevealed
                            ? isCorrect
                              ? "border-emerald-200 bg-emerald-50/30"
                              : "border-red-200 bg-red-50/20"
                            : "border-gray-200 bg-white"
                        }`}
                      >
                        <p className="mb-3 text-sm font-medium leading-snug text-gray-900">
                          <span className="mr-2 text-xs font-bold text-indigo-500">
                            {i + 1}.
                          </span>
                          {q.question}
                        </p>
                        <div className="space-y-2">
                          {q.options.map((opt) => {
                            const letter = opt[0];
                            const isSelected = selected === letter;
                            const isCorrectAnswer = q.correctAnswer === letter;
                            let cls =
                              "flex w-full items-center gap-2.5 rounded-lg border p-3 text-left text-sm transition-all ";
                            if (isRevealed) {
                              if (isCorrectAnswer)
                                cls += "border-emerald-300 bg-emerald-50 cursor-default";
                              else if (isSelected && !isCorrect)
                                cls += "border-red-300 bg-red-50 cursor-default";
                              else
                                cls += "border-gray-100 bg-gray-50 opacity-50 cursor-default";
                            } else {
                              cls += isSelected
                                ? "border-indigo-300 bg-indigo-50"
                                : "cursor-pointer border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/30";
                            }
                            return (
                              <button
                                key={letter}
                                disabled={isRevealed}
                                onClick={() => handleMCAnswer(q.id, letter)}
                                className={cls}
                              >
                                <span
                                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                    isRevealed
                                      ? isCorrectAnswer
                                        ? "bg-emerald-500 text-white"
                                        : isSelected && !isCorrect
                                        ? "bg-red-400 text-white"
                                        : "bg-gray-200 text-gray-400"
                                      : isSelected
                                      ? "bg-indigo-600 text-white"
                                      : "border border-gray-300 text-gray-400"
                                  }`}
                                >
                                  {isRevealed && isCorrectAnswer
                                    ? "✓"
                                    : isRevealed && isSelected && !isCorrect
                                    ? "✗"
                                    : letter}
                                </span>
                                <span
                                  className={
                                    isRevealed
                                      ? isCorrectAnswer
                                        ? "font-medium text-emerald-800"
                                        : isSelected && !isCorrect
                                        ? "text-red-800"
                                        : "text-gray-400"
                                      : "text-gray-700"
                                  }
                                >
                                  {opt.slice(3)}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        {isRevealed && (
                          <div
                            className={`mt-3 rounded-lg border px-3 py-2 text-xs ${
                              isCorrect
                                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                : "border-amber-200 bg-amber-50 text-amber-800"
                            }`}
                          >
                            <span className="font-semibold">
                              {isCorrect ? "Correct. " : "Explanation: "}
                            </span>
                            {isCorrect ? q.explanation : q.wrongExplanation || q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {!questionsLoading && (
                <button
                  onClick={handleFinish}
                  className="mt-4 w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-500 active:scale-[0.99] transition-all"
                >
                  Finish &amp; See Summary
                </button>
              )}
            </div>
          )}

          {/* ── Summary ── */}
          {phase === "summary" && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-2xl">
                  📚
                </div>
                <h3 className="text-lg font-bold text-gray-900">Session Complete</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {exam.title} · {formatDuration(studiedDuration)} studied
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-gray-200 bg-white p-3 text-center">
                  <p className="text-xl font-bold text-indigo-600">{concepts.length}</p>
                  <p className="mt-0.5 text-[10px] text-gray-400">Concepts reviewed</p>
                </div>
                <div
                  className={`rounded-xl border p-3 text-center ${
                    questions.length > 0 && correctCount >= Math.ceil(questions.length / 2)
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-amber-200 bg-amber-50"
                  }`}
                >
                  <p
                    className={`text-xl font-bold ${
                      questions.length > 0 && correctCount >= Math.ceil(questions.length / 2)
                        ? "text-emerald-600"
                        : "text-amber-600"
                    }`}
                  >
                    {correctCount}/{questions.length}
                  </p>
                  <p className="mt-0.5 text-[10px] text-gray-500">Questions correct</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-3 text-center">
                  <p className="text-xl font-bold text-gray-700">
                    {formatDuration(studiedDuration)}
                  </p>
                  <p className="mt-0.5 text-[10px] text-gray-400">Time studied</p>
                </div>
              </div>

              {/* Question scan */}
              {questions.length > 0 && (
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="mb-2.5 text-xs font-semibold text-gray-600">Questions:</p>
                  <div className="flex flex-wrap gap-2">
                    {questions.map((q, i) => {
                      const correct = userAnswers[q.id] === q.correctAnswer;
                      const answered = !!userAnswers[q.id];
                      return (
                        <div
                          key={q.id}
                          title={q.question}
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                            !answered
                              ? "bg-gray-200 text-gray-400"
                              : correct
                              ? "bg-emerald-500 text-white"
                              : "bg-red-400 text-white"
                          }`}
                        >
                          {i + 1}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Still review */}
              {questions.length > 0 &&
                questions.some((q) => userAnswers[q.id] !== q.correctAnswer) && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="mb-2 text-xs font-semibold text-amber-700">
                      Still worth reviewing:
                    </p>
                    <ul className="space-y-1.5">
                      {questions
                        .filter((q) => userAnswers[q.id] !== q.correctAnswer)
                        .map((q) => (
                          <li key={q.id} className="text-xs leading-snug text-amber-800">
                            ·{" "}
                            {q.question.length > 90
                              ? q.question.slice(0, 90) + "…"
                              : q.question}
                          </li>
                        ))}
                    </ul>
                  </div>
                )}

              <button
                onClick={handleClose}
                className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-500 transition-all"
              >
                Done
              </button>
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
