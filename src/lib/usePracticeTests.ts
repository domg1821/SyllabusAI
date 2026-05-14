import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { TestAttempt } from "./types";

const HISTORY_KEY = "sai_test_history";

export const FREE_WEEKLY_LIMIT = 2;
export const FREE_MAX_QUESTIONS = 5;
export const PRO_MAX_QUESTIONS = 25;
export const FREE_HISTORY_LIMIT = 5;

function rowToAttempt(row: Record<string, unknown>): TestAttempt {
  return {
    id: row.id as string,
    topic: row.topic as string,
    difficulty: row.difficulty as TestAttempt["difficulty"],
    questionType: row.question_type as TestAttempt["questionType"],
    date: row.created_at as string,
    score: row.score !== null && row.score !== undefined ? (row.score as number) : -1,
    totalQuestions: row.total_questions as number,
    correctCount: row.correct_count as number,
    mcCount: row.mc_count as number,
    questions: row.questions as TestAttempt["questions"],
    userAnswers: (row.user_answers as Record<string, string>) ?? {},
  };
}

export function usePracticeTests(isPro: boolean) {
  const supabase = useMemo(() => createClient(), []);
  const [history, setHistory] = useState<TestAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        try {
          const stored = localStorage.getItem(HISTORY_KEY);
          if (stored && !cancelled) setHistory(JSON.parse(stored));
        } catch {
          // ignore corrupt data
        }
        if (!cancelled) setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("practice_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (!cancelled) {
        if (!error && data) {
          setHistory(data.map(rowToAttempt));
        }
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const weeklyCount = history.filter((a) => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return new Date(a.date).getTime() > oneWeekAgo;
  }).length;

  const canTakeTest = isPro || weeklyCount < FREE_WEEKLY_LIMIT;
  const remainingFreeTests = Math.max(0, FREE_WEEKLY_LIMIT - weeklyCount);

  // Topics from recent sessions where score < 70, sorted worst first
  const weakTopics = useMemo((): string[] => {
    const recent = history.slice(0, 10);
    const struggled = recent
      .filter((a) => a.score !== -1 && a.score < 70)
      .map((a) => ({ topic: a.topic.slice(0, 60), score: a.score }));

    const topicMap = new Map<string, { score: number; original: string }>();
    for (const { topic, score } of struggled) {
      const key = topic.toLowerCase().trim();
      const existing = topicMap.get(key);
      if (!existing || existing.score > score) {
        topicMap.set(key, { score, original: topic });
      }
    }

    return Array.from(topicMap.values())
      .sort((a, b) => a.score - b.score)
      .slice(0, 4)
      .map((v) => v.original);
  }, [history]);

  const saveAttempt = useCallback(
    async (attempt: TestAttempt) => {
      // Optimistic update — UI sees new attempt immediately
      setHistory((prev) => [attempt, ...prev]);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        try {
          const stored = localStorage.getItem(HISTORY_KEY);
          const existing: TestAttempt[] = stored ? JSON.parse(stored) : [];
          localStorage.setItem(HISTORY_KEY, JSON.stringify([attempt, ...existing]));
        } catch {
          // ignore quota errors
        }
        return;
      }

      const { error } = await supabase.from("practice_sessions").insert({
        id: attempt.id,
        user_id: user.id,
        topic: attempt.topic,
        difficulty: attempt.difficulty,
        question_type: attempt.questionType,
        score: attempt.score === -1 ? null : attempt.score,
        total_questions: attempt.totalQuestions,
        correct_count: attempt.correctCount,
        mc_count: attempt.mcCount,
        questions: attempt.questions,
        user_answers: attempt.userAnswers,
      });

      if (error) {
        console.warn("[usePracticeTests] saveAttempt failed:", error.message);
      }
    },
    [supabase]
  );

  const visibleHistory = isPro ? history : history.slice(0, FREE_HISTORY_LIMIT);

  return {
    history,
    loading,
    visibleHistory,
    canTakeTest,
    remainingFreeTests,
    weeklyCount,
    saveAttempt,
    weakTopics,
  };
}
