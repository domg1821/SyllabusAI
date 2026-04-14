import { useState, useEffect } from "react";

const PRO_KEY = "sai_pro";
const COUNT_KEY = "sai_count";
export const FREE_LIMIT = 3;

export function usePro() {
  const [isPro, setIsPro] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    setIsPro(localStorage.getItem(PRO_KEY) === "true");
    const n = parseInt(localStorage.getItem(COUNT_KEY) ?? "0", 10);
    setCount(isNaN(n) ? 0 : n);
  }, []);

  function upgradeToPro() {
    setIsPro(true);
    localStorage.setItem(PRO_KEY, "true");
  }

  function recordAnalysis() {
    setCount((c) => {
      const next = c + 1;
      localStorage.setItem(COUNT_KEY, String(next));
      return next;
    });
  }

  return {
    isPro,
    upgradeToPro,
    canAnalyze: isPro || count < FREE_LIMIT,
    remainingFree: Math.max(0, FREE_LIMIT - count),
    recordAnalysis,
  };
}
