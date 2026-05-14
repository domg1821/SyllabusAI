/**
 * Grade impact calculator — "What score do I need on remaining work?"
 *
 * Pure functions only. No React, no Supabase, no side effects.
 * Extracted so these can be unit-tested without rendering anything.
 */

// ─── Grade threshold table ────────────────────────────────────────────────────

export const GRADE_THRESHOLDS = [
  { label: "A",  pct: 93 },
  { label: "A-", pct: 90 },
  { label: "B+", pct: 87 },
  { label: "B",  pct: 83 },
  { label: "B-", pct: 80 },
  { label: "C+", pct: 77 },
  { label: "C",  pct: 73 },
  { label: "C-", pct: 70 },
  { label: "D",  pct: 60 },
  { label: "F",  pct:  0 },
] as const;

export type GradeLabel = (typeof GRADE_THRESHOLDS)[number]["label"];

// ─── Result shape ─────────────────────────────────────────────────────────────

export type GradeImpactResult =
  /** Not enough point data to calculate anything. */
  | { status: "no_data" }
  /** Target already secured — even a 0 on remaining work hits it. */
  | { status: "secured"; currentPct: number }
  /** Achievable — here's what you need. */
  | {
      status: "achievable";
      neededPoints: number;   // rounded up to nearest integer
      ungradedPoints: number; // total remaining points available
      neededPct: number;      // neededPoints / ungradedPoints * 100
    }
  /** Impossible — perfect remaining score still falls short. */
  | { status: "impossible"; bestPossiblePct: number };

// ─── Core calculation ─────────────────────────────────────────────────────────

/**
 * Given a target grade percentage and the student's current standing,
 * determine whether the target is already secured, achievable, or impossible.
 *
 * Formula:
 *   pointsNeeded = (targetPct / 100) * totalPossible - totalEarned
 *   neededPct    = pointsNeeded / ungradedPoints * 100
 *
 * @param targetPct      Target final grade as a percentage (0–100)
 * @param totalEarned    Points earned so far (sum of grade.earned)
 * @param totalPossible  All points in the course (sum of item.points)
 * @param ungradedPoints Points on work not yet graded (sum of item.points for ungraded items)
 */
export function calcGradeImpact({
  targetPct,
  totalEarned,
  totalPossible,
  ungradedPoints,
}: {
  targetPct: number;
  totalEarned: number;
  totalPossible: number;
  ungradedPoints: number;
}): GradeImpactResult {
  // Guard against bad / missing data
  if (!isFinite(totalPossible) || totalPossible <= 0) {
    return { status: "no_data" };
  }

  // Sanitize — treat NaN / negative as zero
  const earned = isFinite(totalEarned) ? Math.max(0, totalEarned) : 0;
  const possible = totalPossible;
  const ungraded = isFinite(ungradedPoints) ? Math.max(0, ungradedPoints) : 0;

  const targetPoints = (targetPct / 100) * possible;
  const pointsNeeded = targetPoints - earned;

  // Already secured: scoring 0 on everything remaining still meets the target
  if (pointsNeeded <= 0) {
    return {
      status: "secured",
      currentPct: (earned / possible) * 100,
    };
  }

  // No remaining work to earn points on
  if (ungraded <= 0) {
    return {
      status: "impossible",
      bestPossiblePct: (earned / possible) * 100,
    };
  }

  // Even a perfect score on remaining work falls short
  // Use a small epsilon to avoid floating-point false negatives
  if (earned + ungraded < targetPoints - 0.001) {
    return {
      status: "impossible",
      bestPossiblePct: ((earned + ungraded) / possible) * 100,
    };
  }

  // Achievable — round up so the result is always sufficient
  const neededPoints = Math.min(Math.ceil(pointsNeeded), Math.ceil(ungraded));
  const neededPct = (neededPoints / ungraded) * 100;

  return {
    status: "achievable",
    neededPoints,
    ungradedPoints: ungraded,
    neededPct,
  };
}

// ─── Display helpers ──────────────────────────────────────────────────────────

/** Format a number for display: integer if whole, one decimal otherwise. */
export function fmtPts(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

/** Format a percentage for display with one decimal place. */
export function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`;
}
