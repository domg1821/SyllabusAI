"use client";

import { useState } from "react";
import { SavedClass, DeadlineItem, ItemType } from "@/lib/types";

interface Props {
  classes: SavedClass[];
  onGoToAnalyze: () => void;
}

type DayItem = { classLabel: string; classId: string; item: DeadlineItem };

const TYPE_DOT: Record<ItemType, string> = {
  exam: "bg-red-500",
  project: "bg-violet-500",
  quiz: "bg-amber-500",
  assignment: "bg-indigo-500",
};

const TYPE_BADGE: Record<ItemType, string> = {
  exam: "bg-red-50 text-red-700 ring-1 ring-red-100",
  project: "bg-violet-50 text-violet-700 ring-1 ring-violet-100",
  quiz: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
  assignment: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100",
};

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

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function buildDayMap(classes: SavedClass[]): Map<string, DayItem[]> {
  const map = new Map<string, DayItem[]>();
  for (const cls of classes) {
    const label = cls.code || cls.name.split(" ").slice(0, 2).join(" ");
    for (const item of cls.items) {
      const d = parseDueDate(item.dueDate);
      if (!d) continue;
      const key = dateKey(d);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({ classLabel: label, classId: cls.id, item });
    }
  }
  return map;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarView({ classes, onGoToAnalyze }: Props) {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [selectedKey, setSelectedKey] = useState<string | null>(() => dateKey(today));

  const dayMap = buildDayMap(classes);

  // Build grid
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete final row
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedItems = selectedKey ? (dayMap.get(selectedKey) ?? []) : [];

  const totalWithDates = Array.from(dayMap.values()).reduce((s, arr) => s + arr.length, 0);

  if (classes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
          <svg className="h-7 w-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-gray-600">No courses to display</p>
        <p className="mt-1 text-xs text-gray-400 max-w-xs">
          Analyze a syllabus and save your course to see all your deadlines mapped on a calendar.
        </p>
        <button
          onClick={onGoToAnalyze}
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
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Calendar</h1>
          <p className="mt-1 text-sm text-gray-500">
            {classes.length} {classes.length === 1 ? "course" : "courses"} · {totalWithDates} dated deadlines
          </p>
        </div>
        {/* Legend */}
        <div className="hidden sm:flex items-center gap-3 text-xs text-gray-500">
          {(["exam", "project", "quiz", "assignment"] as ItemType[]).map((t) => (
            <span key={t} className="flex items-center gap-1">
              <span className={`h-2 w-2 rounded-full ${TYPE_DOT[t]}`} />
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Month nav */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <button
            onClick={prevMonth}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h2 className="text-base font-bold text-gray-900">
            {MONTH_NAMES[month]} {year}
          </h2>
          <button
            onClick={nextMonth}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {DAY_HEADERS.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            if (day === null) {
              return <div key={`empty-${i}`} className="border-b border-r border-gray-50 bg-gray-50/50 p-2 min-h-[72px]" />;
            }

            const cellDate = new Date(year, month, day);
            const key = dateKey(cellDate);
            const items = dayMap.get(key) ?? [];
            const isToday = key === dateKey(today);
            const isSelected = key === selectedKey;
            const hasItems = items.length > 0;

            return (
              <button
                key={key}
                onClick={() => setSelectedKey(isSelected ? null : key)}
                className={`relative border-b border-r border-gray-100 p-2 text-left transition-colors min-h-[72px] ${
                  isSelected
                    ? "bg-indigo-50 ring-1 ring-inset ring-indigo-200"
                    : hasItems
                    ? "hover:bg-gray-50"
                    : "hover:bg-gray-50/50"
                }`}
              >
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                    isToday
                      ? "bg-indigo-600 text-white"
                      : "text-gray-700"
                  }`}
                >
                  {day}
                </span>
                {items.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-0.5">
                    {items.slice(0, 4).map((di, idx) => (
                      <span
                        key={`${di.item.id}-${idx}`}
                        className={`h-1.5 w-1.5 rounded-full ${TYPE_DOT[di.item.type]}`}
                      />
                    ))}
                    {items.length > 4 && (
                      <span className="text-[9px] font-semibold text-gray-400">+{items.length - 4}</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day panel */}
      {selectedKey && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          {selectedItems.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-2">Nothing due on this day.</p>
          ) : (
            <>
              <h3 className="mb-3 text-sm font-semibold text-gray-700">
                {new Date(
                  parseInt(selectedKey.split("-")[0]),
                  parseInt(selectedKey.split("-")[1]),
                  parseInt(selectedKey.split("-")[2])
                ).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </h3>
              <div className="space-y-2">
                {selectedItems.map((di) => (
                  <div
                    key={di.item.id}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
                      di.item.completed ? "opacity-40" : ""
                    }`}
                    style={{ backgroundColor: "rgb(249 250 251)" }}
                  >
                    <span className={`h-2 w-2 shrink-0 rounded-full ${TYPE_DOT[di.item.type]}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${di.item.completed ? "line-through text-gray-400" : "text-gray-800"}`}>
                        {di.item.title}
                      </p>
                      <p className="text-xs text-gray-400">{di.classLabel}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${TYPE_BADGE[di.item.type]}`}>
                      {di.item.type}
                    </span>
                    {di.item.points && (
                      <span className="shrink-0 text-xs text-gray-400">{di.item.points} pts</span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
