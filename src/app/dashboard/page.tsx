"use client";

import { useState } from "react";
import {
  AnalysisMode,
  AssignmentAnalysis,
  CourseInfo,
  DeadlineItem,
  ItemType,
  StudyWeek,
} from "@/lib/types";
import { usePro, FREE_LIMIT } from "@/lib/usePro";
import DashboardNav from "@/components/dashboard/DashboardNav";
import DeadlineCard from "@/components/dashboard/DeadlineCard";
import StudyWeekCard from "@/components/dashboard/StudyWeekCard";
import AssignmentResultView from "@/components/dashboard/AssignmentResultView";
import UpgradeModal, { LockedFeatureCard } from "@/components/dashboard/UpgradeModal";

// ─── Sample content ────────────────────────────────────────────────────────────

const SAMPLE_SYLLABUS = `CS 101 — Introduction to Computer Science
Instructor: Dr. Sarah Chen  |  Fall 2025  |  MWF 10:00–11:00 AM

ASSIGNMENTS
- Homework 1 (Variables & Data Types): Due Sep 19 — 50 pts
- Homework 2 (Control Structures): Due Oct 3 — 50 pts
- Homework 3 (Data Structures): Due Nov 7 — 75 pts

QUIZZES
- Quiz 1 (Intro to Programming): Sep 26 — 20 pts
- Quiz 2 (Functions & Loops): Oct 10 — 20 pts
- Quiz 3 (OOP Concepts): Nov 21 — 20 pts

EXAMS
- Midterm Exam: Oct 17 — 100 pts
- Final Exam: Dec 15 — 150 pts

PROJECTS
- Final Project Part 1 — Proposal: Nov 14 — 50 pts
- Final Project — Full Implementation: Dec 5 — 150 pts`;

const SAMPLE_ASSIGNMENT = `Research Paper — The Impact of Artificial Intelligence on Modern Healthcare
Due: November 15, 2025 | 150 points

Assignment Overview:
Write a 10–12 page research paper examining how artificial intelligence is transforming healthcare delivery, diagnosis, and patient outcomes. You must engage with current peer-reviewed literature and present a critical, well-supported argument — not a descriptive summary.

Requirements:
- 10–12 pages, double-spaced, 12pt Times New Roman, 1" margins
- Minimum 8 peer-reviewed sources, APA format
- Abstract (150–200 words)
- Works Cited page (not counted in page limit)
- Submit as PDF to the course portal by 11:59 PM

Rubric:
- Thesis clarity and argumentation: 25 pts
- Research quality and source integration: 25 pts
- Critical analysis and original thinking: 20 pts
- Organization and structure: 15 pts
- Writing mechanics: 10 pts
- APA formatting: 5 pts`;

// ─── Config ────────────────────────────────────────────────────────────────────

const typeOrder: ItemType[] = ["assignment", "quiz", "exam", "project"];

const groupConfig: Record<ItemType, { title: string }> = {
  assignment: { title: "Assignments" },
  quiz: { title: "Quizzes" },
  exam: { title: "Exams" },
  project: { title: "Projects" },
};

// ─── Mode Toggle ───────────────────────────────────────────────────────────────

function ModeToggle({
  mode,
  onChange,
}: {
  mode: AnalysisMode;
  onChange: (m: AnalysisMode) => void;
}) {
  return (
    <div className="inline-flex rounded-xl border border-gray-200 bg-gray-100 p-1">
      {(["syllabus", "assignment"] as AnalysisMode[]).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={`relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
            mode === m
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {m === "syllabus" ? (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
          )}
          {m === "syllabus" ? "Syllabus" : "Assignment"}
        </button>
      ))}
    </div>
  );
}

// ─── Input Card ────────────────────────────────────────────────────────────────

function InputCard({
  mode,
  text,
  onChange,
  onAnalyze,
  onLoadSample,
  analyzing,
  error,
  canAnalyze,
  remainingFree,
  isPro,
  onUpgradeClick,
}: {
  mode: AnalysisMode;
  text: string;
  onChange: (v: string) => void;
  onAnalyze: () => void;
  onLoadSample: () => void;
  analyzing: boolean;
  error: string | null;
  canAnalyze: boolean;
  remainingFree: number;
  isPro: boolean;
  onUpgradeClick: () => void;
}) {
  const isSyllabus = mode === "syllabus";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          isSyllabus
            ? "Paste your course syllabus here..."
            : "Paste your assignment prompt, rubric, or instructions here..."
        }
        rows={10}
        className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm leading-relaxed text-gray-700 placeholder-gray-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
      />

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        {/* File upload (UI only) */}
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors whitespace-nowrap">
          <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
          </svg>
          Upload file
          <input type="file" className="hidden" accept=".pdf,.doc,.docx,.txt" />
        </label>

        {canAnalyze ? (
          <button
            onClick={onAnalyze}
            disabled={!text.trim() || analyzing}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 transition-all"
          >
            {analyzing ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyzing...
              </>
            ) : (
              `Analyze ${isSyllabus ? "Syllabus" : "Assignment"}`
            )}
          </button>
        ) : (
          <button
            onClick={onUpgradeClick}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-all"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            Unlock Unlimited Analyses
          </button>
        )}
      </div>

      {/* Usage indicator for free users */}
      {!isPro && (
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            No {isSyllabus ? "syllabus" : "assignment"} on hand?{" "}
            <button
              onClick={onLoadSample}
              className="font-medium text-indigo-500 hover:text-indigo-600 underline underline-offset-2 transition-colors"
            >
              Load a sample
            </button>
          </p>
          {canAnalyze ? (
            <span className="text-xs text-gray-400">
              {remainingFree} of {FREE_LIMIT} free analyses left ·{" "}
              <button
                onClick={onUpgradeClick}
                className="font-medium text-indigo-500 hover:text-indigo-600 transition-colors"
              >
                Upgrade for unlimited
              </button>
            </span>
          ) : (
            <span className="text-xs font-medium text-amber-600">
              Free limit reached
            </span>
          )}
        </div>
      )}

      {isPro && (
        <p className="mt-4 text-center text-xs text-gray-400">
          No {isSyllabus ? "syllabus" : "assignment"} on hand?{" "}
          <button
            onClick={onLoadSample}
            className="font-medium text-indigo-500 hover:text-indigo-600 underline underline-offset-2 transition-colors"
          >
            Load a sample {isSyllabus ? "syllabus" : "assignment"}
          </button>
        </p>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { isPro, upgradeToPro, canAnalyze, remainingFree, recordAnalysis } = usePro();
  const [showModal, setShowModal] = useState(false);

  const [mode, setMode] = useState<AnalysisMode>("syllabus");

  // Syllabus mode state
  const [syllabusText, setSyllabusText] = useState("");
  const [syllabusAnalyzed, setSyllabusAnalyzed] = useState(false);
  const [syllabusAnalyzing, setSyllabusAnalyzing] = useState(false);
  const [courseInfo, setCourseInfo] = useState<CourseInfo | null>(null);
  const [items, setItems] = useState<DeadlineItem[]>([]);
  const [studyPlan, setStudyPlan] = useState<StudyWeek[]>([]);
  const [syllabusIsMock, setSyllabusIsMock] = useState(false);
  const [syllabusError, setSyllabusError] = useState<string | null>(null);

  // Assignment mode state
  const [assignmentText, setAssignmentText] = useState("");
  const [assignmentAnalyzed, setAssignmentAnalyzed] = useState(false);
  const [assignmentAnalyzing, setAssignmentAnalyzing] = useState(false);
  const [assignmentResult, setAssignmentResult] = useState<AssignmentAnalysis | null>(null);
  const [assignmentIsMock, setAssignmentIsMock] = useState(false);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);

  // ── Syllabus handlers ──

  async function handleSyllabusAnalyze() {
    if (!syllabusText.trim() || !canAnalyze) return;
    setSyllabusAnalyzing(true);
    setSyllabusError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: syllabusText, mode: "syllabus" }),
      });

      const json = await res.json();

      if (!res.ok) {
        setSyllabusError(json.error ?? "Something went wrong. Please try again.");
        return;
      }

      const { data, mock } = json;
      setCourseInfo(data.course);
      setItems(data.items.map((item: DeadlineItem) => ({ ...item, completed: false })));
      setStudyPlan(
        data.studyPlan.map((week: StudyWeek) => ({
          ...week,
          tasks: week.tasks.map((task: StudyWeek["tasks"][number]) => ({ ...task, completed: false })),
        }))
      );
      setSyllabusIsMock(mock);
      setSyllabusAnalyzed(true);
      recordAnalysis();
    } catch {
      setSyllabusError("Network error. Please check your connection and try again.");
    } finally {
      setSyllabusAnalyzing(false);
    }
  }

  function handleSyllabusReset() {
    setSyllabusAnalyzed(false);
    setSyllabusText("");
    setCourseInfo(null);
    setItems([]);
    setStudyPlan([]);
    setSyllabusIsMock(false);
    setSyllabusError(null);
  }

  function toggleItem(id: string) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  }

  function toggleTask(weekId: string, taskId: string) {
    setStudyPlan((prev) =>
      prev.map((week) =>
        week.id === weekId
          ? {
              ...week,
              tasks: week.tasks.map((task) =>
                task.id === taskId ? { ...task, completed: !task.completed } : task
              ),
            }
          : week
      )
    );
  }

  // ── Assignment handlers ──

  async function handleAssignmentAnalyze() {
    if (!assignmentText.trim() || !canAnalyze) return;
    setAssignmentAnalyzing(true);
    setAssignmentError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: assignmentText, mode: "assignment" }),
      });

      const json = await res.json();

      if (!res.ok) {
        setAssignmentError(json.error ?? "Something went wrong. Please try again.");
        return;
      }

      setAssignmentResult(json.data);
      setAssignmentIsMock(json.mock);
      setAssignmentAnalyzed(true);
      recordAnalysis();
    } catch {
      setAssignmentError("Network error. Please check your connection and try again.");
    } finally {
      setAssignmentAnalyzing(false);
    }
  }

  function handleAssignmentReset() {
    setAssignmentAnalyzed(false);
    setAssignmentText("");
    setAssignmentResult(null);
    setAssignmentIsMock(false);
    setAssignmentError(null);
  }

  // ── Derived values ──

  const grouped = items.reduce<Partial<Record<ItemType, DeadlineItem[]>>>((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type]!.push(item);
    return acc;
  }, {});

  const completedCount = items.filter((i) => i.completed).length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;
  const completedTaskCount = studyPlan.flatMap((w) => w.tasks).filter((t) => t.completed).length;
  const totalTaskCount = studyPlan.flatMap((w) => w.tasks).length;

  // ── Render ──

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <DashboardNav
          isPro={isPro}
          onUpgradeClick={() => setShowModal(true)}
        />

        <main className="flex-1 mx-auto w-full max-w-5xl px-6 py-12">
          {/* Mode toggle */}
          <div className="mb-8 flex flex-col items-center gap-2 text-center">
            <ModeToggle mode={mode} onChange={setMode} />
            <p className="text-xs text-gray-400">
              {mode === "syllabus"
                ? "Extract deadlines and build a study plan from your full syllabus"
                : "Decode a single assignment prompt or rubric into a clear action plan"}
            </p>
          </div>

          {/* ── Syllabus Mode ── */}
          {mode === "syllabus" && (
            <>
              {!syllabusAnalyzed ? (
                <div className="mx-auto max-w-2xl">
                  <div className="mb-6 text-center">
                    <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
                      Analyze your syllabus
                    </h1>
                    <p className="mt-2 text-sm text-gray-500">
                      Paste your course syllabus and we&apos;ll extract every deadline
                      and build a personalized weekly study plan.
                    </p>
                  </div>
                  <InputCard
                    mode="syllabus"
                    text={syllabusText}
                    onChange={setSyllabusText}
                    onAnalyze={handleSyllabusAnalyze}
                    onLoadSample={() => setSyllabusText(SAMPLE_SYLLABUS)}
                    analyzing={syllabusAnalyzing}
                    error={syllabusError}
                    canAnalyze={canAnalyze}
                    remainingFree={remainingFree}
                    isPro={isPro}
                    onUpgradeClick={() => setShowModal(true)}
                  />
                </div>
              ) : (
                <>
                  {syllabusIsMock && (
                    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      <span className="font-semibold">Demo mode —</span> No{" "}
                      <code className="rounded bg-amber-100 px-1 font-mono text-xs">ANTHROPIC_API_KEY</code>{" "}
                      detected. Showing sample data.
                    </div>
                  )}

                  {/* Course header */}
                  {courseInfo && (
                    <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100">
                              {courseInfo.code}
                            </span>
                            <span className="text-xs text-gray-400">{courseInfo.semester}</span>
                            {courseInfo.credits > 0 && (
                              <>
                                <span className="text-xs text-gray-300">·</span>
                                <span className="text-xs text-gray-400">{courseInfo.credits} credits</span>
                              </>
                            )}
                          </div>
                          <h1 className="text-xl font-bold text-gray-900">{courseInfo.name}</h1>
                          {courseInfo.instructor && (
                            <p className="mt-1 text-sm text-gray-500">{courseInfo.instructor}</p>
                          )}
                          {courseInfo.schedule && (
                            <p className="mt-0.5 text-xs text-gray-400">{courseInfo.schedule}</p>
                          )}
                        </div>

                        <div className="flex shrink-0 gap-6 sm:text-right">
                          <div>
                            <div className="text-2xl font-bold text-gray-900">
                              {completedCount}
                              <span className="text-base font-normal text-gray-400">/{items.length}</span>
                            </div>
                            <div className="text-xs text-gray-400">deadlines done</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-gray-900">
                              {completedTaskCount}
                              <span className="text-base font-normal text-gray-400">/{totalTaskCount}</span>
                            </div>
                            <div className="text-xs text-gray-400">tasks done</div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5">
                        <div className="mb-1.5 flex items-center justify-between text-xs text-gray-400">
                          <span>Overall progress</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-gray-100">
                          <div
                            className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={handleSyllabusReset}
                          className="text-xs font-medium text-gray-400 hover:text-indigo-500 transition-colors"
                        >
                          Analyze another syllabus →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Deadlines */}
                  {items.length > 0 && (
                    <section className="mb-10">
                      <h2 className="mb-5 text-lg font-bold text-gray-900">Deadlines</h2>
                      <div className="space-y-8">
                        {typeOrder.map((type) => {
                          const typeItems = grouped[type];
                          if (!typeItems || typeItems.length === 0) return null;
                          const doneCount = typeItems.filter((i) => i.completed).length;

                          return (
                            <div key={type}>
                              <div className="mb-3 flex items-center gap-2">
                                <h3 className="text-sm font-semibold text-gray-700">
                                  {groupConfig[type].title}
                                </h3>
                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">
                                  {doneCount}/{typeItems.length}
                                </span>
                              </div>
                              <div className="grid gap-3 sm:grid-cols-2">
                                {typeItems.map((item) => (
                                  <DeadlineCard key={item.id} item={item} onToggle={toggleItem} />
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  )}

                  {/* Study Plan — Pro gated */}
                  <section className="mb-10">
                    <div className="mb-5 flex items-center justify-between">
                      <h2 className="text-lg font-bold text-gray-900">Study Plan</h2>
                      {isPro && studyPlan.length > 0 && (
                        <span className="text-xs text-gray-400">
                          {totalTaskCount} tasks across {studyPlan.length} weeks
                        </span>
                      )}
                    </div>

                    {isPro ? (
                      <div className="space-y-4">
                        {studyPlan.map((week) => (
                          <StudyWeekCard key={week.id} week={week} onToggleTask={toggleTask} />
                        ))}
                      </div>
                    ) : (
                      <LockedFeatureCard
                        title="Study Plan"
                        description="Get a personalized week-by-week schedule built around your exact deadlines."
                        onUpgrade={() => setShowModal(true)}
                        preview={
                          studyPlan.length > 0 ? (
                            <div className="overflow-hidden rounded-xl border border-gray-200">
                              <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-5 py-3">
                                <span className="text-sm font-semibold text-gray-700">
                                  {studyPlan[0]?.weekLabel}
                                </span>
                                <span className="text-xs text-gray-400">
                                  0/{studyPlan[0]?.tasks.length} done
                                </span>
                              </div>
                              {studyPlan[0]?.tasks.slice(0, 2).map((task) => (
                                <div key={task.id} className="flex items-start gap-3 border-b border-gray-50 px-5 py-3">
                                  <div className="mt-0.5 h-5 w-5 shrink-0 rounded border-2 border-gray-200" />
                                  <div>
                                    <div className="mb-1 h-3 w-32 rounded-full bg-gray-200" />
                                    <div className="h-3 w-48 rounded-full bg-gray-100" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : undefined
                        }
                      />
                    )}
                  </section>

                  {/* Multiple courses — Pro teaser */}
                  {!isPro && (
                    <div className="rounded-xl border border-dashed border-gray-200 bg-white p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50">
                            <svg
                              className="h-4 w-4 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={1.8}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-semibold text-gray-700">Track multiple courses</p>
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                                ⚡ Pro
                              </span>
                            </div>
                            <p className="text-xs text-gray-400">
                              Add all your classes and manage every deadline in one place.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowModal(true)}
                          className="shrink-0 rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          Unlock
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* ── Assignment Mode ── */}
          {mode === "assignment" && (
            <>
              {!assignmentAnalyzed ? (
                <div className="mx-auto max-w-2xl">
                  <div className="mb-6 text-center">
                    <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
                      Decode your assignment
                    </h1>
                    <p className="mt-2 text-sm text-gray-500">
                      Paste the prompt, rubric, or instructions and we&apos;ll break it
                      down into a clear, actionable plan.
                    </p>
                  </div>
                  <InputCard
                    mode="assignment"
                    text={assignmentText}
                    onChange={setAssignmentText}
                    onAnalyze={handleAssignmentAnalyze}
                    onLoadSample={() => setAssignmentText(SAMPLE_ASSIGNMENT)}
                    analyzing={assignmentAnalyzing}
                    error={assignmentError}
                    canAnalyze={canAnalyze}
                    remainingFree={remainingFree}
                    isPro={isPro}
                    onUpgradeClick={() => setShowModal(true)}
                  />
                </div>
              ) : (
                assignmentResult && (
                  <AssignmentResultView
                    result={assignmentResult}
                    isMock={assignmentIsMock}
                    isPro={isPro}
                    onReset={handleAssignmentReset}
                    onUpgrade={() => setShowModal(true)}
                  />
                )
              )}
            </>
          )}
        </main>
      </div>

      {/* Upgrade modal — rendered outside the layout so it overlays everything */}
      <UpgradeModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onUpgrade={upgradeToPro}
      />
    </>
  );
}
