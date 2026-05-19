"use client";

import { useState, useEffect } from "react";
import { SavedClass, DeadlineItem, WeeklyTopic, StudySession, TestAttempt } from "@/lib/types";
import { getStudySessions } from "@/lib/useStudySessions";
import { HISTORY_KEY } from "@/lib/usePracticeTests";
import TeachBackMode from "./TeachBackMode";
import MemoryMapMode from "./MemoryMapMode";
import ExamStyleMode from "./ExamStyleMode";
import TutorChatMode from "./TutorChatMode";

type StudyView = "courses" | "hub";
type ExamQuestionType = "multiple_choice" | "short_answer" | "essay";

interface TeachBackSession { topic: string; cls: SavedClass; }
interface MemoryMapSession { topic: string; cls: SavedClass; }
interface ExamStyleSession { topic: string; cls: SavedClass; examType: ExamQuestionType; }

interface Recommendation {
  topPriority: string;
  reasoning: string;
  suggestedTime: number;
  courseHint: string;
  chapterHint: string;
}

interface Props {
  classes: SavedClass[];
  isPro?: boolean;
  onOpenPracticeTest: (topic: string) => void;
  onOpenFlashcards: (groupName: string, cls: SavedClass) => void;
  onOpenExplainer: (concept: string, cls: SavedClass) => void;
  onOpenCram: (item: DeadlineItem, cls: SavedClass) => void;
  onAddNew: () => void;
  onUpgrade?: () => void;
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

// ─── Recommendation card ──────────────────────────────────────────────────────

function RecommendationCard({
  classes,
  onNavigateToCourse,
}: {
  classes: SavedClass[];
  onNavigateToCourse: (cls: SavedClass) => void;
}) {
  const [rec, setRec] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (classes.length === 0) { setLoading(false); return; }

    async function load() {
      const upcomingExams: { title: string; courseName: string; daysUntil: number }[] = [];
      for (const cls of classes) {
        for (const item of cls.items) {
          if (item.type === "exam" && !item.completed) {
            const days = getDaysUntil(item.dueDate);
            if (days !== null && days >= 0 && days <= 60) {
              upcomingExams.push({ title: item.title, courseName: cls.name, daysUntil: days });
            }
          }
        }
      }
      upcomingExams.sort((a, b) => a.daysUntil - b.daysUntil);

      let weakTopics: string[] = [];
      try {
        const raw = localStorage.getItem(HISTORY_KEY);
        const history: TestAttempt[] = raw ? JSON.parse(raw) : [];
        weakTopics = history
          .filter((t) => t.score >= 0 && t.score < 60)
          .slice(0, 5)
          .map((t) => t.topic);
      } catch { /* ignore */ }

      const sessions = getStudySessions();
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const recentSessionCount = sessions.filter((s) => new Date(s.date).getTime() >= weekAgo).length;

      try {
        const res = await fetch("/api/study-recommendation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            upcomingExams: upcomingExams.slice(0, 5),
            weakTopics,
            recentSessionCount,
            courseCount: classes.length,
          }),
        });
        const json = await res.json();
        setRec(json.recommendation ?? null);
      } catch {
        setRec(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [classes]);

  if (dismissed) return null;

  return (
    <div className="mb-6 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="shrink-0 text-2xl">🎯</span>
        <div className="min-w-0 flex-1">
          <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            What should I study today?
          </p>
          {loading ? (
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm text-gray-500 dark:text-slate-400">Analysing your schedule…</span>
            </div>
          ) : rec ? (
            <>
              <p className="text-sm font-bold text-gray-900 dark:text-slate-100">{rec.topPriority}</p>
              <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-slate-300">{rec.reasoning}</p>
              <div className="mt-2.5 flex flex-wrap items-center gap-3">
                <span className="text-xs text-gray-400 dark:text-slate-500">
                  ⏱ <span className="font-semibold text-gray-600 dark:text-slate-300">{rec.suggestedTime} min</span> suggested
                </span>
                {rec.courseHint && (() => {
                  const hint = rec.courseHint.toLowerCase();
                  const matched = classes.find(
                    (c) => c.name.toLowerCase().includes(hint) || hint.includes(c.name.toLowerCase().split(" ")[0])
                  );
                  return matched ? (
                    <button
                      onClick={() => onNavigateToCourse(matched)}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Go to {matched.name.split(" ").slice(0, 3).join(" ")} →
                    </button>
                  ) : null;
                })()}
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500 dark:text-slate-400">Pick a course and start studying!</p>
          )}
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 text-gray-300 dark:text-slate-600 hover:text-gray-500 dark:hover:text-slate-400 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Study progress dashboard ─────────────────────────────────────────────────

function StudyProgressDashboard({ cls }: { cls: SavedClass }) {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [testHistory, setTestHistory] = useState<TestAttempt[]>([]);

  useEffect(() => {
    setSessions(getStudySessions());
    try {
      const raw = localStorage.getItem("sai_test_history");
      setTestHistory(raw ? JSON.parse(raw) : []);
    } catch { setTestHistory([]); }
  }, []);

  if (sessions.length === 0 && testHistory.length === 0) return null;

  // 28-day heatmap (all courses)
  const now = new Date();
  const days28 = Array.from({ length: 28 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (27 - i));
    const key = d.toISOString().slice(0, 10);
    const mins = sessions
      .filter((s) => s.date.startsWith(key))
      .reduce((sum, s) => sum + s.duration / 60_000, 0);
    return { date: key, minutes: Math.round(mins) };
  });

  // Course-specific test scores
  const clsNameLower = cls.name.toLowerCase();
  const courseTests = testHistory
    .filter((t) => t.score >= 0 && t.topic.toLowerCase().includes(clsNameLower.split(" ")[0]))
    .slice(-8);

  // Strongest / weakest from course study sessions
  const courseSessions = sessions.filter((s) => s.courseName === cls.name && (s.score ?? 0) > 0);
  const chapterScores: Record<string, number[]> = {};
  for (const s of courseSessions) {
    if (!chapterScores[s.chapter]) chapterScores[s.chapter] = [];
    chapterScores[s.chapter].push(s.score ?? 0);
  }
  const chapterAvgs = Object.entries(chapterScores)
    .map(([ch, scores]) => ({ ch, avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) }))
    .sort((a, b) => b.avg - a.avg);
  const strongest = chapterAvgs[0];
  const weakest = chapterAvgs.length > 1 ? chapterAvgs[chapterAvgs.length - 1] : null;

  // Weekly study ring (all courses)
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weeklyMins = Math.round(
    sessions
      .filter((s) => new Date(s.date).getTime() >= weekAgo)
      .reduce((sum, s) => sum + s.duration / 60_000, 0)
  );
  const weeklyTarget = 300;
  const weeklyPct = Math.min(1, weeklyMins / weeklyTarget);
  const r = 20;
  const circ = 2 * Math.PI * r;

  const heatColors = [
    "bg-gray-100 dark:bg-slate-700",
    "bg-indigo-200 dark:bg-indigo-900",
    "bg-indigo-300 dark:bg-indigo-700",
    "bg-indigo-400 dark:bg-indigo-600",
    "bg-indigo-500 dark:bg-indigo-500",
  ];

  return (
    <section>
      <h3 className="mb-3 text-sm font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide">
        My Progress
      </h3>
      <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-5">

        {/* 28-day heatmap */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
            Activity — last 28 days
          </p>
          <div className="flex flex-wrap gap-1">
            {days28.map((d) => {
              const level = d.minutes === 0 ? 0 : d.minutes < 15 ? 1 : d.minutes < 30 ? 2 : d.minutes < 60 ? 3 : 4;
              return (
                <div
                  key={d.date}
                  title={`${d.date}: ${d.minutes} min`}
                  className={`h-4 w-4 rounded-sm ${heatColors[level]}`}
                />
              );
            })}
          </div>
          <div className="mt-1.5 flex items-center gap-1 text-[9px] text-gray-400 dark:text-slate-500">
            <span>Less</span>
            {[1, 2, 3, 4].map((l) => (
              <span key={l} className={`inline-block h-3 w-3 rounded-sm ${heatColors[l]}`} />
            ))}
            <span>More</span>
          </div>
        </div>

        {/* Weekly ring + strongest/weakest */}
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className="relative flex h-14 w-14 items-center justify-center">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r={r} fill="none" stroke="currentColor" strokeWidth="5" className="text-gray-100 dark:text-slate-700" />
                <circle
                  cx="24" cy="24" r={r} fill="none" stroke="#6366f1" strokeWidth="5"
                  strokeDasharray={`${circ * weeklyPct} ${circ}`}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dasharray 0.6s ease" }}
                />
              </svg>
              <div className="text-center">
                <p className="text-[11px] font-extrabold leading-none text-indigo-600 dark:text-indigo-400">{weeklyMins}</p>
                <p className="text-[8px] text-gray-400">min</p>
              </div>
            </div>
            <p className="text-center text-[9px] text-gray-400 dark:text-slate-500">
              this week<br />{weeklyTarget} min goal
            </p>
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            {strongest && (
              <div className="rounded-lg border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2">
                <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Strongest</p>
                <p className="mt-0.5 text-xs font-semibold leading-snug text-gray-800 dark:text-slate-200 truncate">{strongest.ch}</p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400">{strongest.avg}% avg</p>
              </div>
            )}
            {weakest && (
              <div className="rounded-lg border border-amber-100 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 px-3 py-2">
                <p className="text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Needs work</p>
                <p className="mt-0.5 text-xs font-semibold leading-snug text-gray-800 dark:text-slate-200 truncate">{weakest.ch}</p>
                <p className="text-[10px] text-amber-600 dark:text-amber-400">{weakest.avg}% avg</p>
              </div>
            )}
          </div>
        </div>

        {/* Practice test bar chart */}
        {courseTests.length > 0 && (
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
              Practice test scores
            </p>
            <div className="flex h-12 items-end gap-1.5">
              {courseTests.map((t, i) => {
                const pct = Math.max(6, t.score);
                const bar =
                  t.score >= 80
                    ? "bg-emerald-400 dark:bg-emerald-500"
                    : t.score >= 60
                      ? "bg-amber-400 dark:bg-amber-500"
                      : "bg-red-400 dark:bg-red-500";
                return (
                  <div key={i} className="flex flex-1 flex-col items-center gap-0.5">
                    <div
                      className={`w-full rounded-t-sm ${bar}`}
                      style={{ height: `${pct}%` }}
                      title={`${t.topic}: ${t.score}%`}
                    />
                    <span className="text-[8px] text-gray-400 dark:text-slate-500">{t.score}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Course selection card ────────────────────────────────────────────────────

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
          <h3 className="text-sm font-bold leading-snug text-gray-900 dark:text-slate-100">{cls.name}</h3>
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
        <p className="mb-3 truncate text-xs text-gray-500 dark:text-slate-400">
          Next: {nextExam.item.title}
        </p>
      )}

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
  onTeachBack,
  onMemoryMap,
  onExamStyle,
}: {
  topic: WeeklyTopic;
  cls: SavedClass;
  onPractice: () => void;
  onFlashcards: () => void;
  onExplain: () => void;
  onTeachBack: () => void;
  onMemoryMap: () => void;
  onExamStyle: () => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
      <div className="mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
            Week {topic.week}
          </span>
          {topic.chapters && (
            <span className="text-[10px] text-gray-400 dark:text-slate-500">· {topic.chapters}</span>
          )}
        </div>
        <p className="mt-0.5 text-sm font-semibold leading-snug text-gray-800 dark:text-slate-200">
          {topic.topic}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {([
          { emoji: "📝", label: "Practice", sub: "Test yourself", color: "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-100 dark:border-indigo-900 hover:bg-indigo-100 dark:hover:bg-indigo-950 text-indigo-700 dark:text-indigo-300", onClick: onPractice },
          { emoji: "🃏", label: "Flashcards", sub: "Key terms", color: "bg-violet-50 dark:bg-violet-950/60 border-violet-100 dark:border-violet-900 hover:bg-violet-100 dark:hover:bg-violet-950 text-violet-700 dark:text-violet-300", onClick: onFlashcards },
          { emoji: "💡", label: "Explain", sub: "Break it down", color: "bg-sky-50 dark:bg-sky-950/60 border-sky-100 dark:border-sky-900 hover:bg-sky-100 dark:hover:bg-sky-950 text-sky-700 dark:text-sky-300", onClick: onExplain },
          { emoji: "🧑‍🏫", label: "Teach It", sub: "Feynman method", color: "bg-orange-50 dark:bg-orange-950/60 border-orange-100 dark:border-orange-900 hover:bg-orange-100 dark:hover:bg-orange-950 text-orange-700 dark:text-orange-300", onClick: onTeachBack },
          { emoji: "🗺️", label: "Memory Map", sub: "Visual concepts", color: "bg-purple-50 dark:bg-purple-950/60 border-purple-100 dark:border-purple-900 hover:bg-purple-100 dark:hover:bg-purple-950 text-purple-700 dark:text-purple-300", onClick: onMemoryMap },
          { emoji: "📋", label: "Exam Style", sub: "Timed questions", color: "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-100 dark:border-emerald-900 hover:bg-emerald-100 dark:hover:bg-emerald-950 text-emerald-700 dark:text-emerald-300", onClick: onExamStyle },
        ] as const).map(({ emoji, label, sub, color, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 text-center transition-all active:scale-95 ${color}`}
          >
            <span className="text-xl leading-none">{emoji}</span>
            <span className="text-xs font-bold leading-tight">{label}</span>
            <span className="text-[10px] leading-tight opacity-60">{sub}</span>
          </button>
        ))}
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
  onExamStyle,
}: {
  item: DeadlineItem;
  cls: SavedClass;
  onCram: () => void;
  onPractice: () => void;
  onExamStyle: () => void;
}) {
  const days = getDaysUntil(item.dueDate);
  const urgency =
    days !== null && days <= 7
      ? "border-red-200 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/20"
      : days !== null && days <= 14
        ? "border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20"
        : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800";

  return (
    <div className={`rounded-xl border p-4 ${urgency}`}>
      <div className="mb-3">
        <p className="text-sm font-semibold leading-snug text-gray-900 dark:text-slate-100">{item.title}</p>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
          Due {item.dueDate}
          {days !== null && days >= 0 && (
            <span className={`ml-1.5 font-semibold ${days <= 7 ? "text-red-500" : days <= 14 ? "text-amber-500" : "text-gray-400"}`}>
              ({days === 0 ? "Today!" : `${days}d away`})
            </span>
          )}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
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
        <button
          onClick={onExamStyle}
          className="rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950 active:scale-95 transition-all"
        >
          📋 Exam Style
        </button>
      </div>
    </div>
  );
}

// ─── Course study hub ─────────────────────────────────────────────────────────

function CourseStudyHub({
  cls,
  isPro,
  onBack,
  onOpenPracticeTest,
  onOpenFlashcards,
  onOpenExplainer,
  onOpenCram,
  onTeachBack,
  onMemoryMap,
  onExamStyle,
  onOpenTutor,
  onUpgrade,
}: {
  cls: SavedClass;
  isPro?: boolean;
  onBack: () => void;
  onOpenPracticeTest: (topic: string) => void;
  onOpenFlashcards: (groupName: string, cls: SavedClass) => void;
  onOpenExplainer: (concept: string, cls: SavedClass) => void;
  onOpenCram: (item: DeadlineItem, cls: SavedClass) => void;
  onTeachBack: (topic: string) => void;
  onMemoryMap: (topic: string) => void;
  onExamStyle: (topic: string, type: ExamQuestionType) => void;
  onOpenTutor: () => void;
  onUpgrade?: () => void;
}) {
  const upcomingExams = cls.items
    .filter((i) => i.type === "exam" && !i.completed)
    .filter((i) => { const d = getDaysUntil(i.dueDate); return d !== null && d >= 0; })
    .sort((a, b) => (getDaysUntil(a.dueDate) ?? 9999) - (getDaysUntil(b.dueDate) ?? 9999));

  const chapters = cls.weeklyTopics ?? [];

  return (
    <div className="space-y-8">
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
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {cls.code && (
              <span className="shrink-0 rounded-full bg-indigo-50 dark:bg-indigo-950 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-100 dark:ring-indigo-900">
                {cls.code}
              </span>
            )}
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-slate-100 truncate">{cls.name}</h2>
          </div>
          {isPro ? (
            <button
              onClick={onOpenTutor}
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-violet-200 dark:border-violet-900 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 px-3 py-2 text-xs font-semibold text-violet-700 dark:text-violet-300 hover:from-violet-100 hover:to-indigo-100 dark:hover:from-violet-950/50 dark:hover:to-indigo-950/50 transition-all shadow-sm"
            >
              🧑‍🏫 <span className="hidden sm:inline">AI</span> Tutor
            </button>
          ) : (
            <button
              onClick={onUpgrade}
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-gray-500 dark:text-slate-400 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
              title="Upgrade to Pro to unlock AI Tutor"
            >
              🧑‍🏫 <span className="hidden sm:inline">AI</span> Tutor
              <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">Pro</span>
            </button>
          )}
        </div>
      </div>

      {upcomingExams.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-700 dark:text-slate-300">
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
                onExamStyle={() => onExamStyle(`${item.title} — ${cls.name}`, "multiple_choice")}
              />
            ))}
          </div>
        </section>
      )}

      {chapters.length > 0 ? (
        <section>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-700 dark:text-slate-300">
            Chapters &amp; Topics
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {chapters.map((topic) => {
              const label = `${topic.topic}${topic.chapters ? ` (${topic.chapters})` : ""} — ${cls.name}`;
              return (
                <ChapterCard
                  key={topic.week}
                  topic={topic}
                  cls={cls}
                  onPractice={() => onOpenPracticeTest(label)}
                  onFlashcards={() => onOpenFlashcards(topic.topic, cls)}
                  onExplain={() => onOpenExplainer(topic.topic, cls)}
                  onTeachBack={() => onTeachBack(topic.topic)}
                  onMemoryMap={() => onMemoryMap(topic.topic)}
                  onExamStyle={() => onExamStyle(topic.topic, "short_answer")}
                />
              );
            })}
          </div>
        </section>
      ) : (
        <section>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-700 dark:text-slate-300">
            Study Tools
          </h3>
          <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 text-center">
            <p className="mb-3 text-sm text-gray-500 dark:text-slate-400">
              No chapter topics found. Use these tools for the whole course.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
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
              <button
                onClick={() => onTeachBack(cls.name)}
                className="flex items-center gap-1.5 rounded-xl border border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/50 px-4 py-2 text-sm font-semibold text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-950 transition-colors"
              >
                🧑‍🏫 Teach It
              </button>
            </div>
          </div>
        </section>
      )}

      <StudyProgressDashboard cls={cls} />
    </div>
  );
}

// ─── Main StudyHub ────────────────────────────────────────────────────────────

export default function StudyHub({
  classes,
  isPro,
  onOpenPracticeTest,
  onOpenFlashcards,
  onOpenExplainer,
  onOpenCram,
  onAddNew,
  onUpgrade,
}: Props) {
  const [view, setView] = useState<StudyView>("courses");
  const [selectedCls, setSelectedCls] = useState<SavedClass | null>(null);
  const [teachBackSession, setTeachBackSession] = useState<TeachBackSession | null>(null);
  const [memoryMapSession, setMemoryMapSession] = useState<MemoryMapSession | null>(null);
  const [examStyleSession, setExamStyleSession] = useState<ExamStyleSession | null>(null);
  const [tutorOpen, setTutorOpen] = useState(false);

  function openCourseHub(cls: SavedClass) {
    setSelectedCls(cls);
    setView("hub");
  }

  const renderContent = () => {
    if (view === "hub" && selectedCls) {
      return (
        <CourseStudyHub
          cls={selectedCls}
          isPro={isPro}
          onBack={() => { setView("courses"); setSelectedCls(null); }}
          onOpenPracticeTest={onOpenPracticeTest}
          onOpenFlashcards={onOpenFlashcards}
          onOpenExplainer={onOpenExplainer}
          onOpenCram={onOpenCram}
          onTeachBack={(topic) => setTeachBackSession({ topic, cls: selectedCls })}
          onMemoryMap={(topic) => setMemoryMapSession({ topic, cls: selectedCls })}
          onExamStyle={(topic, examType) => setExamStyleSession({ topic, cls: selectedCls, examType })}
          onOpenTutor={() => setTutorOpen(true)}
          onUpgrade={onUpgrade}
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
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-6 py-16 text-center">
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
          <>
            <RecommendationCard classes={classes} onNavigateToCourse={openCourseHub} />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {classes.map((cls) => (
                <CourseCard key={cls.id} cls={cls} onSelect={() => openCourseHub(cls)} />
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <>
      {renderContent()}

      {teachBackSession && (
        <TeachBackMode
          topic={teachBackSession.topic}
          cls={teachBackSession.cls}
          onClose={() => setTeachBackSession(null)}
        />
      )}

      {memoryMapSession && (
        <MemoryMapMode
          topic={memoryMapSession.topic}
          cls={memoryMapSession.cls}
          onClose={() => setMemoryMapSession(null)}
          onQuizMe={(topic) => {
            setMemoryMapSession(null);
            onOpenPracticeTest(topic);
          }}
        />
      )}

      {examStyleSession && (
        <ExamStyleMode
          topic={examStyleSession.topic}
          cls={examStyleSession.cls}
          examType={examStyleSession.examType}
          onClose={() => setExamStyleSession(null)}
        />
      )}

      {tutorOpen && selectedCls && (
        <TutorChatMode
          cls={selectedCls}
          onClose={() => setTutorOpen(false)}
        />
      )}
    </>
  );
}
