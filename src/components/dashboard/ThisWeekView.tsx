"use client";

import React, { useState } from "react";
import { SavedClass, DeadlineItem, StudyTask, Priority, ItemType } from "@/lib/types";

interface Props {
  classes: SavedClass[];
  onToggleItem: (classId: string, itemId: string) => void;
  onToggleTask: (classId: string, weekId: string, taskId: string) => void;
  onGoToCourses: () => void;
}

const PRIORITY_COLORS: Record<Priority, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-gray-100 text-gray-500",
};

const TYPE_LABELS: Record<ItemType, string> = {
  exam: "Exam",
  project: "Project",
  quiz: "Quiz",
  assignment: "Assignment",
};

const TYPE_COLORS: Record<ItemType, string> = {
  exam: "bg-red-50 text-red-600 ring-1 ring-red-100",
  project: "bg-violet-50 text-violet-600 ring-1 ring-violet-100",
  quiz: "bg-amber-50 text-amber-600 ring-1 ring-amber-100",
  assignment: "bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100",
};

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// ─── Date parsing ─────────────────────────────────────────────────────────────

function parseDueDate(raw: string): Date | null {
  if (!raw || raw === "TBD" || raw.toLowerCase() === "tbd") return null;
  // Try direct parse
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d;
  // Try appending both current year and next year
  const year = new Date().getFullYear();
  for (const y of [year, year + 1]) {
    const attempt = new Date(`${raw} ${y}`);
    if (!isNaN(attempt.getTime())) return attempt;
    // Also try with comma: "Oct 17, 2025" format
    const attempt2 = new Date(`${raw}, ${y}`);
    if (!isNaN(attempt2.getTime())) return attempt2;
  }
  return null;
}

function daysUntil(date: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function isWithinDays(date: Date, days: number): boolean {
  const d = daysUntil(date);
  return d >= 0 && d <= days;
}

// ─── Row shapes ───────────────────────────────────────────────────────────────

interface DeadlineRow {
  classId: string;
  classLabel: string;
  item: DeadlineItem;
  daysLeft: number | null; // null = no parseable date
}

interface TaskRow {
  classId: string;
  classLabel: string;
  weekId: string;
  task: StudyTask;
  dayIndex: number;
  weekLabel: string;
}

// ─── Deadline item card ───────────────────────────────────────────────────────

function DeadlineRow({
  row,
  onToggle,
}: {
  row: DeadlineRow;
  onToggle: () => void;
}) {
  const { item, classLabel, daysLeft } = row;
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border bg-white px-4 py-3 shadow-sm transition-opacity ${
        item.completed ? "opacity-40" : ""
      }`}
    >
      <button
        onClick={onToggle}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
          item.completed
            ? "border-indigo-500 bg-indigo-500"
            : "border-gray-300 hover:border-indigo-400"
        }`}
      >
        {item.completed && (
          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${item.completed ? "line-through text-gray-400" : "text-gray-800"}`}>
          {item.title}
        </p>
        <p className="text-xs text-gray-400">
          <span className="font-medium text-indigo-600">{classLabel}</span>
          {item.dueDate && item.dueDate !== "TBD" && ` · ${item.dueDate}`}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${TYPE_COLORS[item.type]}`}>
          {TYPE_LABELS[item.type]}
        </span>
        {daysLeft !== null ? (
          <span
            className={`min-w-[2rem] text-right text-xs font-semibold ${
              daysLeft === 0
                ? "text-red-600"
                : daysLeft <= 3
                  ? "text-amber-600"
                  : "text-gray-400"
            }`}
          >
            {daysLeft === 0 ? "Today" : daysLeft === 1 ? "Tomorrow" : `${daysLeft}d`}
          </span>
        ) : (
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${PRIORITY_COLORS[item.priority]}`}>
            {item.priority}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Study task card ─────────────────────────────────────────────────────────

function StudyTaskRow({
  row,
  onToggle,
}: {
  row: TaskRow;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { task, classLabel, weekLabel } = row;
  const hasNotes = Boolean(task.notes?.trim());

  return (
    <div className={`rounded-xl border bg-white shadow-sm overflow-hidden transition-opacity ${task.completed ? "opacity-40" : ""}`}>
      <div className="flex items-start gap-3 px-4 py-3">
        <button
          onClick={onToggle}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
            task.completed
              ? "border-indigo-500 bg-indigo-500"
              : "border-gray-300 hover:border-indigo-400"
          }`}
        >
          {task.completed && (
            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          )}
        </button>
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium ${task.completed ? "line-through text-gray-400" : "text-gray-800"}`}>
            {task.description}
          </p>
          <p className="mt-0.5 text-xs text-gray-400">
            <span className="font-medium text-indigo-600">{classLabel}</span>
            {task.day && ` · ${task.day}`}
            {task.relatedItem && ` · for ${task.relatedItem}`}
            {task.estimatedMinutes && ` · ~${task.estimatedMinutes < 60 ? `${task.estimatedMinutes}m` : `${Math.floor(task.estimatedMinutes / 60)}h`}`}
          </p>
          <p className="mt-0.5 text-[10px] text-gray-300">{weekLabel}</p>
        </div>
        {hasNotes && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-0.5 shrink-0 rounded-full p-1 text-gray-300 hover:bg-gray-100 hover:text-amber-500 transition-colors"
            title="Show study tip"
          >
            <svg
              className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
        )}
      </div>
      {expanded && hasNotes && (
        <div className="mx-4 mb-3 flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2">
          <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
          </svg>
          <p className="text-xs leading-relaxed text-amber-800">{task.notes}</p>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ThisWeekView({ classes, onToggleItem, onToggleTask, onGoToCourses }: Props) {
  if (classes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
          <svg className="h-7 w-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-gray-600">No courses saved yet</p>
        <p className="mt-1 text-xs text-gray-400 max-w-xs">
          Analyze a syllabus and save it — your deadlines and study tasks will appear here.
        </p>
        <button
          onClick={onGoToCourses}
          className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
        >
          Add a course
        </button>
      </div>
    );
  }

  // ── Collect all incomplete deadline items ─────────────────────────────────

  const today = new Date();
  const todayDay = today.toLocaleDateString("en-US", { weekday: "long" });
  const todayIndex = DAY_ORDER.indexOf(todayDay);

  const allIncomplete: DeadlineRow[] = [];
  for (const cls of classes) {
    const label = cls.code || cls.courseInfo.name;
    for (const item of cls.items) {
      if (item.completed) continue;
      const date = parseDueDate(item.dueDate);
      const daysLeft = date ? daysUntil(date) : null;
      // Skip items that are past-due (negative days)
      if (daysLeft !== null && daysLeft < 0) continue;
      allIncomplete.push({ classId: cls.id, classLabel: label, item, daysLeft });
    }
  }

  // Items with parseable dates — sorted by date
  const datedItems = allIncomplete
    .filter((r) => r.daysLeft !== null)
    .sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0));

  // Items due within 7 days
  const thisWeekItems = datedItems.filter((r) => r.daysLeft !== null && r.daysLeft <= 7);

  // Items due in 8–30 days
  const comingUpItems = datedItems.filter((r) => r.daysLeft !== null && r.daysLeft > 7 && r.daysLeft <= 30);

  // High-priority items without parseable dates (exams + projects regardless)
  const undatedHighPriority = allIncomplete.filter(
    (r) => r.daysLeft === null && (r.item.type === "exam" || r.item.type === "project" || r.item.priority === "high")
  );

  // All other undated items (assignments, quizzes without dates)
  const undatedOther = allIncomplete.filter(
    (r) => r.daysLeft === null && r.item.type !== "exam" && r.item.type !== "project" && r.item.priority !== "high"
  );

  // ── Collect study tasks ───────────────────────────────────────────────────

  const studyTasks: TaskRow[] = [];
  for (const cls of classes) {
    const label = cls.code || cls.courseInfo.name;
    // Find first week with incomplete tasks
    for (const week of cls.studyPlan) {
      const incompleteTasks = week.tasks.filter((t) => !t.completed);
      if (incompleteTasks.length === 0) continue;
      for (const task of incompleteTasks) {
        const dayIndex = DAY_ORDER.indexOf(task.day);
        studyTasks.push({
          classId: cls.id,
          classLabel: label,
          weekId: week.id,
          weekLabel: week.weekLabel,
          task,
          dayIndex,
        });
      }
      break; // Only the current active week per class
    }
  }

  // Sort by day of week starting from today
  studyTasks.sort((a, b) => {
    const ai = (a.dayIndex - todayIndex + 7) % 7;
    const bi = (b.dayIndex - todayIndex + 7) % 7;
    return ai - bi;
  });

  const hasAnything =
    thisWeekItems.length > 0 ||
    comingUpItems.length > 0 ||
    undatedHighPriority.length > 0 ||
    undatedOther.length > 0 ||
    studyTasks.length > 0;

  const hasNoDates =
    datedItems.length === 0 && (undatedHighPriority.length > 0 || undatedOther.length > 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">This Week</h1>
        <p className="mt-1 text-sm text-gray-500">
          {classes.length} {classes.length === 1 ? "course" : "courses"} · {allIncomplete.length} items remaining
        </p>
      </div>

      {/* Date-availability notice */}
      {hasNoDates && (
        <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
          </svg>
          <p className="text-xs text-gray-500">
            <span className="font-semibold">Exact due dates weren&apos;t found</span> in your syllabus — confirm deadlines directly with each course. The items below are shown by priority.
          </p>
        </div>
      )}

      {/* Due this week (dated items ≤7 days) */}
      {thisWeekItems.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900">Due this week</h2>
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
              {thisWeekItems.length}
            </span>
          </div>
          <div className="space-y-2">
            {thisWeekItems.map((row) => (
              <DeadlineRow
                key={`${row.classId}-${row.item.id}`}
                row={row}
                onToggle={() => onToggleItem(row.classId, row.item.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* High-priority items without dates (exams, projects) */}
      {undatedHighPriority.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900">Watch list</h2>
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
              {undatedHighPriority.length}
            </span>
          </div>
          <p className="mb-2 text-xs text-gray-400">Exams and major projects — confirm exact dates with your syllabus.</p>
          <div className="space-y-2">
            {undatedHighPriority.map((row) => (
              <DeadlineRow
                key={`${row.classId}-${row.item.id}`}
                row={row}
                onToggle={() => onToggleItem(row.classId, row.item.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Study tasks */}
      {studyTasks.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900">Study tasks</h2>
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-600">
              {studyTasks.length}
            </span>
          </div>
          <div className="space-y-2">
            {studyTasks.map((row) => (
              <StudyTaskRow
                key={`${row.classId}-${row.task.id}`}
                row={row}
                onToggle={() => onToggleTask(row.classId, row.weekId, row.task.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Coming up (8–30 days) */}
      {comingUpItems.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900">Coming up</h2>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">
              {comingUpItems.length}
            </span>
          </div>
          <div className="space-y-2">
            {comingUpItems.map((row) => (
              <DeadlineRow
                key={`${row.classId}-${row.item.id}`}
                row={row}
                onToggle={() => onToggleItem(row.classId, row.item.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Undated assignments / quizzes — "on your plate" */}
      {undatedOther.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900">On your plate</h2>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">
              {undatedOther.length}
            </span>
          </div>
          <p className="mb-2 text-xs text-gray-400">Dates unknown — check each course for exact deadlines.</p>
          <div className="space-y-2">
            {undatedOther.map((row) => (
              <DeadlineRow
                key={`${row.classId}-${row.item.id}`}
                row={row}
                onToggle={() => onToggleItem(row.classId, row.item.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Nothing at all */}
      {!hasAnything && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-14 text-center">
          <p className="text-sm font-semibold text-emerald-600">All caught up!</p>
          <p className="mt-1 text-xs text-gray-400">
            No remaining items across your {classes.length} {classes.length === 1 ? "course" : "courses"}.
          </p>
        </div>
      )}
    </div>
  );
}
