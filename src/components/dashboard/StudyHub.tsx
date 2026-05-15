"use client";

import { useState } from "react";
import { SavedClass, DeadlineItem, WeeklyTopic } from "@/lib/types";

type StudyView = "courses" | "hub";

interface Props {
  classes: SavedClass[];
  onOpenPracticeTest: (topic: string) => void;
  onOpenFlashcards: (groupName: string, cls: SavedClass) => void;
  onOpenExplainer: (concept: string, cls: SavedClass) => void;
  onOpenCram: (item: DeadlineItem, cls: SavedClass) => void;
  onAddNew: () => void;
}

function getDaysUntil(dueDate: string): number | null {
  if (!dueDate || dueDate.toUpperCase() === "TBD") return null;
  const due = new Date(dueDate);
  if (isNaN(due.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getNextExam(cls: SavedClass): { item: DeadlineItem; daysUntil: number } | null {
  let closest: { item: DeadlineItem; daysUntil: number } | null = null;
  for (const item of cls.items) {
    if (item.type !== "exam" || item.completed) continue;
    const days = getDaysUntil(item.dueDate);
    if (days === null || days < 0) continue;
    if (closest === null || days < closest.daysUntil) {
      closest = { item, daysUntil: days };
    }
  }
  return closest;
}

function getCourseProgress(cls: SavedClass): number {
  if (cls.items.length === 0) return 0;
  return Math.round((cls.items.filter((i) => i.completed).length / cls.items.length) * 100);
}

// ─── Course selection grid ────────────────────────────────────────────────────

function CourseCard({ cls, onSelect }: { cls: SavedClass; onSelect: () => void }) {
  const nextExam = getNextExam(cls);
  const progress = getCourseProgress(cls);

  return (
    <div className="flex flex-col rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          {cls.code && (
            <span className="mb-1 inline-block rounded-full bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-100 dark:ring-indigo-900">
              {cls.code}
            </span>
          )}
          <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 leading-snug">{cls.name}</h3>
        </div>
        {nextExam && (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums ${
              nextExam.daysUntil <= 7
                ? "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
                : nextExam.daysUntil <= 14
                  ? "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
                  : "bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400"
            }`}
          >
            {nextExam.daysUntil === 0 ? "Exam today!" : `Exam in ${nextExam.daysUntil}d`}
          </span>
        )}
      </div>

      {nextExam && (
        <p className="mb-3 text-xs text-gray-500 dark:text-slate-400 truncate">
          Next: {nextExam.item.title}
        </p>
      )}

      {/* Progress bar */}
      <div className="mb-4">
        <div className="mb-1 flex justify-between text-xs text-gray-400 dark:text-slate-500">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-slate-700">
          <div
            className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <button
        onClick={onSelect}
        className="mt-auto flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 active:scale-[0.99] transition-all"
      >
        Start Studying
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </div>
  );
}

// ─── Chapter card ─────────────────────────────────────────────────────────────

function ChapterCard({
  topic,
  cls,
  onPractice,
  onFlashcards,
  onExplain,
}: {
  topic: WeeklyTopic;
  cls: SavedClass;
  onPractice: () => void;
  onFlashcards: () => void;
  onExplain: () => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
      <div className="mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
            Week {topic.week}
          </span>
          {topic.chapters && (
            <span className="text-[10px] text-gray-400 dark:text-slate-500">· {topic.chapters}</span>
          )}
        </div>
        <p className="mt-0.5 text-sm font-semibold text-gray-800 dark:text-slate-200 leading-snug">
          {topic.topic}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onPractice}
          className="flex items-center gap-1 rounded-lg border border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-950 transition-colors"
        >
          📝 Practice Test
        </button>
        <button
          onClick={onFlashcards}
          className="flex items-center gap-1 rounded-lg border border-violet-200 dark:border-violet-900 bg-violet-50 dark:bg-violet-950/50 px-2.5 py-1.5 text-xs font-semibold text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-950 transition-colors"
        >
          🃏 Flashcards
        </button>
        <button
          onClick={onExplain}
          className="flex items-center gap-1 rounded-lg border border-sky-200 dark:border-sky-900 bg-sky-50 dark:bg-sky-950/50 px-2.5 py-1.5 text-xs font-semibold text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-950 transition-colors"
        >
          💡 Explain
        </button>
      </div>
    </div>
  );
}

// ─── Exam card ────────────────────────────────────────────────────────────────

function ExamCard({
  item,
  cls,
  onCram,
  onPractice,
}: {
  item: DeadlineItem;
  cls: SavedClass;
  onCram: () => void;
  onPractice: () => void;
}) {
  const days = getDaysUntil(item.dueDate);
  const urgency =
    days !== null && days <= 7
      ? "border-red-200 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/20"
      : days !== null && days <= 14
        ? "border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20"
        : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800";

  return (
    <div className={`flex items-center gap-3 rounded-xl border p-4 ${urgency}`}>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 leading-snug">{item.title}</p>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
          Due {item.dueDate}
          {days !== null && days >= 0 && (
            <span
              className={`ml-1.5 font-semibold ${
                days <= 7 ? "text-red-500" : days <= 14 ? "text-amber-500" : "text-gray-400"
              }`}
            >
              ({days === 0 ? "Today!" : `${days}d away`})
            </span>
          )}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          onClick={onCram}
          className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/50 px-2.5 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950 active:scale-95 transition-all"
        >
          ⏱ Cram
        </button>
        <button
          onClick={onPractice}
          className="rounded-lg border border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-950 active:scale-95 transition-all"
        >
          📝 Practice
        </button>
      </div>
    </div>
  );
}

// ─── Course study hub ─────────────────────────────────────────────────────────

function CourseStudyHub({
  cls,
  onBack,
  onOpenPracticeTest,
  onOpenFlashcards,
  onOpenExplainer,
  onOpenCram,
}: {
  cls: SavedClass;
  onBack: () => void;
  onOpenPracticeTest: (topic: string) => void;
  onOpenFlashcards: (groupName: string, cls: SavedClass) => void;
  onOpenExplainer: (concept: string, cls: SavedClass) => void;
  onOpenCram: (item: DeadlineItem, cls: SavedClass) => void;
}) {
  const upcomingExams = cls.items
    .filter((i) => i.type === "exam" && !i.completed)
    .filter((i) => {
      const days = getDaysUntil(i.dueDate);
      return days !== null && days >= 0;
    })
    .sort((a, b) => {
      const da = getDaysUntil(a.dueDate) ?? 9999;
      const db = getDaysUntil(b.dueDate) ?? 9999;
      return da - db;
    });

  const chapters = cls.weeklyTopics ?? [];

  return (
    <div className="space-y-8">
      {/* Back + header */}
      <div>
        <button
          onClick={onBack}
          className="mb-4 flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to courses
        </button>
        <div className="flex items-center gap-3">
          {cls.code && (
            <span className="rounded-full bg-indigo-50 dark:bg-indigo-950 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-100 dark:ring-indigo-900">
              {cls.code}
            </span>
          )}
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-slate-100">{cls.name}</h2>
        </div>
      </div>

      {/* Upcoming Exams */}
      {upcomingExams.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide">
            Upcoming Exams
          </h3>
          <div className="space-y-3">
            {upcomingExams.map((item) => (
              <ExamCard
                key={item.id}
                item={item}
                cls={cls}
                onCram={() => onOpenCram(item, cls)}
                onPractice={() => onOpenPracticeTest(`${item.title} — ${cls.name}`)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Chapters / Topics */}
      {chapters.length > 0 ? (
        <section>
          <h3 className="mb-3 text-sm font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide">
            Chapters &amp; Topics
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {chapters.map((topic) => (
              <ChapterCard
                key={topic.week}
                topic={topic}
                cls={cls}
                onPractice={() =>
                  onOpenPracticeTest(
                    `${topic.topic}${topic.chapters ? ` (${topic.chapters})` : ""} — ${cls.name}`
                  )
                }
                onFlashcards={() => onOpenFlashcards(topic.topic, cls)}
                onExplain={() => onOpenExplainer(topic.topic, cls)}
              />
            ))}
          </div>
        </section>
      ) : (
        <section>
          <h3 className="mb-3 text-sm font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide">
            Study Tools
          </h3>
          <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 text-center">
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-3">
              No chapter topics found. Generate a practice test for the whole course.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => onOpenPracticeTest(cls.name)}
                className="flex items-center gap-1.5 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950/50 px-4 py-2 text-sm font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-950 transition-colors"
              >
                📝 Practice Test
              </button>
              <button
                onClick={() => onOpenFlashcards(cls.name, cls)}
                className="flex items-center gap-1.5 rounded-xl border border-violet-200 dark:border-violet-900 bg-violet-50 dark:bg-violet-950/50 px-4 py-2 text-sm font-semibold text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-950 transition-colors"
              >
                🃏 Flashcards
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

// ─── Main StudyHub ────────────────────────────────────────────────────────────

export default function StudyHub({
  classes,
  onOpenPracticeTest,
  onOpenFlashcards,
  onOpenExplainer,
  onOpenCram,
  onAddNew,
}: Props) {
  const [view, setView] = useState<StudyView>("courses");
  const [selectedCls, setSelectedCls] = useState<SavedClass | null>(null);

  if (view === "hub" && selectedCls) {
    return (
      <CourseStudyHub
        cls={selectedCls}
        onBack={() => { setView("courses"); setSelectedCls(null); }}
        onOpenPracticeTest={onOpenPracticeTest}
        onOpenFlashcards={onOpenFlashcards}
        onOpenExplainer={onOpenExplainer}
        onOpenCram={onOpenCram}
      />
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-slate-100">Study Hub</h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-slate-400">
            Pick a course to practice, study flashcards, or cram for exams.
          </p>
        </div>
        <button
          onClick={onAddNew}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add course
        </button>
      </div>

      {classes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 py-16 px-6 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-3xl">
            🎓
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">No courses yet</h3>
          <p className="mt-2 max-w-xs text-sm text-gray-500 dark:text-slate-400">
            Analyze a syllabus to unlock flashcards, practice tests, and exam prep tools.
          </p>
          <button
            onClick={onAddNew}
            className="mt-6 flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 active:scale-[0.99] transition-all"
          >
            Analyze My First Syllabus →
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => (
            <CourseCard
              key={cls.id}
              cls={cls}
              onSelect={() => {
                setSelectedCls(cls);
                setView("hub");
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
