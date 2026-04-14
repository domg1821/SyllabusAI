"use client";

import { StudyWeek } from "@/lib/types";

interface Props {
  week: StudyWeek;
  onToggleTask: (weekId: string, taskId: string) => void;
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

export default function StudyWeekCard({ week, onToggleTask }: Props) {
  const completedCount = week.tasks.filter((t) => t.completed).length;
  const totalCount = week.tasks.length;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-5 py-3">
        <h3 className="text-sm font-semibold text-gray-700">{week.weekLabel}</h3>
        <span className="text-xs font-medium text-gray-400">
          {completedCount}/{totalCount} done
        </span>
      </div>

      {/* Tasks */}
      <div className="divide-y divide-gray-50">
        {week.tasks.map((task) => (
          <div
            key={task.id}
            className={`flex items-start gap-3 px-5 py-4 transition-all duration-200 ${
              task.completed ? "opacity-40" : ""
            }`}
          >
            {/* Square checkbox for tasks */}
            <button
              onClick={() => onToggleTask(week.id, task.id)}
              aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                task.completed
                  ? "border-emerald-500 bg-emerald-500"
                  : "border-gray-300 hover:border-emerald-400"
              }`}
            >
              {task.completed && (
                <svg
                  className="h-3 w-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              )}
            </button>

            <div className="min-w-0 flex-1">
              {/* Day + date */}
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-xs font-semibold uppercase tracking-wide ${
                    dayColor[task.day] ?? "text-gray-500"
                  }`}
                >
                  {task.day}
                </span>
                <span className="text-xs text-gray-300">·</span>
                <span className="text-xs text-gray-400">{task.date}</span>
              </div>

              {/* Description */}
              <p
                className={`mt-0.5 text-sm leading-relaxed ${
                  task.completed ? "text-gray-400 line-through" : "text-gray-700"
                }`}
              >
                {task.description}
              </p>

              {/* Related item tag */}
              <p className="mt-1.5 text-xs font-medium text-indigo-500">
                {task.relatedItem}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
