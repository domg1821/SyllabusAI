"use client";

import { useState } from "react";
import { StudyWeek, DeadlineItem } from "@/lib/types";

interface Props {
  week: StudyWeek;
  onToggleTask: (weekId: string, taskId: string) => void;
  weekTopic?: string;
  weekChapters?: string;
  examThisWeek?: DeadlineItem;
  daysUntilNextExam?: number | null;
  examProximity?: "normal" | "soon" | "this-week";
}

const dayColor: Record<string, string> = {
  Monday: "text-indigo-500",
  Tuesday: "text-violet-500",
  Wednesday: "text-sky-500",
  Thursday: "text-teal-500",
  Friday: "text-emerald-500",
  Saturday: "text-amber-500",
  Sunday: "text-rose-500",
};

function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function StudyWeekCard({
  week,
  onToggleTask,
  weekTopic,
  weekChapters,
  examThisWeek,
  daysUntilNextExam,
  examProximity = "normal",
}: Props) {
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const completedCount = week.tasks.filter((t) => t.completed).length;
  const totalCount = week.tasks.length;

  const cardBorder =
    examProximity === "this-week"
      ? "border-rose-200 dark:border-rose-900/60"
      : examProximity === "soon"
        ? "border-amber-200 dark:border-amber-900/60"
        : "border-gray-200 dark:border-slate-700";

  const cardBg =
    examProximity === "this-week"
      ? "bg-rose-50/50 dark:bg-rose-950/20"
      : examProximity === "soon"
        ? "bg-amber-50/30 dark:bg-amber-950/20"
        : "bg-white dark:bg-slate-800";

  const headerBorder =
    examProximity === "this-week"
      ? "border-rose-200 dark:border-rose-900/60"
      : examProximity === "soon"
        ? "border-amber-200 dark:border-amber-900/60"
        : "border-gray-100 dark:border-slate-700";

  const headerBg =
    examProximity === "this-week"
      ? "bg-rose-100/60 dark:bg-rose-950/30"
      : examProximity === "soon"
        ? "bg-amber-50 dark:bg-amber-950/30"
        : "bg-gray-50 dark:bg-slate-900/50";

  const showCountdown =
    daysUntilNextExam !== null && daysUntilNextExam !== undefined && daysUntilNextExam >= 0;

  return (
    <div className={`overflow-hidden rounded-xl border shadow-sm ${cardBorder} ${cardBg}`}>
      {/* Exam week banner */}
      {examThisWeek && (
        <div className="flex items-center gap-2 border-b border-rose-200 bg-rose-100 px-5 py-2 dark:border-rose-900/60 dark:bg-rose-950/40">
          <span className="text-sm">🚨</span>
          <span className="text-xs font-bold text-rose-700 dark:text-rose-400">
            Exam Week: {examThisWeek.title}
            {examThisWeek.dueDate && examThisWeek.dueDate.toUpperCase() !== "TBD"
              ? ` — ${examThisWeek.dueDate}`
              : ""}
          </span>
        </div>
      )}

      {/* Header */}
      <div className={`border-b px-5 py-3 ${headerBorder} ${headerBg}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200">{week.weekLabel}</h3>
            {weekTopic && (
              <p className="truncate text-xs font-medium text-indigo-600 dark:text-indigo-400">
                {weekTopic}
                {weekChapters && (
                  <span className="ml-1 font-normal text-gray-400 dark:text-slate-500">· {weekChapters}</span>
                )}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {/* Countdown badge */}
            {showCountdown && (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums ${
                  daysUntilNextExam! <= 7
                    ? "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
                    : "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
                }`}
              >
                {daysUntilNextExam === 0 ? "Today!" : `${daysUntilNextExam}d`}
              </span>
            )}
            <span className="text-xs font-medium text-gray-400 dark:text-slate-500">
              {completedCount}/{totalCount}
            </span>
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className="divide-y divide-gray-50 dark:divide-slate-700/50">
        {week.tasks.map((task) => {
          const isExpanded = expandedTaskId === task.id;
          const hasNotes = Boolean(task.notes?.trim());

          return (
            <div
              key={task.id}
              className={`transition-all duration-200 ${task.completed ? "opacity-40" : ""}`}
            >
              {/* Main task row */}
              <div className="flex items-start gap-3 px-5 py-4">
                {/* Checkbox */}
                <button
                  onClick={() => onToggleTask(week.id, task.id)}
                  aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                    task.completed
                      ? "border-emerald-500 bg-emerald-500"
                      : "border-gray-300 dark:border-slate-600 hover:border-emerald-400"
                  }`}
                >
                  {task.completed && (
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  {/* Day + date + time estimate */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`text-xs font-semibold uppercase tracking-wide ${dayColor[task.day] ?? "text-gray-500"}`}>
                      {task.day}
                    </span>
                    {task.date && (
                      <>
                        <span className="text-xs text-gray-300 dark:text-slate-600">·</span>
                        <span className="text-xs text-gray-400 dark:text-slate-500">{task.date}</span>
                      </>
                    )}
                    {task.estimatedMinutes && (
                      <>
                        <span className="text-xs text-gray-300 dark:text-slate-600">·</span>
                        <span className="text-xs text-gray-400 dark:text-slate-500">{formatMinutes(task.estimatedMinutes)}</span>
                      </>
                    )}
                  </div>

                  {/* Description */}
                  <p className={`mt-0.5 text-sm leading-relaxed ${
                    task.completed ? "text-gray-400 dark:text-slate-600 line-through" : "text-gray-700 dark:text-slate-200"
                  }`}>
                    {task.description}
                  </p>

                  {/* Related item tag */}
                  {task.relatedItem && (
                    <p className="mt-1.5 text-xs font-medium text-indigo-500 dark:text-indigo-400">
                      {task.relatedItem}
                    </p>
                  )}
                </div>

                {/* Expand button (only if task has notes) */}
                {hasNotes && (
                  <button
                    onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                    className="mt-0.5 shrink-0 rounded-full p-1 text-gray-300 dark:text-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-500 dark:hover:text-slate-300 transition-colors"
                    title={isExpanded ? "Hide tip" : "Show study tip"}
                    aria-label={isExpanded ? "Collapse" : "Expand"}
                  >
                    <svg
                      className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Expanded notes */}
              {isExpanded && hasNotes && (
                <div className="mx-5 mb-4 flex items-start gap-2 rounded-lg border border-amber-100 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/30 px-3 py-2.5">
                  <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                  </svg>
                  <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">{task.notes}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
