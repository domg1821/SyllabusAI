"use client";

import React, { useState } from "react";
import { DeadlineItem, GradeEntry, ItemType } from "@/lib/types";
import {
  calcGradeImpact,
  GRADE_THRESHOLDS,
  fmtPts,
  fmtPct,
} from "@/lib/gradeUtils";

interface Props {
  items: DeadlineItem[];
  grades: GradeEntry[];
  onSetGrade: (entry: GradeEntry) => void;
  onRemoveGrade: (itemId: string) => void;
}

const TYPE_LABELS: Record<ItemType, string> = {
  assignment: "Assignments",
  quiz: "Quizzes",
  exam: "Exams",
  project: "Projects",
};

const TYPE_ORDER: ItemType[] = ["exam", "project", "quiz", "assignment"];

type CategoryWeights = Partial<Record<ItemType, number>>;

export default function GradeTracker({ items, grades, onSetGrade, onRemoveGrade }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [earnedInput, setEarnedInput] = useState("");
  const [maxInput, setMaxInput] = useState("");
  const [targetLabel, setTargetLabel] = useState("B");
  const [weightMode, setWeightMode] = useState(false);
  const [weights, setWeights] = useState<CategoryWeights>({
    exam: 40, project: 25, quiz: 15, assignment: 20,
  });

  const gradeMap = new Map(grades.map((g) => [g.itemId, g]));
  const gradedItems = grades.filter((g) => g.max > 0);

  // ── Raw (point-based) calculations ──
  const totalEarned = gradedItems.reduce((s, g) => s + g.earned, 0);
  const totalMax = gradedItems.reduce((s, g) => s + g.max, 0);
  const rawCurrentPct = totalMax > 0 ? (totalEarned / totalMax) * 100 : null;

  const pointItems = items.filter((i) => i.points && i.points > 0);
  const totalPossible = pointItems.reduce((s, i) => s + (i.points ?? 0), 0);
  const ungradedPoints = pointItems
    .filter((i) => !gradeMap.has(i.id))
    .reduce((s, i) => s + (i.points ?? 0), 0);
  const rawProjectedPct =
    totalPossible > 0 && totalMax > 0
      ? ((totalEarned + ungradedPoints) / totalPossible) * 100
      : null;

  // ── Weighted category calculations ──
  function categoryPct(type: ItemType): number | null {
    const typeGrades = gradedItems.filter((g) => {
      const item = items.find((i) => i.id === g.itemId);
      return item?.type === type;
    });
    if (!typeGrades.length) return null;
    const earned = typeGrades.reduce((s, g) => s + g.earned, 0);
    const max = typeGrades.reduce((s, g) => s + g.max, 0);
    return max > 0 ? (earned / max) * 100 : null;
  }

  function calcWeightedGrade(): number | null {
    const totalWeight = TYPE_ORDER.reduce((s, t) => s + (weights[t] ?? 0), 0);
    if (!totalWeight) return null;
    let earned = 0;
    let appliedWeight = 0;
    for (const type of TYPE_ORDER) {
      const pct = categoryPct(type);
      const w = weights[type] ?? 0;
      if (pct !== null && w > 0) {
        earned += (pct / 100) * w;
        appliedWeight += w;
      }
    }
    if (!appliedWeight) return null;
    return (earned / appliedWeight) * 100;
  }

  const weightedCurrentPct = weightMode ? calcWeightedGrade() : null;
  const currentPct = weightMode ? weightedCurrentPct : rawCurrentPct;
  const projectedPct = weightMode ? null : rawProjectedPct; // weighted projected is complex — skip for now

  function setWeight(type: ItemType, val: string) {
    const n = parseFloat(val);
    setWeights((prev) => ({ ...prev, [type]: isNaN(n) ? 0 : Math.min(100, Math.max(0, n)) }));
  }

  const totalWeightPct = TYPE_ORDER.reduce((s, t) => s + (weights[t] ?? 0), 0);

  function letterGrade(pct: number) {
    if (pct >= 93) return "A";
    if (pct >= 90) return "A-";
    if (pct >= 87) return "B+";
    if (pct >= 83) return "B";
    if (pct >= 80) return "B-";
    if (pct >= 77) return "C+";
    if (pct >= 73) return "C";
    if (pct >= 70) return "C-";
    if (pct >= 67) return "D+";
    if (pct >= 60) return "D";
    return "F";
  }

  function gradeColor(pct: number) {
    if (pct >= 90) return "text-emerald-600";
    if (pct >= 80) return "text-blue-600";
    if (pct >= 70) return "text-amber-600";
    return "text-red-600";
  }

  function startEdit(item: DeadlineItem) {
    const existing = gradeMap.get(item.id);
    setEditing(item.id);
    setEarnedInput(existing ? String(existing.earned) : "");
    setMaxInput(existing ? String(existing.max) : item.points ? String(item.points) : "");
  }

  function saveEdit(item: DeadlineItem) {
    const earned = parseFloat(earnedInput);
    const max = parseFloat(maxInput);
    if (!isNaN(earned) && !isNaN(max) && max > 0) {
      onSetGrade({ itemId: item.id, earned, max });
    }
    setEditing(null);
  }

  const gradableItems = items.filter((i) => typeof i.points === "number" && i.points > 0);
  const grouped = TYPE_ORDER.reduce<Partial<Record<ItemType, DeadlineItem[]>>>((acc, t) => {
    const group = gradableItems.filter((i) => i.type === t);
    if (group.length > 0) acc[t] = group;
    return acc;
  }, {});

  if (gradableItems.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
          </svg>
          <h3 className="text-sm font-semibold text-gray-800">Grade Tracker</h3>
        </div>
        <p className="text-sm text-gray-400">No graded items found in this syllabus.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
          </svg>
          <h3 className="text-sm font-semibold text-gray-800">Grade Tracker</h3>
        </div>
        <button
          onClick={() => setWeightMode((v) => !v)}
          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-semibold transition-colors ${
            weightMode
              ? "border-indigo-300 bg-indigo-50 text-indigo-700"
              : "border-gray-200 bg-gray-50 text-gray-500 hover:border-indigo-200 hover:text-indigo-600"
          }`}
          title="Toggle category weights mode"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
          </svg>
          {weightMode ? "Weighted ✓" : "Set Weights"}
        </button>
      </div>

      {/* Category weights panel */}
      {weightMode && (
        <div className="mb-4 rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-3">
          <p className="mb-2.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600">
            Category Weights (must add up to 100%)
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {TYPE_ORDER.map((type) => (
              <div key={type}>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  {TYPE_LABELS[type]}
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={weights[type] ?? 0}
                    onChange={(e) => setWeight(type, e.target.value)}
                    className="w-full rounded border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-gray-700 focus:border-indigo-400 focus:outline-none"
                  />
                  <span className="text-xs text-gray-400">%</span>
                </div>
              </div>
            ))}
          </div>
          <p className={`mt-2 text-[10px] font-semibold ${
            totalWeightPct === 100 ? "text-emerald-600" : "text-amber-600"
          }`}>
            Total: {totalWeightPct}% {totalWeightPct === 100 ? "✓" : "(should be 100%)"}
          </p>
        </div>
      )}

      {/* Summary cards */}
      {gradedItems.length > 0 && currentPct !== null && (
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <div className={`text-2xl font-bold ${gradeColor(currentPct)}`}>
              {letterGrade(currentPct)}
            </div>
            <div className="text-xs text-gray-500">Current grade</div>
            <div className="text-xs text-gray-400">{currentPct.toFixed(1)}%</div>
          </div>
          {projectedPct !== null && ungradedPoints > 0 && (
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <div className={`text-2xl font-bold ${gradeColor(projectedPct)}`}>
                {letterGrade(projectedPct)}
              </div>
              <div className="text-xs text-gray-500">Projected final</div>
              <div className="text-xs text-gray-400">{projectedPct.toFixed(1)}% · if 100% on remaining</div>
            </div>
          )}
          {ungradedPoints === 0 && gradedItems.length > 0 && (
            <div className="rounded-lg bg-emerald-50 p-3 text-center">
              <div className="text-2xl font-bold text-emerald-600">✓</div>
              <div className="text-xs text-gray-500">All items graded</div>
              <div className="text-xs text-gray-400">Final: {currentPct.toFixed(1)}%</div>
            </div>
          )}
        </div>
      )}

      {/* Grade impact calculator */}
      {(() => {
        const targetThreshold = GRADE_THRESHOLDS.find((t) => t.label === targetLabel);
        const targetPct = targetThreshold?.pct ?? 83;
        const impact = calcGradeImpact({
          targetPct,
          totalEarned,
          totalPossible,
          ungradedPoints,
        });

        return (
          <div className="mb-4 border-t border-gray-100 pt-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-600">What score do I need?</span>
              <select
                value={targetLabel}
                onChange={(e) => setTargetLabel(e.target.value)}
                className="ml-auto rounded border border-gray-200 bg-white px-2 py-0.5 text-xs font-medium text-gray-700 focus:border-indigo-400 focus:outline-none"
              >
                {GRADE_THRESHOLDS.filter((t) => t.label !== "F").map((t) => (
                  <option key={t.label} value={t.label}>
                    {t.label} ({t.pct}%+)
                  </option>
                ))}
              </select>
            </div>

            {impact.status === "no_data" && (
              <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-400">
                Enter grades above to see what score you need.
              </p>
            )}

            {impact.status === "secured" && (
              <div className="flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2">
                <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                <p className="text-xs text-emerald-700">
                  You&apos;ve already secured at least a{" "}
                  <span className="font-semibold">{targetLabel}</span> based on your current scores.
                </p>
              </div>
            )}

            {impact.status === "achievable" && (
              <div className="flex items-start gap-2 rounded-lg bg-indigo-50 px-3 py-2">
                <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                </svg>
                <p className="text-xs text-indigo-700">
                  You need{" "}
                  <span className="font-semibold">
                    {fmtPts(impact.neededPoints)}/{fmtPts(impact.ungradedPoints)} ({fmtPct(impact.neededPct)})
                  </span>{" "}
                  on your remaining work to finish with a{" "}
                  <span className="font-semibold">{targetLabel}</span>.
                </p>
              </div>
            )}

            {impact.status === "impossible" && (
              <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2">
                <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
                <p className="text-xs text-amber-700">
                  Even a perfect score on remaining work would only reach{" "}
                  <span className="font-semibold">{fmtPct(impact.bestPossiblePct)}</span>, not a{" "}
                  <span className="font-semibold">{targetLabel}</span>.
                </p>
              </div>
            )}
          </div>
        );
      })()}

      {/* Per-item grade entry */}
      <div className="space-y-5">
        {TYPE_ORDER.map((type) => {
          const typeItems = grouped[type];
          if (!typeItems) return null;
          return (
            <div key={type}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                {TYPE_LABELS[type]}
              </p>
              <div className="space-y-2">
                {typeItems.map((item) => {
                  const grade = gradeMap.get(item.id);
                  const isEditing = editing === item.id;
                  const pct = grade && grade.max > 0 ? (grade.earned / grade.max) * 100 : null;

                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-gray-700">{item.title}</p>
                        <p className="text-[10px] text-gray-400">{item.points} pts possible</p>
                      </div>

                      {isEditing ? (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <input
                            type="number"
                            value={earnedInput}
                            onChange={(e) => setEarnedInput(e.target.value)}
                            placeholder="earned"
                            className="w-16 rounded border border-gray-300 px-2 py-1 text-xs focus:border-indigo-400 focus:outline-none"
                            autoFocus
                            onKeyDown={(e) => { if (e.key === "Enter") saveEdit(item); if (e.key === "Escape") setEditing(null); }}
                          />
                          <span className="text-xs text-gray-400">/</span>
                          <input
                            type="number"
                            value={maxInput}
                            onChange={(e) => setMaxInput(e.target.value)}
                            placeholder="max"
                            className="w-16 rounded border border-gray-300 px-2 py-1 text-xs focus:border-indigo-400 focus:outline-none"
                            onKeyDown={(e) => { if (e.key === "Enter") saveEdit(item); if (e.key === "Escape") setEditing(null); }}
                          />
                          <button
                            onClick={() => saveEdit(item)}
                            className="rounded bg-indigo-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-indigo-500"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditing(null)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : grade ? (
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-xs font-semibold ${gradeColor(pct!)}`}>
                            {grade.earned}/{grade.max}
                            <span className="ml-1 font-normal text-gray-400">({pct!.toFixed(0)}%)</span>
                          </span>
                          <button
                            onClick={() => startEdit(item)}
                            className="text-gray-300 hover:text-indigo-500 transition-colors"
                            title="Edit grade"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => onRemoveGrade(item.id)}
                            className="text-gray-300 hover:text-red-400 transition-colors"
                            title="Remove grade"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(item)}
                          className="shrink-0 rounded border border-gray-200 px-2 py-1 text-[10px] font-medium text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                        >
                          + Add grade
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {gradedItems.length === 0 && (
        <p className="mt-3 text-xs text-gray-400">
          Click "+ Add grade" on any item to start tracking your progress.
        </p>
      )}
    </div>
  );
}
