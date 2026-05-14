"use client";

import React, { useState } from "react";
import { SavedClass, DeadlineItem, StudyTask, Priority, ItemType } from "@/lib/types";

interface Props {
  classes: SavedClass[];
  onToggleItem: (classId: string, itemId: string) => void;
  onToggleTask: (classId: string, weekId: string, taskId: string) => void;
  onGoToCourses: () => void;
  onGoToPractice?: () => void;
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

// ─── Date helpers ─────────────────────────────────────────────────────────────

function parseDueDate(raw: string): Date | null {
  if (!raw || raw === "TBD" || raw.toLowerCase() === "tbd") return null;
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d;
  const year = new Date().getFullYear();
  for (const y of [year, year + 1]) {
    const a = new Date(`${raw} ${y}`);
    if (!isNaN(a.getTime())) return a;
    const b = new Date(`${raw}, ${y}`);
    if (!isNaN(b.getTime())) return b;
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

// ─── Row shapes ───────────────────────────────────────────────────────────────

interface DeadlineRow {
  classId: string;
  classLabel: string;
  item: DeadlineItem;
  daysLeft: number | null;
}

interface TaskRow {
  classId: string;
  classLabel: string;
  weekId: string;
  task: StudyTask;
  dayIndex: number;
  weekLabel: string;
}

interface ClassStudyGroup {
  classId: string;
  classLabel: string;
  weekLabel: string;
  tasks: TaskRow[];
  upcomingAlert: { label: string; daysLeft: number | null; urgent: boolean } | null;
}

// ─── Deadline row ─────────────────────────────────────────────────────────────

function DeadlineRow({ row, onToggle }: { row: DeadlineRow; onToggle: () => void }) {
  const { item, classLabel, daysLeft } = row;
  return (
    <div className={`flex items-center gap-3 rounded-xl border bg-white px-4 py-3 shadow-sm transition-opacity ${item.completed ? "opacity-40" : ""}`}>
      <button
        onClick={onToggle}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
          item.completed ? "border-indigo-500 bg-indigo-500" : "border-gray-300 hover:border-indigo-400"
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
          <span className={`min-w-[3rem] text-right text-xs font-semibold ${
            daysLeft === 0 ? "text-red-600" : daysLeft <= 3 ? "text-amber-600" : "text-gray-400"
          }`}>
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

// ─── Study task row ───────────────────────────────────────────────────────────

function StudyTaskRow({ row, onToggle, hideClass }: { row: TaskRow; onToggle: () => void; hideClass?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const { task, classLabel, weekLabel } = row;
  const hasNotes = Boolean(task.notes?.trim());

  function formatMins(m: number) {
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
  }

  return (
    <div className={`overflow-hidden transition-opacity ${task.completed ? "opacity-40" : ""}`}>
      <div className="flex items-start gap-3 px-4 py-3">
        <button
          onClick={onToggle}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
            task.completed ? "border-indigo-500 bg-indigo-500" : "border-gray-300 hover:border-indigo-400"
          }`}
        >
          {task.completed && (
            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          )}
        </button>
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium leading-snug ${task.completed ? "line-through text-gray-400" : "text-gray-800"}`}>
            {task.description}
          </p>
          <p className="mt-0.5 text-xs text-gray-400">
            {!hideClass && <span className="font-medium text-indigo-600">{classLabel} · </span>}
            <span>{task.day}</span>
            {task.relatedItem && ` · for ${task.relatedItem}`}
            {task.estimatedMinutes && ` · ~${formatMins(task.estimatedMinutes)}`}
          </p>
          {hideClass && <p className="mt-0.5 text-[10px] text-gray-300">{weekLabel}</p>}
        </div>
        {hasNotes && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-0.5 shrink-0 rounded-full p-1 text-gray-300 hover:bg-gray-100 hover:text-amber-500 transition-colors"
            title={expanded ? "Hide tip" : "Show study tip"}
          >
            <svg className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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

export default function ThisWeekView({ classes, onToggleItem, onToggleTask, onGoToCourses, onGoToPractice }: Props) {
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
          Analyze a syllabus, save your course, and your deadlines and study tasks will appear here automatically.
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

  // ── Date context ─────────────────────────────────────────────────────────

  const today = new Date();
  const todayDay = today.toLocaleDateString("en-US", { weekday: "long" });
  const todayIndex = DAY_ORDER.indexOf(todayDay);

  // ── Collect all incomplete deadline items ─────────────────────────────────

  const allIncomplete: DeadlineRow[] = [];
  for (const cls of classes) {
    const label = cls.code || cls.courseInfo.name;
    for (const item of cls.items) {
      if (item.completed) continue;
      const date = parseDueDate(item.dueDate);
      const daysLeft = date ? daysUntil(date) : null;
      if (daysLeft !== null && daysLeft < 0) continue; // skip past-due
      allIncomplete.push({ classId: cls.id, classLabel: label, item, daysLeft });
    }
  }

  // Split by date proximity
  const datedItems = allIncomplete
    .filter((r) => r.daysLeft !== null)
    .sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0));

  const dueToday = datedItems.filter((r) => r.daysLeft === 0);
  const thisWeekItems = datedItems.filter((r) => r.daysLeft !== null && r.daysLeft >= 1 && r.daysLeft <= 7);
  const comingUpItems = datedItems.filter((r) => r.daysLeft !== null && r.daysLeft > 7 && r.daysLeft <= 30);

  const undatedHighPriority = allIncomplete.filter(
    (r) => r.daysLeft === null && (r.item.type === "exam" || r.item.type === "project" || r.item.priority === "high")
  );
  const undatedOther = allIncomplete.filter(
    (r) => r.daysLeft === null && r.item.type !== "exam" && r.item.type !== "project" && r.item.priority !== "high"
  );

  // ── Collect study tasks, grouped by class ─────────────────────────────────

  const classGroupMap = new Map<string, ClassStudyGroup>();

  for (const cls of classes) {
    const label = cls.code || cls.courseInfo.name;

    // First incomplete study week
    for (const week of cls.studyPlan) {
      const incompleteTasks = week.tasks.filter((t) => !t.completed);
      if (incompleteTasks.length === 0) continue;

      // Find the nearest upcoming high-priority item for this class
      const highPriorityItems = allIncomplete
        .filter((r) => r.classId === cls.id && (r.item.type === "exam" || r.item.type === "project" || r.item.priority === "high"))
        .sort((a, b) => {
          if (a.daysLeft === null && b.daysLeft === null) return 0;
          if (a.daysLeft === null) return 1;
          if (b.daysLeft === null) return -1;
          return (a.daysLeft ?? 999) - (b.daysLeft ?? 999);
        });

      const nearest = highPriorityItems[0] ?? null;
      let upcomingAlert: ClassStudyGroup["upcomingAlert"] = null;
      if (nearest) {
        const dl = nearest.daysLeft;
        upcomingAlert = {
          label: nearest.item.type === "exam" ? "Exam" : nearest.item.type === "project" ? "Project" : nearest.item.title.split("—")[0].trim(),
          daysLeft: dl,
          urgent: dl !== null && dl <= 7,
        };
      }

      // Sort tasks by day of week starting from today
      const sortedTasks: TaskRow[] = incompleteTasks
        .map((task) => ({
          classId: cls.id,
          classLabel: label,
          weekId: week.id,
          weekLabel: week.weekLabel,
          task,
          dayIndex: DAY_ORDER.indexOf(task.day),
        }))
        .sort((a, b) => {
          const ai = (a.dayIndex - todayIndex + 7) % 7;
          const bi = (b.dayIndex - todayIndex + 7) % 7;
          return ai - bi;
        });

      classGroupMap.set(cls.id, {
        classId: cls.id,
        classLabel: label,
        weekLabel: week.weekLabel,
        tasks: sortedTasks.slice(0, 4), // max 4 tasks per class in this view
        upcomingAlert,
      });
      break; // only first incomplete week per class
    }
  }

  const classStudyGroups = Array.from(classGroupMap.values());

  const hasNoDates = datedItems.length === 0 && (undatedHighPriority.length > 0 || undatedOther.length > 0);

  const totalIncomplete = allIncomplete.length;
  const totalTasks = classStudyGroups.reduce((s, g) => s + g.tasks.length, 0);
  const hasAnything = totalIncomplete > 0 || totalTasks > 0;

  // Panic mode: exam or project within 2 days
  const panicItems = datedItems.filter(
    (r) => r.daysLeft !== null && r.daysLeft <= 2 && (r.item.type === "exam" || r.item.type === "project")
  );
  const panicItem = panicItems[0] ?? null;

  const todayFormatted = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-8">
      {/* Panic mode banner */}
      {panicItem && onGoToPractice && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100">
            <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-800">
              {panicItem.item.type === "exam" ? "Exam" : "Project"} in{" "}
              {panicItem.daysLeft === 0 ? "less than 24 hours" : panicItem.daysLeft === 1 ? "1 day" : "2 days"}
              {" "}— <span className="font-normal">{panicItem.item.title}</span>
            </p>
            <p className="mt-0.5 text-xs text-red-700">
              Still time to review. Generate a practice test to test your knowledge.
            </p>
          </div>
          <button
            onClick={onGoToPractice}
            className="shrink-0 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500 transition-colors"
          >
            Practice now
          </button>
        </div>
      )}

      {/* Header */}
      <div>
        <p className="text-xs font-medium text-indigo-600">{todayFormatted}</p>
        <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight text-gray-900">This Week</h1>
        <p className="mt-1 text-sm text-gray-500">
          {classes.length} {classes.length === 1 ? "course" : "courses"} ·{" "}
          {totalIncomplete} deadline{totalIncomplete !== 1 ? "s" : ""} remaining
          {totalTasks > 0 && ` · ${totalTasks} study task${totalTasks !== 1 ? "s" : ""}`}
        </p>
      </div>

      {/* No-dates notice */}
      {hasNoDates && (
        <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
          </svg>
          <p className="text-xs text-gray-500">
            <span className="font-semibold">Exact due dates weren&apos;t found</span> — confirm deadlines directly with each course. Items below are shown by priority.
          </p>
        </div>
      )}

      {/* ── Due today ── */}
      {dueToday.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <h2 className="text-base font-bold text-gray-900">Due today</h2>
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
              {dueToday.length}
            </span>
          </div>
          <div className="space-y-2">
            {dueToday.map((row) => (
              <DeadlineRow
                key={`${row.classId}-${row.item.id}`}
                row={row}
                onToggle={() => onToggleItem(row.classId, row.item.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Due this week ── */}
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

      {/* ── Watch list: undated high-priority ── */}
      {undatedHighPriority.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900">Watch list</h2>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-600">
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

      {/* ── Study tasks, grouped by class ── */}
      {classStudyGroups.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900">Study tasks</h2>
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-600">
              {totalTasks}
            </span>
          </div>
          <div className="space-y-3">
            {classStudyGroups.map((group) => (
              <div
                key={group.classId}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
              >
                {/* Group header */}
                <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-2.5">
                  <div>
                    <span className="text-sm font-semibold text-gray-800">{group.classLabel}</span>
                    <span className="ml-2 text-xs text-gray-400">{group.weekLabel}</span>
                  </div>
                  {group.upcomingAlert && (
                    <span className={`flex items-center gap-1 text-xs font-semibold ${
                      group.upcomingAlert.urgent ? "text-red-600" : "text-amber-600"
                    }`}>
                      <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                      </svg>
                      {group.upcomingAlert.label}
                      {group.upcomingAlert.daysLeft !== null
                        ? group.upcomingAlert.daysLeft === 0
                          ? " · today"
                          : ` · ${group.upcomingAlert.daysLeft}d`
                        : ""}
                    </span>
                  )}
                </div>
                {/* Tasks */}
                <div className="divide-y divide-gray-50">
                  {group.tasks.map((row) => (
                    <StudyTaskRow
                      key={row.task.id}
                      row={row}
                      onToggle={() => onToggleTask(row.classId, row.weekId, row.task.id)}
                      hideClass
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Coming up (8–30 days) ── */}
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

      {/* ── On your plate: undated normal-priority ── */}
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

      {/* ── All caught up ── */}
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
