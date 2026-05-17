"use client";

import { useState } from "react";
import {
  SavedClass,
  SubmissionStatus,
  DeadlineItem,
  StudyTask,
  StudyWeek,
  ItemType,
} from "@/lib/types";
import { exportToIcs } from "@/lib/icsExport";
import DeadlineCard from "./DeadlineCard";
import StudyWeekCard from "./StudyWeekCard";
import GradeTracker from "./GradeTracker";

interface Props {
  classes: SavedClass[];
  isPro: boolean;
  onStatusChange: (classId: string, itemId: string, status: SubmissionStatus) => void;
  onToggleTask: (classId: string, weekId: string, taskId: string) => void;
  onSetGrade: (classId: string, entry: import("@/lib/types").GradeEntry) => void;
  onRemoveGrade: (classId: string, itemId: string) => void;
  onDelete: (classId: string) => void;
  onUpgradeClick: () => void;
  onAddNew: () => void;
  onGenerateFlashcards?: (groupName: string, cls: SavedClass) => void;
  onStartCram?: (item: DeadlineItem, cls: SavedClass) => void;
}

type ClassView = "deadlines" | "study" | "grades";
type StudyMode = "exam" | "week";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_BADGE: Record<ItemType, string> = {
  exam:       "bg-red-50 text-red-600 ring-1 ring-red-100",
  project:    "bg-violet-50 text-violet-600 ring-1 ring-violet-100",
  quiz:       "bg-amber-50 text-amber-600 ring-1 ring-amber-100",
  assignment: "bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100",
};

function parseDueDate(dateStr: string): Date {
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date(9999, 0, 1) : d;
}

function formatMins(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function matchDeadline(groupName: string, items: DeadlineItem[]): DeadlineItem | undefined {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
  const gn = norm(groupName);
  return items.find((item) => {
    const ti = norm(item.title);
    return ti.includes(gn) || gn.includes(ti);
  });
}

// ─── Exam proximity helpers ────────────────────────────────────────────────────

function getWeekDateRange(week: StudyWeek): { start: Date | null; end: Date | null } {
  const dates = week.tasks
    .filter((t) => t.date)
    .map((t) => new Date(t.date!))
    .filter((d) => !isNaN(d.getTime()));
  if (dates.length === 0) return { start: null, end: null };
  const times = dates.map((d) => d.getTime());
  return { start: new Date(Math.min(...times)), end: new Date(Math.max(...times)) };
}

interface ExamProximityInfo {
  examThisWeek?: DeadlineItem;
  daysUntilNextExam: number | null;
  examProximity: "normal" | "soon" | "this-week";
}

function getExamProximityInfo(week: StudyWeek, items: DeadlineItem[]): ExamProximityInfo {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { start, end } = getWeekDateRange(week);

  const examItems = items
    .filter((item) => item.type === "exam" || item.type === "quiz")
    .sort((a, b) => parseDueDate(a.dueDate).getTime() - parseDueDate(b.dueDate).getTime());

  let examThisWeek: DeadlineItem | undefined;
  if (start && end) {
    const extEnd = new Date(end.getTime() + 2 * 24 * 60 * 60 * 1000);
    examThisWeek = examItems.find((item) => {
      const d = parseDueDate(item.dueDate);
      return d >= start && d <= extEnd;
    });
  }

  const weekStart = start ?? today;
  const nextExam = examItems.find((item) => parseDueDate(item.dueDate) >= weekStart);

  let daysUntilNextExam: number | null = null;
  let examProximity: "normal" | "soon" | "this-week" = "normal";

  if (nextExam) {
    daysUntilNextExam = Math.ceil(
      (parseDueDate(nextExam.dueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (examThisWeek) {
      examProximity = "this-week";
    } else if (daysUntilNextExam <= 7) {
      examProximity = "soon";
    }
  }

  return { examThisWeek, daysUntilNextExam, examProximity };
}

function downloadIcs(cls: SavedClass) {
  const content = exportToIcs([cls]);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${cls.code || cls.name}-deadlines.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Exam group types and computation ─────────────────────────────────────────

interface ExamGroup {
  name: string;
  tasks: (StudyTask & { weekId: string })[];
  deadline?: DeadlineItem;
  totalMins: number;
  completedCount: number;
}

function computeExamGroups(cls: SavedClass): ExamGroup[] {
  const allTasks = cls.studyPlan.flatMap((week) =>
    week.tasks.map((task) => ({ ...task, weekId: week.id }))
  );

  const groupMap = new Map<string, (StudyTask & { weekId: string })[]>();
  for (const task of allTasks) {
    const key = task.relatedItem?.trim() || "General";
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key)!.push(task);
  }

  return [...groupMap.entries()]
    .map(([name, tasks]) => ({
      name,
      tasks,
      deadline: matchDeadline(name, cls.items),
      totalMins: tasks.reduce((s, t) => s + (t.estimatedMinutes ?? 0), 0),
      completedCount: tasks.filter((t) => t.completed).length,
    }))
    .sort((a, b) => {
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return parseDueDate(a.deadline.dueDate).getTime() - parseDueDate(b.deadline.dueDate).getTime();
    });
}

// ─── ExamTimeline ──────────────────────────────────────────────────────────────

function ExamTimeline({ items }: { items: DeadlineItem[] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const examItems = items
    .filter((item) => item.type === "exam" || item.type === "quiz")
    .sort((a, b) => parseDueDate(a.dueDate).getTime() - parseDueDate(b.dueDate).getTime());

  if (examItems.length === 0) return null;

  return (
    <div className="mb-4 overflow-hidden rounded-xl border border-indigo-100 bg-indigo-50/30 p-4">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-indigo-400">
        📍 Exam Roadmap
      </p>
      <div className="overflow-x-auto pb-1">
        <div className="flex items-start min-w-max">
          {/* Today marker */}
          <div className="flex flex-col items-center">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 ring-2 ring-indigo-100">
              <span className="text-[7px] font-black leading-none text-white">NOW</span>
            </div>
            <div className="mt-1.5 text-[9px] font-bold text-indigo-600">Today</div>
          </div>

          {examItems.map((item, i) => {
            const dueDate = parseDueDate(item.dueDate);
            const daysFromToday = Math.ceil(
              (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );
            const isPast = daysFromToday < 0;
            const prevDate = i === 0 ? today : parseDueDate(examItems[i - 1].dueDate);
            const gapDays = Math.ceil(
              (dueDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            const dotBg = isPast
              ? "bg-gray-300 ring-gray-100"
              : daysFromToday <= 7
                ? "bg-red-500 ring-red-100"
                : daysFromToday <= 14
                  ? "bg-amber-400 ring-amber-100"
                  : item.type === "quiz"
                    ? "bg-violet-400 ring-violet-100"
                    : "bg-rose-400 ring-rose-100";

            const lineColor = isPast
              ? "bg-gray-200"
              : daysFromToday <= 7
                ? "bg-red-200"
                : daysFromToday <= 14
                  ? "bg-amber-200"
                  : "bg-gray-200";

            const daysLabel =
              isPast
                ? `${Math.abs(daysFromToday)}d ago`
                : daysFromToday === 0
                  ? "Today!"
                  : `${daysFromToday}d`;

            const daysColor =
              isPast
                ? "text-gray-400"
                : daysFromToday <= 7
                  ? "text-red-500 font-bold"
                  : "text-gray-500";

            return (
              <div key={item.id} className="flex items-start">
                {/* Connector segment */}
                <div className="flex flex-col items-center" style={{ minWidth: "56px" }}>
                  <div className={`mt-3 h-px w-full ${lineColor}`} />
                  <span className="mt-1 text-[8px] text-gray-400">{Math.abs(gapDays)}d</span>
                </div>

                {/* Exam node */}
                <div className="flex flex-col items-center" style={{ maxWidth: "80px" }}>
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full ring-2 text-[8px] font-bold text-white ${dotBg}`}>
                    {isPast ? "✓" : item.type === "quiz" ? "Q" : "E"}
                  </div>
                  <p className="mt-1.5 max-w-[76px] px-1 text-center text-[9px] font-medium leading-tight text-gray-600 line-clamp-2">
                    {item.title}
                  </p>
                  <span className={`mt-0.5 text-[8px] ${daysColor}`}>{daysLabel}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── ExamGroupCard ─────────────────────────────────────────────────────────────

function ExamGroupCard({
  group,
  onFocus,
  onFlashcards,
}: {
  group: ExamGroup;
  onFocus: () => void;
  onFlashcards?: () => void;
}) {
  const progressPct =
    group.tasks.length > 0 ? (group.completedCount / group.tasks.length) * 100 : 0;
  const isAllDone = group.completedCount === group.tasks.length && group.tasks.length > 0;

  // Compute days until exam for urgency coloring
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let days: number | null = null;
  if (group.deadline?.dueDate && group.deadline.dueDate.toUpperCase() !== "TBD") {
    const d = parseDueDate(group.deadline.dueDate);
    if (!isNaN(d.getTime())) {
      days = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }
  }
  const isOverdue = days !== null && days < 0;
  const isUrgent = days !== null && !isOverdue && days <= 7;
  const isSoon = days !== null && !isOverdue && days <= 14;

  const cardBorder = isAllDone
    ? "border-emerald-200 bg-emerald-50/30"
    : isUrgent
      ? "border-red-200 bg-red-50/20"
      : isSoon
        ? "border-amber-200 bg-amber-50/20"
        : "border-gray-200 bg-white";

  const daysLabel =
    days === null
      ? null
      : isOverdue
        ? `${Math.abs(days)}d ago`
        : days === 0
          ? "Today!"
          : `${days}d away`;

  const daysColor = isUrgent
    ? "text-red-500 font-bold"
    : isSoon
      ? "text-amber-500 font-semibold"
      : isOverdue
        ? "text-gray-400"
        : "text-gray-400";

  return (
    <div className={`rounded-xl border p-4 transition-all ${cardBorder}`}>
      {/* Urgency alert strip */}
      {isUrgent && !isAllDone && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-100 px-3 py-1.5">
          <span className="text-sm">🚨</span>
          <span className="text-xs font-semibold text-red-700">
            {days === 0
              ? "Exam is today!"
              : `${days} day${days !== 1 ? "s" : ""} until this exam`}
          </span>
        </div>
      )}

      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            {group.deadline && (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                  TYPE_BADGE[group.deadline.type]
                }`}
              >
                {group.deadline.type}
              </span>
            )}
            {group.deadline && days !== null && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                {parseDueDate(group.deadline.dueDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            )}
            {daysLabel && (
              <span className={`text-[10px] ${daysColor}`}>{daysLabel}</span>
            )}
            {isAllDone && (
              <span className="text-[10px] font-semibold text-emerald-600">✓ Done</span>
            )}
          </div>
          <p className="text-base font-bold text-gray-900 leading-snug">{group.name}</p>
          <p className="mt-0.5 text-xs text-gray-500">
            {group.tasks.length} task{group.tasks.length !== 1 ? "s" : ""}
            {group.totalMins > 0 ? ` · ~${formatMins(group.totalMins)}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-1.5">
          <button
            onClick={onFocus}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 active:scale-95 transition-all"
          >
            Start Studying
          </button>
          {onFlashcards && (
            <button
              onClick={onFlashcards}
              className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 active:scale-95 transition-all"
            >
              Flashcards
            </button>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-gray-400">
          <span>
            {group.completedCount} / {group.tasks.length} completed
          </span>
          <span>{Math.round(progressPct)}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-gray-100">
          <div
            className={`h-1.5 rounded-full transition-all duration-500 ${
              isAllDone ? "bg-emerald-500" : "bg-gradient-to-r from-indigo-500 to-violet-500"
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── FocusedGroupView ──────────────────────────────────────────────────────────

function FocusedGroupView({
  group,
  clsId,
  onToggleTask,
  onBack,
}: {
  group: ExamGroup;
  clsId: string;
  onToggleTask: (classId: string, weekId: string, taskId: string) => void;
  onBack: () => void;
}) {
  const progressPct =
    group.tasks.length > 0 ? (group.completedCount / group.tasks.length) * 100 : 0;

  return (
    <div>
      {/* Focused header */}
      <div className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              {group.deadline && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                    TYPE_BADGE[group.deadline.type]
                  }`}
                >
                  {group.deadline.type}
                </span>
              )}
              {group.deadline && (
                <span className="text-[10px] text-indigo-400">
                  Due{" "}
                  {parseDueDate(group.deadline.dueDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              )}
            </div>
            <p className="text-sm font-bold text-indigo-900 leading-snug">{group.name}</p>
            <p className="mt-0.5 text-xs text-indigo-600">
              {group.completedCount}/{group.tasks.length} tasks complete
              {group.totalMins > 0 ? ` · ~${formatMins(group.totalMins)} total` : ""}
            </p>
          </div>
          <button
            onClick={onBack}
            className="shrink-0 flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <svg
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            All exams
          </button>
        </div>
        <div className="mt-3 h-2 w-full rounded-full bg-indigo-100">
          <div
            className="h-2 rounded-full bg-indigo-500 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Task list */}
      <div className="space-y-2">
        {group.tasks.map((task) => (
          <button
            key={task.id}
            onClick={() => onToggleTask(clsId, task.weekId, task.id)}
            className={`w-full flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
              task.completed
                ? "border-emerald-200 bg-emerald-50/30"
                : "border-gray-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/20"
            }`}
          >
            <div
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                task.completed ? "border-emerald-500 bg-emerald-500" : "border-gray-300"
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
            </div>
            <div className="min-w-0 flex-1">
              <p
                className={`text-sm font-medium leading-snug ${
                  task.completed ? "line-through text-gray-400" : "text-gray-800"
                }`}
              >
                {task.description}
              </p>
              {(task.notes || task.estimatedMinutes) && (
                <p className="mt-0.5 text-xs text-gray-400">
                  {task.notes}
                  {task.estimatedMinutes
                    ? (task.notes ? " · " : "") + `~${formatMins(task.estimatedMinutes)}`
                    : ""}
                </p>
              )}
            </div>
            {task.estimatedMinutes && (
              <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                ~{formatMins(task.estimatedMinutes)}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function CoursesDashboard({
  classes,
  isPro,
  onStatusChange,
  onToggleTask,
  onSetGrade,
  onRemoveGrade,
  onDelete,
  onUpgradeClick,
  onAddNew,
  onGenerateFlashcards,
  onStartCram,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [classView, setClassView] = useState<ClassView>("deadlines");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [studyMode, setStudyMode] = useState<StudyMode>("exam");
  const [focusedGroup, setFocusedGroup] = useState<string | null>(null);

  function openClass(id: string | null) {
    setExpandedId(id);
    setClassView("deadlines");
    setStudyMode("exam");
    setFocusedGroup(null);
  }

  if (classes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
          <svg
            className="h-7 w-7 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
            />
          </svg>
        </div>
        <p className="text-sm font-semibold text-gray-600">No courses saved yet</p>
        <p className="mt-1 text-xs text-gray-400 max-w-xs">
          Analyze a syllabus and save it — all your courses will appear here.
        </p>
        <button
          onClick={onAddNew}
          className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
        >
          Analyze a syllabus
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">My Courses</h1>
          <p className="mt-1 text-sm text-gray-500">
            {classes.length} {classes.length === 1 ? "course" : "courses"} saved
          </p>
        </div>
        <button
          onClick={onAddNew}
          className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add course
        </button>
      </div>

      {/* Course cards */}
      <div className="space-y-3">
        {classes.map((cls) => {
          const isExpanded = expandedId === cls.id;
          const completedItems = cls.items.filter((i) => i.completed).length;
          const totalItems = cls.items.length;
          const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
          const gradedCount = cls.grades.length;

          return (
            <div
              key={cls.id}
              className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden"
            >
              {/* Course header row */}
              <div className="flex items-center gap-3 px-4 py-4 sm:gap-4 sm:px-5">
                <button
                  onClick={() => openClass(isExpanded ? null : cls.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    {cls.code && (
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100">
                        {cls.code}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">{cls.courseInfo.semester}</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-gray-900 truncate">{cls.name}</p>
                  {cls.courseInfo.instructor && (
                    <p className="text-xs text-gray-400">{cls.courseInfo.instructor}</p>
                  )}
                </button>

                {/* Stats */}
                <div className="hidden sm:flex shrink-0 items-center gap-4 text-center">
                  <div>
                    <div className="text-sm font-bold text-gray-800">
                      {completedItems}/{totalItems}
                    </div>
                    <div className="text-[10px] text-gray-400">done</div>
                  </div>
                  {gradedCount > 0 && (
                    <div>
                      <div className="text-sm font-bold text-gray-800">{gradedCount}</div>
                      <div className="text-[10px] text-gray-400">graded</div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-2">
                  {confirmDelete === cls.id ? (
                    <>
                      <button
                        onClick={() => {
                          onDelete(cls.id);
                          setConfirmDelete(null);
                          setExpandedId(null);
                        }}
                        className="rounded px-2 py-1 text-[10px] font-semibold text-white bg-red-500 hover:bg-red-600"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="rounded px-2 py-1 text-[10px] font-semibold text-gray-500 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete(cls.id);
                      }}
                      className="text-gray-300 hover:text-red-400 transition-colors"
                      title="Delete course"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                        />
                      </svg>
                    </button>
                  )}

                  <button
                    onClick={() => openClass(isExpanded ? null : cls.id)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg
                      className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m19.5 8.25-7.5 7.5-7.5-7.5"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              {totalItems > 0 && (
                <div className="h-1 w-full bg-gray-100">
                  <div
                    className="h-1 bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}

              {/* Expanded content */}
              {isExpanded && (
                <div className="border-t border-gray-100 px-4 py-4 sm:px-5">
                  {/* Sub-nav + export button */}
                  <div className="mb-4 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 w-fit">
                      {(["deadlines", "study", "grades"] as ClassView[]).map((v) => (
                        <button
                          key={v}
                          onClick={() => {
                            setClassView(v);
                            setFocusedGroup(null);
                          }}
                          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors capitalize ${
                            classView === v
                              ? "bg-white shadow-sm text-gray-900"
                              : "text-gray-500 hover:text-gray-700"
                          }`}
                        >
                          {v === "study"
                            ? "Study Plan"
                            : v === "grades"
                            ? "Grades"
                            : "Deadlines"}
                        </button>
                      ))}
                    </div>

                    {cls.items.length > 0 && (
                      <button
                        onClick={() => downloadIcs(cls)}
                        title="Export deadlines to calendar"
                        className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
                      >
                        <svg
                          className="h-3.5 w-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                          />
                        </svg>
                        Export .ics
                      </button>
                    )}
                  </div>

                  {/* ── Deadlines tab ── */}
                  {classView === "deadlines" &&
                    (cls.items.length === 0 ? (
                      <p className="text-sm text-gray-400">No deadlines found.</p>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {cls.items.map((item) => (
                          <DeadlineCard
                            key={item.id}
                            item={item}
                            onStatusChange={(id, status) => onStatusChange(cls.id, id, status)}
                            onCram={onStartCram ? () => onStartCram(item, cls) : undefined}
                          />
                        ))}
                      </div>
                    ))}

                  {/* ── Study Plan tab ── */}
                  {classView === "study" &&
                    (isPro ? (
                      cls.studyPlan.length === 0 ? (
                        <p className="text-sm text-gray-400">No study plan available.</p>
                      ) : (
                        <>
                          {/* By Exam / By Week toggle — hidden when focused */}
                          {focusedGroup === null && (
                            <div className="mb-4 flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 w-fit">
                              {(["exam", "week"] as StudyMode[]).map((m) => (
                                <button
                                  key={m}
                                  onClick={() => setStudyMode(m)}
                                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                                    studyMode === m
                                      ? "bg-white shadow-sm text-gray-900"
                                      : "text-gray-500 hover:text-gray-700"
                                  }`}
                                >
                                  {m === "exam" ? "By Exam" : "By Week"}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* By Week view */}
                          {studyMode === "week" && focusedGroup === null && (
                            <div className="space-y-3">
                              <ExamTimeline items={cls.items} />
                              {cls.studyPlan.map((week) => {
                                const wn = week.weekLabel.match(/Week\s+(\d+)/i)?.[1];
                                const wt = wn
                                  ? cls.weeklyTopics?.find((t) => t.week === parseInt(wn))
                                  : undefined;
                                const proximityInfo = getExamProximityInfo(week, cls.items);
                                return (
                                  <StudyWeekCard
                                    key={week.id}
                                    week={week}
                                    onToggleTask={(weekId, taskId) =>
                                      onToggleTask(cls.id, weekId, taskId)
                                    }
                                    weekTopic={wt?.topic}
                                    weekChapters={wt?.chapters}
                                    examThisWeek={proximityInfo.examThisWeek}
                                    daysUntilNextExam={proximityInfo.daysUntilNextExam}
                                    examProximity={proximityInfo.examProximity}
                                  />
                                );
                              })}
                            </div>
                          )}

                          {/* By Exam view */}
                          {studyMode === "exam" && (() => {
                            const groups = computeExamGroups(cls);

                            if (focusedGroup !== null) {
                              const group = groups.find((g) => g.name === focusedGroup);
                              if (!group) return null;
                              return (
                                <FocusedGroupView
                                  group={group}
                                  clsId={cls.id}
                                  onToggleTask={onToggleTask}
                                  onBack={() => setFocusedGroup(null)}
                                />
                              );
                            }

                            return (
                              <div className="space-y-3">
                                {groups.map((group) => (
                                  <ExamGroupCard
                                    key={group.name}
                                    group={group}
                                    onFocus={() => setFocusedGroup(group.name)}
                                    onFlashcards={
                                      onGenerateFlashcards
                                        ? () => onGenerateFlashcards(group.name, cls)
                                        : undefined
                                    }
                                  />
                                ))}
                              </div>
                            );
                          })()}
                        </>
                      )
                    ) : (
                      <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50 p-6 text-center">
                        <p className="text-sm font-semibold text-indigo-700">
                          Study plans are a Pro feature
                        </p>
                        <p className="mt-1 text-xs text-indigo-500">
                          Upgrade to see your week-by-week study schedule.
                        </p>
                        <button
                          onClick={onUpgradeClick}
                          className="mt-3 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
                        >
                          Upgrade to Pro
                        </button>
                      </div>
                    ))}

                  {/* ── Grades tab ── */}
                  {classView === "grades" && (
                    <GradeTracker
                      items={cls.items}
                      grades={cls.grades}
                      onSetGrade={(entry) => onSetGrade(cls.id, entry)}
                      onRemoveGrade={(itemId) => onRemoveGrade(cls.id, itemId)}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
