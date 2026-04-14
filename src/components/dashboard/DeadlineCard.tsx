"use client";

import { DeadlineItem } from "@/lib/types";

const typeConfig = {
  assignment: {
    label: "Assignment",
    badge: "bg-indigo-50 text-indigo-700 ring-indigo-100",
  },
  quiz: {
    label: "Quiz",
    badge: "bg-amber-50 text-amber-700 ring-amber-100",
  },
  exam: {
    label: "Exam",
    badge: "bg-red-50 text-red-700 ring-red-100",
  },
  project: {
    label: "Project",
    badge: "bg-violet-50 text-violet-700 ring-violet-100",
  },
} as const;

interface Props {
  item: DeadlineItem;
  onToggle: (id: string) => void;
}

export default function DeadlineCard({ item, onToggle }: Props) {
  const config = typeConfig[item.type];

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-4 transition-all duration-200 ${
        item.completed
          ? "border-gray-100 bg-gray-50 opacity-50"
          : "border-gray-200 bg-white shadow-sm hover:shadow-md"
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(item.id)}
        aria-label={item.completed ? "Mark incomplete" : "Mark complete"}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          item.completed
            ? "border-indigo-500 bg-indigo-500"
            : "border-gray-300 hover:border-indigo-400"
        }`}
      >
        {item.completed && (
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

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-medium leading-snug transition-all ${
            item.completed ? "text-gray-400 line-through" : "text-gray-900"
          }`}
        >
          {item.title}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${config.badge}`}
          >
            {config.label}
          </span>
          <span className="text-xs text-gray-400">Due {item.dueDate}</span>
          {item.points !== undefined && (
            <span className="text-xs text-gray-400">{item.points} pts</span>
          )}
        </div>
      </div>
    </div>
  );
}
