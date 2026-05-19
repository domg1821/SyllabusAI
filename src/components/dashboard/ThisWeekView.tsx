"use client";

import { SavedClass, DeadlineItem, StudyTask, ItemType } from "@/lib/types";
import { exportToIcs } from "@/lib/icsExport";

interface Props {
  classes: SavedClass[];
  onToggleItem: (classId: string, itemId: string) => void;
  onToggleTask: (classId: string, weekId: string, taskId: string) => void;
  onGoToCourses: () => void;
  onGoToPractice?: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<ItemType, string> = {
  exam:       "bg-red-50 text-red-600 ring-1 ring-red-100",
  project:    "bg-violet-50 text-violet-600 ring-1 ring-violet-100",
  quiz:       "bg-amber-50 text-amber-600 ring-1 ring-amber-100",
  assignment: "bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100",
};
const TYPE_LABELS: Record<ItemType, string> = {
  exam: "Exam", project: "Project", quiz: "Quiz", assignment: "Assignment",
};

const WEEK_DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"] as const;
const SHORT_DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] as const;

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
  const now = new Date(); now.setHours(0,0,0,0);
  const d = new Date(date); d.setHours(0,0,0,0);
  return Math.round((d.getTime() - now.getTime()) / 86_400_000);
}

function formatMins(m: number): string {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60), rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface WeekDay {
  date: Date;
  dayName: string;
  shortLabel: string;
  dateLabel: string;
  isToday: boolean;
  isPast: boolean;
}

interface DayDeadline {
  classId: string; classLabel: string; item: DeadlineItem; daysLeft: number;
}
interface DayTask {
  classId: string; classLabel: string; weekId: string; task: StudyTask;
}
interface DayData {
  wd: WeekDay;
  deadlines: DayDeadline[];
  tasks: DayTask[];
  totalMinutes: number;
}

// For upcoming/undated sections — reuse DeadlineRow shape
interface LooseDeadline {
  classId: string; classLabel: string; item: DeadlineItem; daysLeft: number | null;
}

// ─── Week day computation ─────────────────────────────────────────────────────

function getWeekDays(today: Date): WeekDay[] {
  const norm = new Date(today); norm.setHours(0,0,0,0);
  const dow = today.getDay(); // 0=Sun
  const daysFromMon = dow === 0 ? 6 : dow - 1;
  const monday = new Date(norm); monday.setDate(monday.getDate() - daysFromMon);

  return WEEK_DAYS.map((dayName, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i);
    return {
      date: d, dayName, shortLabel: SHORT_DAYS[i],
      dateLabel: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      isToday: d.getTime() === norm.getTime(),
      isPast:  d.getTime() < norm.getTime(),
    };
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DeadlineRow({ item, classLabel, daysLeft, onToggle }: {
  item: DeadlineItem; classLabel: string; daysLeft: number | null; onToggle: () => void;
}) {
  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-opacity ${
      item.completed ? "border-gray-100 bg-emerald-50/40 opacity-60" : "border-gray-200 bg-white shadow-sm"
    }`}>
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
        {daysLeft !== null && (
          <span className={`min-w-[3rem] text-right text-xs font-semibold ${
            daysLeft === 0 ? "text-red-600" : daysLeft <= 3 ? "text-amber-600" : "text-gray-400"
          }`}>
            {daysLeft === 0 ? "Today" : daysLeft === 1 ? "Tomorrow" : `${daysLeft}d`}
          </span>
        )}
      </div>
    </div>
  );
}

function StudyTaskRow({ task, classLabel, onToggle }: {
  task: StudyTask; classLabel: string; onToggle: () => void;
}) {
  return (
    <div className={`flex items-start gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 ${task.completed ? "opacity-50" : ""}`}>
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
          <span className="font-medium text-indigo-600">{classLabel}</span>
          {task.relatedItem && ` · ${task.relatedItem}`}
          {task.estimatedMinutes ? ` · ~${formatMins(task.estimatedMinutes)}` : ""}
        </p>
      </div>
      {task.estimatedMinutes && (
        <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
          ~{formatMins(task.estimatedMinutes)}
        </span>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ThisWeekView({
  classes,
  onToggleItem,
  onToggleTask,
  onGoToCourses,
  onGoToPractice,
}: Props) {
  // ── Empty state ──
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

  // ── Build week days ──
  const today = new Date();
  const weekDays = getWeekDays(today);

  // ── Current study week per class (first incomplete week) ──
  const currentWeeks = new Map<string, { weekId: string; weekLabel: string; tasks: StudyTask[] }>();
  for (const cls of classes) {
    for (const week of cls.studyPlan) {
      if (week.tasks.some((t) => !t.completed)) {
        currentWeeks.set(cls.id, { weekId: week.id, weekLabel: week.weekLabel, tasks: week.tasks });
        break;
      }
    }
  }

  // ── Build day data ──
  const thisWeekTimestamps = new Set<number>();
  const dayData: DayData[] = weekDays.map((wd) => {
    thisWeekTimestamps.add(wd.date.getTime());
    const deadlines: DayDeadline[] = [];
    const tasks: DayTask[] = [];

    for (const cls of classes) {
      const label = cls.code || cls.courseInfo.name;

      // Deadlines with a date matching this weekday
      for (const item of cls.items) {
        if (item.completed) continue;
        const date = parseDueDate(item.dueDate);
        if (!date) continue;
        const d = new Date(date); d.setHours(0, 0, 0, 0);
        if (d.getTime() === wd.date.getTime()) {
          deadlines.push({ classId: cls.id, classLabel: label, item, daysLeft: daysUntil(date) });
        }
      }

      // Study tasks scheduled for this day name
      const cw = currentWeeks.get(cls.id);
      if (cw) {
        for (const task of cw.tasks) {
          if (task.day === wd.dayName) {
            tasks.push({ classId: cls.id, classLabel: label, weekId: cw.weekId, task });
          }
        }
      }
    }

    const totalMinutes = tasks.reduce((s, { task }) => s + (task.estimatedMinutes ?? 0), 0);
    return { wd, deadlines, tasks, totalMinutes };
  });

  // ── Study task week progress ──
  const allCurrentTasks = [...currentWeeks.values()].flatMap((w) => w.tasks);
  const completedTaskCount = allCurrentTasks.filter((t) => t.completed).length;
  const totalTaskCount = allCurrentTasks.length;

  // ── Upcoming (outside this week, not past due) ──
  const upcomingDeadlines: LooseDeadline[] = [];
  const undatedHigh: LooseDeadline[] = [];
  const undatedOther: LooseDeadline[] = [];

  for (const cls of classes) {
    const label = cls.code || cls.courseInfo.name;
    for (const item of cls.items) {
      if (item.completed) continue;
      const date = parseDueDate(item.dueDate);
      if (!date) {
        const ld: LooseDeadline = { classId: cls.id, classLabel: label, item, daysLeft: null };
        if (item.type === "exam" || item.type === "project" || item.priority === "high") {
          undatedHigh.push(ld);
        } else {
          undatedOther.push(ld);
        }
        continue;
      }
      const d = new Date(date); d.setHours(0, 0, 0, 0);
      const dl = daysUntil(date);
      if (dl < 0) continue; // past due
      if (!thisWeekTimestamps.has(d.getTime())) {
        upcomingDeadlines.push({ classId: cls.id, classLabel: label, item, daysLeft: dl });
      }
    }
  }
  upcomingDeadlines.sort((a, b) => (a.daysLeft ?? 999) - (b.daysLeft ?? 999));

  // ── Due today (any type, not completed) ──
  const dueTodayItems = dayData
    .flatMap((d) => d.deadlines)
    .filter((r) => r.daysLeft === 0 && !r.item.completed);

  // ── Panic mode (exam/project in ≤2 days) ──
  const panicItem = dayData
    .flatMap((d) => d.deadlines)
    .filter((r) => r.daysLeft <= 2 && (r.item.type === "exam" || r.item.type === "project"))[0] ?? null;

  // ── Scroll helper ──
  function scrollToDay(dayName: string) {
    document.getElementById(`tw-day-${dayName.toLowerCase()}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const todayFormatted = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const hasAnyContent = dayData.some((d) => d.deadlines.length > 0 || d.tasks.length > 0)
    || upcomingDeadlines.length > 0 || undatedHigh.length > 0 || undatedOther.length > 0;

  return (
    <div className="space-y-6">
      {/* ── Due today banner ── */}
      {dueTodayItems.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3.5 sm:px-5">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100">
            <svg className="h-4 w-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-orange-900">
              {dueTodayItems.length === 1
                ? "1 item due today"
                : `${dueTodayItems.length} items due today`}
            </p>
            <p className="mt-0.5 text-xs text-orange-700 leading-relaxed">
              {dueTodayItems.slice(0, 2).map((r) => r.item.title).join(" · ")}
              {dueTodayItems.length > 2 ? ` · +${dueTodayItems.length - 2} more` : ""}
            </p>
          </div>
          <button
            className="shrink-0 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-500 transition-colors"
            onClick={() => {
              const today = new Date();
              const dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
              const todayName = dayNames[today.getDay()].toLowerCase();
              document.getElementById(`tw-day-${todayName}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            View
          </button>
        </div>
      )}

      {/* ── Panic banner ── */}
      {panicItem && onGoToPractice && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4 sm:px-5">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100">
            <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-800">
              {panicItem.item.type === "exam" ? "Exam" : "Project"} in{" "}
              {panicItem.daysLeft === 0 ? "less than 24 hours" : panicItem.daysLeft === 1 ? "1 day" : "2 days"}
              {" — "}<span className="font-normal">{panicItem.item.title}</span>
            </p>
            <p className="mt-0.5 text-xs text-red-700">Generate a practice test to review before it's too late.</p>
          </div>
          <button
            onClick={onGoToPractice}
            className="shrink-0 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500 transition-colors"
          >
            Practice now
          </button>
        </div>
      )}

      {/* ── Header ── */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-indigo-600">{todayFormatted}</p>
            <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight text-gray-900">This Week</h1>
          </div>
          <button
            onClick={() => {
              const ics = exportToIcs(classes);
              const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "syllabusai-deadlines.ics";
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
            title="Export all deadlines to Google Calendar / Apple Calendar"
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm hover:border-indigo-300 hover:text-indigo-600 transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
            <span className="hidden sm:inline">Export to Calendar</span>
            <span className="sm:hidden">Export</span>
          </button>
        </div>

        {/* Study task progress */}
        {totalTaskCount > 0 && (
          <div className="mt-3">
            <div className="mb-1.5 flex items-center justify-between text-xs text-gray-500">
              <span>{completedTaskCount} of {totalTaskCount} study tasks done this week</span>
              <span className="font-semibold text-gray-700">{Math.round((completedTaskCount / totalTaskCount) * 100)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100">
              <div
                className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                style={{ width: `${(completedTaskCount / totalTaskCount) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── At-a-glance chips ── */}
      <div
        className="flex gap-2 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
      >
        {dayData.map((d) => {
          const count = d.deadlines.length + d.tasks.length;
          const hasUrgentDeadline = d.deadlines.some((dl) => dl.item.type === "exam" || dl.item.type === "project" || dl.daysLeft <= 1);
          return (
            <button
              key={d.wd.dayName}
              onClick={() => scrollToDay(d.wd.dayName)}
              className={`flex shrink-0 flex-col items-center rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                d.wd.isToday
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                  : d.wd.isPast
                    ? "bg-gray-50 border-gray-200 text-gray-400"
                    : hasUrgentDeadline
                      ? "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                      : d.deadlines.length > 0
                        ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                        : count > 0
                          ? "bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100"
                          : "bg-white border-gray-200 text-gray-400 hover:bg-gray-50"
              }`}
            >
              <span className="font-semibold">{d.wd.shortLabel}</span>
              <span className={`mt-0.5 text-[10px] ${d.wd.isToday ? "text-indigo-200" : "opacity-70"}`}>
                {count > 0 ? `${count}` : "free"}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Day sections ── */}
      {dayData.map((d) => {
        const isEmpty = d.deadlines.length === 0 && d.tasks.length === 0;
        return (
          <section
            id={`tw-day-${d.wd.dayName.toLowerCase()}`}
            key={d.wd.dayName}
            className={`overflow-hidden rounded-2xl border ${
              d.wd.isToday
                ? "border-indigo-200 shadow-md"
                : "border-gray-200"
            }`}
          >
            {/* Day header */}
            <div className={`flex items-center justify-between px-4 py-3 sm:px-5 ${
              d.wd.isToday
                ? "bg-indigo-600"
                : d.wd.isPast
                  ? "bg-gray-50"
                  : "bg-gray-50"
            }`}>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${d.wd.isToday ? "text-white" : d.wd.isPast ? "text-gray-400" : "text-gray-700"}`}>
                  {d.wd.dayName}
                </span>
                {d.wd.isToday && (
                  <span className="rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-bold text-white">TODAY</span>
                )}
                <span className={`text-xs ${d.wd.isToday ? "text-indigo-200" : "text-gray-400"}`}>
                  {d.wd.dateLabel}
                </span>
              </div>
              {d.totalMinutes > 0 && (
                <span className={`text-xs font-medium ${d.wd.isToday ? "text-indigo-200" : "text-gray-400"}`}>
                  ~{formatMins(d.totalMinutes)} study
                </span>
              )}
            </div>

            {/* Content */}
            {isEmpty ? (
              <div className={`px-4 py-4 text-sm sm:px-5 ${d.wd.isPast ? "text-gray-300" : "text-gray-400"}`}>
                🎉 Free day
              </div>
            ) : (
              <div className={`divide-y divide-gray-50 bg-white p-3 space-y-2 ${d.wd.isPast ? "opacity-55" : ""}`}>
                {/* Deadlines first — more prominent */}
                {d.deadlines.map((dl) => (
                  <DeadlineRow
                    key={`${dl.classId}-${dl.item.id}`}
                    item={dl.item}
                    classLabel={dl.classLabel}
                    daysLeft={dl.daysLeft}
                    onToggle={() => onToggleItem(dl.classId, dl.item.id)}
                  />
                ))}
                {/* Study tasks */}
                {d.tasks.map(({ classId, classLabel, weekId, task }) => (
                  <StudyTaskRow
                    key={task.id}
                    task={task}
                    classLabel={classLabel}
                    onToggle={() => onToggleTask(classId, weekId, task.id)}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}

      {/* ── Upcoming (outside this week) ── */}
      {upcomingDeadlines.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900">Coming up</h2>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">
              {upcomingDeadlines.length}
            </span>
          </div>
          <div className="space-y-2">
            {upcomingDeadlines.slice(0, 8).map((r) => (
              <DeadlineRow
                key={`${r.classId}-${r.item.id}`}
                item={r.item}
                classLabel={r.classLabel}
                daysLeft={r.daysLeft}
                onToggle={() => onToggleItem(r.classId, r.item.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Undated high-priority ── */}
      {undatedHigh.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900">Watch list</h2>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-600">
              {undatedHigh.length}
            </span>
          </div>
          <p className="mb-2 text-xs text-gray-400">Confirm exact dates with your syllabus.</p>
          <div className="space-y-2">
            {undatedHigh.map((r) => (
              <DeadlineRow
                key={`${r.classId}-${r.item.id}`}
                item={r.item}
                classLabel={r.classLabel}
                daysLeft={null}
                onToggle={() => onToggleItem(r.classId, r.item.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Undated other ── */}
      {undatedOther.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900">On your plate</h2>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">
              {undatedOther.length}
            </span>
          </div>
          <div className="space-y-2">
            {undatedOther.map((r) => (
              <DeadlineRow
                key={`${r.classId}-${r.item.id}`}
                item={r.item}
                classLabel={r.classLabel}
                daysLeft={null}
                onToggle={() => onToggleItem(r.classId, r.item.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── All caught up ── */}
      {!hasAnyContent && (
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
