"use client";

import { DeadlineItem, SubmissionStatus } from "@/lib/types";

const typeConfig = {
  assignment: { label: "Assignment", badge: "bg-indigo-50 text-indigo-700 ring-indigo-100" },
  quiz:       { label: "Quiz",       badge: "bg-amber-50 text-amber-700 ring-amber-100"   },
  exam:       { label: "Exam",       badge: "bg-red-50 text-red-700 ring-red-100"         },
  project:    { label: "Project",    badge: "bg-violet-50 text-violet-700 ring-violet-100" },
} as const;

const STATUS_ORDER: SubmissionStatus[] = [
  "not_started",
  "in_progress",
  "submitted",
  "graded",
];

const STATUS_CONFIG: Record<SubmissionStatus, { label: string; dot: string; ring: string }> = {
  not_started: { label: "Not started", dot: "bg-gray-300",    ring: "ring-gray-200"   },
  in_progress: { label: "In progress", dot: "bg-amber-400",   ring: "ring-amber-200"  },
  submitted:   { label: "Submitted",   dot: "bg-emerald-500", ring: "ring-emerald-200" },
  graded:      { label: "Graded",      dot: "bg-indigo-500",  ring: "ring-indigo-200" },
};

function cycleStatus(current: SubmissionStatus): SubmissionStatus {
  const idx = STATUS_ORDER.indexOf(current);
  return STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
}

function getDaysUntilDue(dueDate: string): number | null {
  if (!dueDate || dueDate.toUpperCase() === "TBD") return null;
  const due = new Date(dueDate);
  if (isNaN(due.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function dueDateStyle(days: number | null): string {
  if (days === null || days > 7) return "text-gray-400";
  if (days <= 2) return "text-red-500 font-semibold";
  return "text-orange-500 font-medium";
}

interface Props {
  item: DeadlineItem;
  onStatusChange: (id: string, status: SubmissionStatus) => void;
}

export default function DeadlineCard({ item, onStatusChange }: Props) {
  const config = typeConfig[item.type];
  const currentStatus: SubmissionStatus = item.status ?? "not_started";
  const statusCfg = STATUS_CONFIG[currentStatus];
  const isCompleted = item.completed;
  const days = isCompleted ? null : getDaysUntilDue(item.dueDate);
  const dateClass = isCompleted ? "text-gray-400" : dueDateStyle(days);

  function handleStatusClick() {
    onStatusChange(item.id, cycleStatus(currentStatus));
  }

  return (
    <div
      className={`relative flex items-start gap-3 rounded-xl border p-4 transition-all duration-200 ${
        isCompleted
          ? "border-gray-100 bg-emerald-50/40"
          : "border-gray-200 bg-white shadow-sm hover:shadow-md"
      }`}
    >
      {/* Green left border strip for completed items */}
      {isCompleted && (
        <div className="absolute left-0 top-0 h-full w-1 rounded-l-xl bg-emerald-400" />
      )}

      {/* Status cycle button */}
      <button
        onClick={handleStatusClick}
        title={`Status: ${statusCfg.label} — click to advance`}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ring-2 transition-all ${statusCfg.ring}`}
      >
        <span className={`h-3 w-3 rounded-full ${statusCfg.dot}`} />
      </button>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium leading-snug transition-all ${
          isCompleted ? "text-gray-400 line-through" : "text-gray-900"
        }`}>
          {item.title}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${config.badge}`}>
            {config.label}
          </span>
          <span className={`text-xs ${dateClass}`}>Due {item.dueDate}</span>
          {item.points !== undefined && (
            <span className="text-xs text-gray-400">{item.points} pts</span>
          )}
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${statusCfg.ring}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
            {statusCfg.label}
          </span>
        </div>
      </div>
    </div>
  );
}
