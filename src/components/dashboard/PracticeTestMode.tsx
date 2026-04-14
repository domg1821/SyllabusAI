"use client";

import { useState } from "react";
import {
  Difficulty,
  QuestionType,
  TestQuestion,
  TestAttempt,
  MCQuestion,
} from "@/lib/types";
import { usePracticeTests } from "@/lib/usePracticeTests";
import PracticeTestSetup from "./PracticeTestSetup";
import PracticeTestExam from "./PracticeTestExam";
import PracticeTestResults from "./PracticeTestResults";
import PracticeTestHistory from "./PracticeTestHistory";

type View = "setup" | "exam" | "results" | "history" | "history_review";

interface Props {
  isPro: boolean;
  onUpgradeClick: () => void;
}

export default function PracticeTestMode({ isPro, onUpgradeClick }: Props) {
  const {
    visibleHistory,
    canTakeTest,
    remainingFreeTests,
    weeklyCount,
    saveAttempt,
  } = usePracticeTests(isPro);

  const [view, setView] = useState<View>("setup");
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Current exam state
  const [currentQuestions, setCurrentQuestions] = useState<TestQuestion[]>([]);
  const [currentTopic, setCurrentTopic] = useState("");
  const [currentDifficulty, setCurrentDifficulty] = useState<Difficulty>("medium");
  const [currentQuestionType, setCurrentQuestionType] = useState<QuestionType>("multiple_choice");
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [isMock, setIsMock] = useState(false);

  // Current results
  const [currentAttempt, setCurrentAttempt] = useState<TestAttempt | null>(null);
  // History review
  const [reviewingAttempt, setReviewingAttempt] = useState<TestAttempt | null>(null);

  // ── Generate test ──────────────────────────────────────────────────────────

  async function handleGenerate(opts: {
    topic: string;
    questionCount: number;
    questionType: QuestionType;
    difficulty: Difficulty;
  }) {
    setGenerating(true);
    setGenerateError(null);

    try {
      const res = await fetch("/api/practice-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(opts),
      });

      const json = await res.json();

      if (!res.ok) {
        setGenerateError(json.error ?? "Failed to generate test. Please try again.");
        return;
      }

      const questions: TestQuestion[] = json.data.questions;
      setCurrentQuestions(questions);
      setCurrentTopic(opts.topic);
      setCurrentDifficulty(opts.difficulty);
      setCurrentQuestionType(opts.questionType);
      setUserAnswers({});
      setIsMock(json.mock ?? false);
      setView("exam");
    } catch {
      setGenerateError("Network error. Please check your connection and try again.");
    } finally {
      setGenerating(false);
    }
  }

  // ── Submit test ────────────────────────────────────────────────────────────

  function handleSubmit() {
    const mcQuestions = currentQuestions.filter(
      (q): q is MCQuestion => q.type === "multiple_choice"
    );
    const mcCount = mcQuestions.length;
    const correctCount = mcQuestions.filter(
      (q) => userAnswers[q.id] === q.correctAnswer
    ).length;

    const score =
      mcCount > 0 ? Math.round((correctCount / mcCount) * 100) : -1;

    const attempt: TestAttempt = {
      id: `attempt-${Date.now()}`,
      topic: currentTopic,
      difficulty: currentDifficulty,
      questionType: currentQuestionType,
      date: new Date().toISOString(),
      score,
      totalQuestions: currentQuestions.length,
      correctCount,
      mcCount,
      questions: currentQuestions,
      userAnswers,
    };

    saveAttempt(attempt);
    setCurrentAttempt(attempt);
    setView("results");
  }

  // ── Answer change ──────────────────────────────────────────────────────────

  function handleAnswerChange(questionId: string, answer: string) {
    setUserAnswers((prev) => ({ ...prev, [questionId]: answer }));
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Mock banner */}
      {isMock && view === "exam" && (
        <div className="mb-6 mx-auto max-w-2xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span className="font-semibold">Demo mode —</span> No{" "}
          <code className="rounded bg-amber-100 px-1 font-mono text-xs">ANTHROPIC_API_KEY</code>{" "}
          detected. Showing sample questions.
        </div>
      )}

      {view === "setup" && (
        <PracticeTestSetup
          isPro={isPro}
          canTakeTest={canTakeTest}
          remainingFreeTests={remainingFreeTests}
          weeklyCount={weeklyCount}
          generating={generating}
          error={generateError}
          onGenerate={handleGenerate}
          onViewHistory={() => setView("history")}
          onUpgradeClick={onUpgradeClick}
        />
      )}

      {view === "exam" && (
        <PracticeTestExam
          topic={currentTopic}
          difficulty={currentDifficulty}
          questions={currentQuestions}
          userAnswers={userAnswers}
          onAnswerChange={handleAnswerChange}
          onSubmit={handleSubmit}
        />
      )}

      {view === "results" && currentAttempt && (
        <PracticeTestResults
          attempt={currentAttempt}
          isPro={isPro}
          onNewTest={() => {
            setCurrentAttempt(null);
            setView("setup");
          }}
          onViewHistory={() => setView("history")}
          onUpgrade={onUpgradeClick}
        />
      )}

      {view === "history" && (
        <PracticeTestHistory
          attempts={visibleHistory}
          isPro={isPro}
          onBack={() => setView("setup")}
          onReview={(attempt) => {
            setReviewingAttempt(attempt);
            setView("history_review");
          }}
          onUpgradeClick={onUpgradeClick}
        />
      )}

      {view === "history_review" && reviewingAttempt && (
        <PracticeTestResults
          attempt={reviewingAttempt}
          isPro={isPro}
          isHistoryReview
          onNewTest={() => setView("setup")}
          onViewHistory={() => {
            setReviewingAttempt(null);
            setView("history");
          }}
          onUpgrade={onUpgradeClick}
        />
      )}
    </>
  );
}
