"use client";

import React, { useState } from "react";
import { DeadlineItem, GradeEntry, ItemType } from "@/lib/types";

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

export default function GradeTracker({ items, grades, onSetGrade, onRemoveGrade }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [earnedInput, setEarnedInput] = useState("");
  const [maxInput, setMaxInput] = useState("");

  const gradeMap = new Map(grades.map((g) => [g.itemId, g]));

  // Current grade: sum of earned / sum of max for graded items
  const gradedItems = grades.filter((g) => g.max > 0);
  const totalEarned = gradedItems.reduce((s, g) => s + g.earned, 0);
  const totalMax = gradedItems.reduce((s, g) => s + g.max, 0);
  const currentPct = totalMax > 0 ? (totalEarned / totalMax) * 100 : null;

  // Projected final: (earned + remaining max) / total possible max from all items with points
  const pointItems = items.filter((i) => i.points && i.points > 0);
  const totalPossible = pointItems.reduce((s, i) => s + (i.points ?? 0), 0);
  const ungradedPoints = pointItems
    .filter((i) => !gradeMap.has(i.id))
    .reduce((s, i) => s + (i.points ?? 0), 0);
  const projectedPct =
    totalPossible > 0 && totalMax > 0
      ? ((totalEarned + ungradedPoints) / totalPossible) * 100
      : null;

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
      <div className="mb-4 flex items-center gap-2">
        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
        </svg>
        <h3 className="text-sm font-semibold text-gray-800">Grade Tracker</h3>
      </div>

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
          {projectedPct !== null && (
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <div className={`text-2xl font-bold ${gradeColor(projectedPct)}`}>
                {letterGrade(projectedPct)}
              </div>
              <div className="text-xs text-gray-500">Projected final</div>
              <div className="text-xs text-gray-400">{projectedPct.toFixed(1)}%</div>
            </div>
          )}
        </div>
      )}

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
