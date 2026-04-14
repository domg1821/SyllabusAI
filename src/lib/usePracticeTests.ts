import { useState, useEffect, useCallback } from "react";
import { TestAttempt } from "./types";

const HISTORY_KEY = "sai_test_history";

export const FREE_WEEKLY_LIMIT = 2;
export const FREE_MAX_QUESTIONS = 5;
export const PRO_MAX_QUESTIONS = 25;
export const FREE_HISTORY_LIMIT = 5;

export function usePracticeTests(isPro: boolean) {
  const [history, setHistory] = useState<TestAttempt[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) setHistory(JSON.parse(stored));
    } catch {
      // ignore corrupt or missing data
    }
  }, []);

  const weeklyCount = history.filter((a) => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return new Date(a.date).getTime() > oneWeekAgo;
  }).length;

  const canTakeTest = isPro || weeklyCount < FREE_WEEKLY_LIMIT;
  const remainingFreeTests = Math.max(0, FREE_WEEKLY_LIMIT - weeklyCount);

  const saveAttempt = useCallback((attempt: TestAttempt) => {
    setHistory((prev) => {
      const next = [attempt, ...prev];
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {
        // quota exceeded or private browsing — silently skip
      }
      return next;
    });
  }, []);

  const visibleHistory = isPro ? history : history.slice(0, FREE_HISTORY_LIMIT);

  return {
    history,
    visibleHistory,
    canTakeTest,
    remainingFreeTests,
    weeklyCount,
    saveAttempt,
  };
}
