"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useRef } from "react";
import {
  AnalysisMode,
  AssignmentAnalysis,
  CourseInfo,
  DeadlineItem,
  DashboardTab,
  GradeEntry,
  ItemType,
  SavedClass,
  StudyWeek,
  SubmissionStatus,
  WeeklyTopic,
} from "@/lib/types";
import { usePro, FREE_LIMIT } from "@/lib/usePro";
import { useClasses } from "@/lib/useClasses";
import DashboardNav from "@/components/dashboard/DashboardNav";
import DeadlineCard from "@/components/dashboard/DeadlineCard";
import StudyWeekCard from "@/components/dashboard/StudyWeekCard";
import AssignmentResultView from "@/components/dashboard/AssignmentResultView";
import UpgradeModal, { LockedFeatureCard } from "@/components/dashboard/UpgradeModal";
import PracticeTestMode from "@/components/dashboard/PracticeTestMode";
import CoursesDashboard from "@/components/dashboard/CoursesDashboard";
import OnboardingModal from "@/components/dashboard/OnboardingModal";
import ThisWeekView from "@/components/dashboard/ThisWeekView";
import GradeTracker from "@/components/dashboard/GradeTracker";
import CalendarView from "@/components/dashboard/CalendarView";
import FlashcardMode from "@/components/dashboard/FlashcardMode";
import CramMode from "@/components/dashboard/CramMode";
import ExplainerPanel from "@/components/dashboard/ExplainerPanel";
import StudyHub from "@/components/dashboard/StudyHub";
import { getWeeklyStudyMinutes } from "@/lib/useStudySessions";

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

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function CoursesLoadingSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-7 w-32 rounded-lg bg-gray-200" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-16 rounded-xl bg-gray-100" />
      ))}
    </div>
  );
}

function EmptyCoursesCard({ onAnalyze }: { onAnalyze: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 py-16 px-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-3xl">
        📚
      </div>
      <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">No courses yet</h2>
      <p className="mt-2 max-w-xs text-sm text-gray-500 dark:text-slate-400">
        Analyze your first syllabus to extract every deadline and build a personalized study plan.
      </p>
      <button
        onClick={onAnalyze}
        className="mt-6 flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 active:scale-[0.99] transition-all"
      >
        Analyze My First Syllabus →
      </button>
    </div>
  );
}

// ─── Mode Toggle ───────────────────────────────────────────────────────────────

const TAB_CONFIG: {
  value: DashboardTab;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "week",
    label: "This Week",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
      </svg>
    ),
  },
  {
    value: "courses",
    label: "My Courses",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
  {
    value: "analyze",
    label: "Analyze",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
      </svg>
    ),
  },
  {
    value: "practice",
    label: "Practice Test",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
  {
    value: "study",
    label: "Study",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.627 48.627 0 0 1 12 20.904a48.627 48.627 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
      </svg>
    ),
  },
];

function ModeToggle({
  tab,
  onChange,
}: {
  tab: DashboardTab;
  onChange: (t: DashboardTab) => void;
}) {
  return (
    <div className="relative w-full max-w-2xl">
      {/* overflow-x-auto for mobile; scrollbar hidden via inline style */}
      <div className="overflow-x-auto" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        <div className="inline-flex gap-1 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 p-1 min-w-max">
          {TAB_CONFIG.map(({ value, label, icon }) => (
            <button
              key={value}
              onClick={() => onChange(value)}
              className={`relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                tab === value
                  ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 shadow-sm"
                  : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
              }`}
            >
              {icon}
              <span className="hidden md:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>
      {/* Fade hint for overflow on small screens */}
      <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-gray-50 dark:from-slate-900 to-transparent" />
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
  proLoading,
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
  proLoading: boolean;
  onUpgradeClick: () => void;
}) {
  const isSyllabus = mode === "syllabus";
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [pdfTruncated, setPdfTruncated] = useState(false);

  const MAX_PDF_PAGES = 20;

  async function extractPdfText(file: File): Promise<{ text: string; truncated: boolean }> {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();

    const data = new Uint8Array(await file.arrayBuffer());
    const document = await pdfjs.getDocument({ data }).promise;
    const totalPages = document.numPages;
    const pagesToProcess = Math.min(totalPages, MAX_PDF_PAGES);
    const pages = await Promise.all(
      Array.from({ length: pagesToProcess }, async (_, index) => {
        const page = await document.getPage(index + 1);
        const content = await page.getTextContent();
        const lines: { y: number; parts: string[] }[] = [];

        for (const item of content.items) {
          if (!("str" in item)) continue;

          const value = item.str.replace(/\s+/g, " ").trim();
          if (!value) continue;

          const y = typeof item.transform?.[5] === "number" ? item.transform[5] : 0;
          const existingLine = lines.find((line) => Math.abs(line.y - y) < 2);

          if (existingLine) {
            existingLine.parts.push(value);
          } else {
            lines.push({ y, parts: [value] });
          }

        }

        return lines
          .sort((a, b) => b.y - a.y)
          .map((line) => line.parts.join(" ").replace(/\s+/g, " ").trim())
          .filter((line) => line && !/^page\s+\d+\s+of\s+\d+$/i.test(line))
          .join("\n");
      })
    );

    const extractedText = pages
      .filter(Boolean)
      .join("\n\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+\n/g, "\n")
      .trim();

    return { text: extractedText, truncated: totalPages > MAX_PDF_PAGES };
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    setFileError(null);
    setPdfTruncated(false);
    setFileName(file.name);

    if (ext === "txt") {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === "string") {
          onChange(result);
        }
      };
      reader.onerror = () => {
        setFileError("Could not read the file. Please try again or paste the text directly.");
        setFileName(null);
      };
      reader.readAsText(file);
    } else if (ext === "pdf") {
      try {
        const { text: extractedText, truncated } = await extractPdfText(file);

        if (!extractedText.trim()) {
          setFileError("No readable text was found in that PDF. Please paste the text directly.");
          setFileName(null);
        } else {
          onChange(extractedText);
          setPdfTruncated(truncated);
        }
      } catch {
        setFileError("Could not read the PDF. Please try again or paste the text directly.");
        setFileName(null);
      }
    } else if (ext === "doc" || ext === "docx") {
      setFileError("Word documents can't be parsed automatically. Please copy and paste the text directly.");
      setFileName(null);
    } else {
      setFileError("Unsupported file type. Please upload a .txt file or paste your text.");
      setFileName(null);
    }

    // Reset input so the same file can be re-selected
    e.target.value = "";
  }

  const fileLoaded = fileName !== null && fileError === null;

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
      <textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          isSyllabus
            ? "Paste your course syllabus here..."
            : "Paste your assignment prompt, rubric, or instructions here..."
        }
        rows={10}
        className="w-full resize-none rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 p-4 text-sm leading-relaxed text-gray-700 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 transition-all"
      />

      {/* File feedback */}
      {fileLoaded && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
          <svg className="h-4 w-4 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          <span className="flex-1 truncate text-xs font-medium text-emerald-700">{fileName}</span>
          <button
            onClick={() => { setFileName(null); setPdfTruncated(false); onChange(""); }}
            className="shrink-0 text-emerald-500 hover:text-emerald-700 transition-colors"
            aria-label="Remove file"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      {pdfTruncated && (
        <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          <span className="text-xs text-amber-800">
            Your PDF has more than {MAX_PDF_PAGES} pages — only the first {MAX_PDF_PAGES} were imported. If key deadlines are missing, paste the full text manually.
          </span>
        </div>
      )}
      {fileError && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          <span className="text-xs text-amber-800">{fileError}</span>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        {/* File upload */}
        <label className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
          fileLoaded
            ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            : "border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
        }`}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
          </svg>
          {fileLoaded ? "Change file" : "Upload file"}
          <input type="file" className="hidden" accept=".txt,.pdf,.doc,.docx" onChange={handleFileChange} />
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

      {/* Usage indicator for free users — hidden while Pro status is resolving */}
      {!isPro && !proLoading && (
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

      {(isPro || proLoading) && (
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
  const { isPro, proLoading, activatePro, refreshPro, canAnalyze, remainingFree, recordAnalysis } = usePro();
  const {
    classes,
    loading: classesLoading,
    addClass,
    removeClass,
    toggleClassItem,
    toggleClassTask,
    updateItemStatus,
    setGrade,
    removeGrade,
  } = useClasses();

  const [showModal, setShowModal] = useState(false);
  const [checkoutBanner, setCheckoutBanner] = useState<"success" | "cancel" | null>(null);
  const [streak, setStreak] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try { return typeof window !== "undefined" && !localStorage.getItem("sai_onboarded"); }
    catch { return false; }
  });
  const [weeklyStudyMinutes, setWeeklyStudyMinutes] = useState(0);

  // Flashcard / cram / explainer overlays
  const [flashcardSession, setFlashcardSession] = useState<{
    groupName: string;
    cls: SavedClass;
  } | null>(null);
  const [cramSession, setCramSession] = useState<{
    item: DeadlineItem;
    cls: SavedClass;
  } | null>(null);
  const [explainerSession, setExplainerSession] = useState<{
    concept: string;
    cls: SavedClass;
  } | null>(null);

  // Calendar overlay
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Practice test pre-fill from Study Hub
  const [practiceInitialTopic, setPracticeInitialTopic] = useState<string | undefined>(undefined);

  // ── Toast notifications ──
  const [toasts, setToasts] = useState<{ id: string; message: string }[]>([]);
  function showToast(message: string) {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }

  // ── Study streak ──
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const lastActive = localStorage.getItem("sai_last_active");
    const stored = parseInt(localStorage.getItem("sai_streak") ?? "0", 10);
    if (lastActive === today) {
      setStreak(stored);
    } else if (lastActive) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const ystr = yesterday.toISOString().split("T")[0];
      const next = lastActive === ystr ? stored + 1 : 1;
      setStreak(next);
      localStorage.setItem("sai_streak", String(next));
    } else {
      setStreak(1);
      localStorage.setItem("sai_streak", "1");
    }
    localStorage.setItem("sai_last_active", today);
  }, []);

  // ── Weekly study minutes ──
  useEffect(() => {
    function refresh() { setWeeklyStudyMinutes(getWeeklyStudyMinutes()); }
    refresh();
    window.addEventListener("sai_session_saved", refresh);
    return () => window.removeEventListener("sai_session_saved", refresh);
  }, []);


  // Handle Stripe return — runs once on mount, reads URL params client-side
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");

    if (!checkout) return;

    // Clean the URL immediately so refreshing doesn't retrigger
    window.history.replaceState({}, "", "/dashboard");

    if (checkout === "cancel") {
      setCheckoutBanner("cancel");
      return;
    }

    if (checkout === "success") {
      setCheckoutBanner("success");
      // Verify the session with Stripe and activate Pro in Supabase.
      // This is the fast path — the webhook is the durable backup.
      const sessionId = params.get("session_id");
      if (sessionId) {
        fetch(`/api/checkout/verify?session_id=${encodeURIComponent(sessionId)}`)
          .then((r) => r.json())
          .then((json) => {
            if (json.paid) {
              // Immediately ungate — no DB round-trip needed, Stripe confirmed payment.
              // refreshPro() follows as a DB confirmation; on error it keeps the true value.
              activatePro();
              refreshPro();
            }
          })
          .catch(() => {
            // Silently ignore — user will see Pro status on next page load
            // once the Stripe webhook has fired.
          });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [tab, setTab] = useState<DashboardTab>("week");
  const [analyzeMode, setAnalyzeMode] = useState<"syllabus" | "assignment">("syllabus");

  // Syllabus mode state
  const [syllabusText, setSyllabusText] = useState("");
  const [syllabusAnalyzed, setSyllabusAnalyzed] = useState(false);
  const [syllabusAnalyzing, setSyllabusAnalyzing] = useState(false);
  const [courseInfo, setCourseInfo] = useState<CourseInfo | null>(null);
  const [items, setItems] = useState<DeadlineItem[]>([]);
  const [studyPlan, setStudyPlan] = useState<StudyWeek[]>([]);
  const [weeklyTopics, setWeeklyTopics] = useState<WeeklyTopic[] | undefined>(undefined);
  const [syllabusIsMock, setSyllabusIsMock] = useState(false);
  const [syllabusWasTruncated, setSyllabusWasTruncated] = useState(false);
  const [syllabusError, setSyllabusError] = useState<string | null>(null);
  const [savedClassId, setSavedClassId] = useState<string | null>(null);
  const [savedBannerName, setSavedBannerName] = useState<string | null>(null);
  const [saveBannerVisible, setSaveBannerVisible] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveBannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [localGrades, setLocalGrades] = useState<GradeEntry[]>([]);

  // Assignment mode state
  const [assignmentText, setAssignmentText] = useState("");
  const [assignmentAnalyzed, setAssignmentAnalyzed] = useState(false);
  const [assignmentAnalyzing, setAssignmentAnalyzing] = useState(false);
  const [assignmentResult, setAssignmentResult] = useState<AssignmentAnalysis | null>(null);
  const [assignmentIsMock, setAssignmentIsMock] = useState(false);
  const [assignmentWasTruncated, setAssignmentWasTruncated] = useState(false);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);

  // ── Syllabus handlers ──

  async function handleSyllabusAnalyze() {
    if (!syllabusText.trim() || !canAnalyze) return;
    setSyllabusAnalyzing(true);
    setSyllabusError(null);
    setSavedClassId(null);
    setSaveBannerVisible(false);
    setLocalGrades([]);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: syllabusText, mode: "syllabus" }),
      });

      const responseText = await res.text();
      let json: ReturnType<typeof JSON.parse>;
      try {
        json = JSON.parse(responseText);
      } catch {
        throw new Error(responseText || `Server error (${res.status})`);
      }

      if (res.status === 401) {
        setSyllabusError("Session expired. Please sign in again.");
        return;
      }
      if (res.status === 403) {
        setShowModal(true);
        return;
      }
      if (!res.ok) {
        setSyllabusError(
          json.error ??
            "The syllabus text was loaded, but analysis failed. Try a shorter section or re-upload."
        );
        return;
      }

      const { data, mock, truncated } = json;

      // Pre-compute mapped values so they can be passed directly to addClass
      // without waiting for React state to flush.
      const mappedItems: DeadlineItem[] = data.items.map((item: DeadlineItem) => ({ ...item, completed: false }));
      const mappedPlan: StudyWeek[] = data.studyPlan.map((week: StudyWeek) => ({
        ...week,
        tasks: week.tasks.map((task: StudyWeek["tasks"][number]) => ({ ...task, completed: false })),
      }));
      const parsedTopics: WeeklyTopic[] | undefined =
        Array.isArray(data.weeklyTopics) && data.weeklyTopics.length > 0
          ? data.weeklyTopics
          : undefined;

      setCourseInfo(data.course);
      setItems(mappedItems);
      setStudyPlan(mappedPlan);
      setWeeklyTopics(parsedTopics);
      setSyllabusIsMock(mock);
      setSyllabusWasTruncated(truncated ?? false);
      setSyllabusAnalyzed(true);
      recordAnalysis();

      // Auto-save real analyses so This Week / My Courses tabs update immediately.
      // Skip mock (demo) data — no value in persisting sample content.
      if (!mock) {
        const duplicate = classes.find(
          (c) =>
            (data.course.code && c.code === data.course.code) ||
            c.name.toLowerCase() === data.course.name.toLowerCase()
        );
        if (duplicate) {
          setSavedClassId(duplicate.id);
        } else {
          const id = addClass({
            name: data.course.name,
            code: data.course.code,
            courseInfo: data.course,
            items: mappedItems,
            studyPlan: mappedPlan,
            weeklyTopics: parsedTopics,
            grades: [],
            rawText: syllabusText,
          });
          setSavedClassId(id);
          setSavedBannerName(data.course.name);
        }
      }
    } catch (err) {
      setSyllabusError(err instanceof Error ? err.message : "Network error. Please check your connection and try again.");
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
    setWeeklyTopics(undefined);
    setSyllabusIsMock(false);
    setSyllabusWasTruncated(false);
    setSyllabusError(null);
    setSavedClassId(null);
    setSavedBannerName(null);
    setSaveBannerVisible(false);
    setSaveError(null);
    setLocalGrades([]);
  }

  // Cleanup banner timer on unmount
  useEffect(() => {
    return () => {
      if (saveBannerTimer.current) clearTimeout(saveBannerTimer.current);
    };
  }, []);

  function handleItemStatus(id: string, status: SubmissionStatus) {
    const isNowComplete = status === "submitted" || status === "graded";
    const wasComplete = items.find((i) => i.id === id)?.completed;
    if (isNowComplete && !wasComplete) showToast("Deadline marked complete");
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, status, completed: isNowComplete } : i
      )
    );
  }

  function handleClassItemStatus(classId: string, itemId: string, status: SubmissionStatus) {
    const cls = classes.find((c) => c.id === classId);
    const item = cls?.items.find((i) => i.id === itemId);
    const isNowComplete = status === "submitted" || status === "graded";
    if (isNowComplete && !item?.completed) showToast("Deadline marked complete");
    updateItemStatus(classId, itemId, status);
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

  function handleSaveClass() {
    if (!courseInfo) return;
    if (savedClassId) return; // Already saved — button shows "Saved"

    // Duplicate guard: same course code or exact name already in saved list
    const duplicate = classes.find(
      (c) =>
        (courseInfo.code && c.code === courseInfo.code) ||
        c.name.toLowerCase() === courseInfo.name.toLowerCase()
    );
    if (duplicate) {
      setSaveError("This course is already saved. View it in My Courses.");
      return;
    }

    setSaveError(null);
    const id = addClass({
      name: courseInfo.name,
      code: courseInfo.code,
      courseInfo,
      items,
      studyPlan,
      weeklyTopics,
      grades: localGrades,
    });
    setSavedClassId(id);
    showToast("Course saved to My Courses");
    setSaveBannerVisible(true);
    if (saveBannerTimer.current) clearTimeout(saveBannerTimer.current);
    saveBannerTimer.current = setTimeout(() => setSaveBannerVisible(false), 3000);
  }

  function handleLocalGrade(entry: GradeEntry) {
    showToast("Grade saved");
    setLocalGrades((prev) => {
      const existing = prev.find((g) => g.itemId === entry.itemId);
      return existing
        ? prev.map((g) => (g.itemId === entry.itemId ? entry : g))
        : [...prev, entry];
    });
    if (savedClassId) setGrade(savedClassId, entry);
  }

  function handleRemoveLocalGrade(itemId: string) {
    setLocalGrades((prev) => prev.filter((g) => g.itemId !== itemId));
    // Keep saved class in sync if already saved
    if (savedClassId) removeGrade(savedClassId, itemId);
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

      const responseText = await res.text();
      let json: ReturnType<typeof JSON.parse>;
      try {
        json = JSON.parse(responseText);
      } catch {
        throw new Error(responseText || `Server error (${res.status})`);
      }

      if (res.status === 401) {
        setAssignmentError("Session expired. Please sign in again.");
        return;
      }
      if (res.status === 403) {
        setShowModal(true);
        return;
      }
      if (!res.ok) {
        setAssignmentError(json.error ?? "Something went wrong. Please try again.");
        return;
      }

      setAssignmentResult(json.data);
      setAssignmentIsMock(json.mock);
      setAssignmentWasTruncated(json.truncated ?? false);
      setAssignmentAnalyzed(true);
      recordAnalysis();
    } catch (err) {
      setAssignmentError(err instanceof Error ? err.message : "Network error. Please check your connection and try again.");
    } finally {
      setAssignmentAnalyzing(false);
    }
  }

  function handleAssignmentReset() {
    setAssignmentAnalyzed(false);
    setAssignmentText("");
    setAssignmentResult(null);
    setAssignmentIsMock(false);
    setAssignmentWasTruncated(false);
    setAssignmentError(null);
  }

  // ── Class item / task toggle wrappers (fire toast on completion) ──

  function handleToggleClassItem(classId: string, itemId: string) {
    const cls = classes.find((c) => c.id === classId);
    const item = cls?.items.find((i) => i.id === itemId);
    if (item && !item.completed) showToast("Deadline marked complete");
    toggleClassItem(classId, itemId);
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

  // Stats bar
  const now = new Date();
  const dueThisWeek = classes.reduce((count, cls) =>
    count + cls.items.filter((item) => {
      if (item.completed) return false;
      const due = new Date(item.dueDate);
      if (isNaN(due.getTime())) return false;
      const days = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return days >= 0 && days <= 7;
    }).length, 0);
  const allGrades = classes.flatMap((cls) => cls.grades ?? []);
  const totalMax = allGrades.reduce((s, g) => s + g.max, 0);
  const avgGrade = totalMax > 0
    ? Math.round((allGrades.reduce((s, g) => s + g.earned, 0) / totalMax) * 100)
    : null;

  // ── Render ──

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col">
        <DashboardNav
          isPro={isPro}
          onUpgradeClick={() => setShowModal(true)}
          classes={classes}
          onOpenCalendar={classes.length > 0 ? () => setCalendarOpen(true) : undefined}
        />

        <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
          {/* Checkout banners */}
          {checkoutBanner === "success" && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
              <svg className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold text-emerald-800">
                  {isPro ? "You now have Pro access!" : "Payment received — activating your Pro account…"}
                </p>
                <p className="mt-0.5 text-xs text-emerald-700">
                  Thank you for upgrading. All Pro features are now unlocked.
                </p>
              </div>
              <button onClick={() => setCheckoutBanner(null)} className="shrink-0 text-emerald-500 hover:text-emerald-700 transition-colors">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          {checkoutBanner === "cancel" && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 px-5 py-4">
              <svg className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-700">Checkout was cancelled</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  No charge was made. You can upgrade anytime.
                </p>
              </div>
              <button onClick={() => setCheckoutBanner(null)} className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Stats bar */}
          {!classesLoading && (streak > 0 || classes.length > 0) && (
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              <div className="rounded-xl border border-orange-200 bg-orange-50 dark:border-slate-700 dark:bg-slate-800 dark:shadow-indigo-500/10 p-3 sm:p-4 text-center shadow-sm hover:shadow-md transition-shadow">
                <p className="text-xl sm:text-2xl font-bold text-orange-500">
                  {streak > 0 ? <span className="animate-flame">🔥</span> : "🔥"}{" "}{streak}
                </p>
                <p className="mt-0.5 text-xs text-orange-600 dark:text-slate-400">Day streak</p>
                {weeklyStudyMinutes >= 1 && (
                  <p className="mt-1 text-[10px] font-medium text-orange-400">
                    {weeklyStudyMinutes < 60
                      ? `${Math.round(weeklyStudyMinutes)}m studied`
                      : `${(weeklyStudyMinutes / 60).toFixed(1)}h studied`}{" "}
                    this week
                  </p>
                )}
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:shadow-indigo-500/10 p-3 sm:p-4 text-center shadow-sm hover:shadow-md transition-shadow">
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-slate-100">{classes.length}</p>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">Course{classes.length !== 1 ? "s" : ""}</p>
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:shadow-indigo-500/10 p-3 sm:p-4 text-center shadow-sm hover:shadow-md transition-shadow">
                <p className={`text-xl sm:text-2xl font-bold ${dueThisWeek > 0 ? "text-amber-500" : "text-gray-900 dark:text-slate-100"}`}>
                  {dueThisWeek}
                </p>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">Due this week</p>
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:shadow-indigo-500/10 p-3 sm:p-4 text-center shadow-sm hover:shadow-md transition-shadow">
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-slate-100">
                  {avgGrade !== null ? `${avgGrade}%` : "—"}
                </p>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">Avg grade</p>
              </div>
            </div>
          )}

          {/* Mode toggle */}
          <div className="mb-8 flex flex-col items-center gap-2">
            <ModeToggle tab={tab} onChange={setTab} />
            <p className="text-xs text-gray-400">
              {tab === "week"
                ? "Deadlines and study tasks across all your courses this week"
                : tab === "courses"
                  ? "All your saved courses in one place — deadlines, study plan, and grades"
                  : tab === "analyze"
                    ? analyzeMode === "syllabus"
                      ? "Extract deadlines and build a study plan from your full syllabus"
                      : "Decode a single assignment prompt or rubric into a clear action plan"
                    : tab === "practice"
                      ? "Generate a custom practice exam and test your knowledge"
                      : "Flashcards, practice tests, and exam cram — all in one place"}
            </p>
          </div>

          {/* Tab content wrapper — keyed so it remounts (and animates in) on tab change */}
          <div key={tab} className="animate-tab-fade-in">

          {/* ── This Week ── */}
          {tab === "week" && (
            classesLoading ? (
              <CoursesLoadingSkeleton />
            ) : classes.length === 0 ? (
              <EmptyCoursesCard onAnalyze={() => { setTab("analyze"); setAnalyzeMode("syllabus"); }} />
            ) : (
              <ThisWeekView
                classes={classes}
                onToggleItem={handleToggleClassItem}
                onToggleTask={toggleClassTask}
                onGoToCourses={() => setTab("courses")}
                onGoToPractice={() => setTab("practice")}
              />
            )
          )}

          {/* ── My Courses ── */}
          {tab === "courses" && (
            classesLoading ? (
              <CoursesLoadingSkeleton />
            ) : classes.length === 0 ? (
              <EmptyCoursesCard onAnalyze={() => { setTab("analyze"); setAnalyzeMode("syllabus"); }} />
            ) : (
            <CoursesDashboard
              classes={classes}
              isPro={isPro}
              onStatusChange={handleClassItemStatus}
              onToggleTask={toggleClassTask}
              onSetGrade={(classId, entry) => { setGrade(classId, entry); showToast("Grade saved"); }}
              onRemoveGrade={removeGrade}
              onDelete={removeClass}
              onUpgradeClick={() => setShowModal(true)}
              onAddNew={() => { setTab("analyze"); setAnalyzeMode("syllabus"); }}
              onGenerateFlashcards={(groupName, cls) => setFlashcardSession({ groupName, cls })}
              onStartCram={(item, cls) => setCramSession({ item, cls })}
            />
            )
          )}

          {/* ── Analyze Mode (Syllabus + Assignment) ── */}
          {tab === "analyze" && (
            <>
              {/* Inner sub-mode toggle — shown when not showing analyzed results */}
              {!(analyzeMode === "syllabus" && syllabusAnalyzed) && !(analyzeMode === "assignment" && assignmentAnalyzed) && (
                <div className="mx-auto max-w-2xl mb-6">
                  <div className="inline-flex rounded-xl border border-gray-200 bg-gray-100 p-1">
                    <button
                      onClick={() => setAnalyzeMode("syllabus")}
                      className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                        analyzeMode === "syllabus"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                      </svg>
                      Syllabus
                    </button>
                    <button
                      onClick={() => setAnalyzeMode("assignment")}
                      className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                        analyzeMode === "assignment"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                      </svg>
                      Assignment
                    </button>
                  </div>
                </div>
              )}

              {/* Syllabus sub-mode */}
              {analyzeMode === "syllabus" && (
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

                  {/* Onboarding flow hint */}
                  {classes.length === 0 && (
                    <div className="mb-5 flex items-center justify-center gap-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1 font-semibold text-indigo-600">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">1</span>
                        Analyze
                      </span>
                      <svg className="h-3 w-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                      </svg>
                      <span className="flex items-center gap-1">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-500">2</span>
                        Save course
                      </span>
                      <svg className="h-3 w-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                      </svg>
                      <span className="flex items-center gap-1">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-500">3</span>
                        Track your week
                      </span>
                    </div>
                  )}
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
                    proLoading={proLoading}
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
                  {syllabusWasTruncated && (
                    <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                      <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                      </svg>
                      <p className="text-sm text-amber-800">
                        <span className="font-semibold">Syllabus was trimmed —</span> your syllabus exceeded our limit, so the end was cut off before analysis. All deadlines found above are accurate, but content from later pages may be missing. If anything looks incomplete, paste just the relevant sections and re-analyze.
                      </p>
                    </div>
                  )}

                  {/* Auto-save confirmation banner */}
                  {savedBannerName && !syllabusIsMock && (
                    <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
                      <svg className="h-5 w-5 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                      <p className="flex-1 text-sm font-semibold text-emerald-800">
                        ✓ {savedBannerName} saved to My Courses
                      </p>
                      <button
                        onClick={() => setTab("courses")}
                        className="shrink-0 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                      >
                        View Course →
                      </button>
                      <button
                        onClick={() => setSavedBannerName(null)}
                        className="ml-1 shrink-0 text-emerald-500 hover:text-emerald-700 transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* Course header */}
                  {courseInfo && (
                    <div className="mb-8 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
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

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          {savedClassId ? (
                            <>
                              <span className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                </svg>
                                Saved
                              </span>
                              <button
                                onClick={() => setTab("courses")}
                                className="text-xs font-medium text-indigo-500 hover:text-indigo-600 transition-colors"
                              >
                                View in My Courses →
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={handleSaveClass}
                              className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                              </svg>
                              Save to My Courses
                            </button>
                          )}
                        </div>
                        <button
                          onClick={handleSyllabusReset}
                          className="text-xs font-medium text-gray-400 hover:text-indigo-500 transition-colors"
                        >
                          Analyze another syllabus →
                        </button>
                      </div>

                      {/* Save confirmation toast */}
                      {saveBannerVisible && (
                        <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                          <svg className="h-3.5 w-3.5 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                          Course saved! Deadlines, study plan, and grades are all stored in My Courses.
                        </div>
                      )}

                      {/* Duplicate warning */}
                      {saveError && (
                        <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                          <span>{saveError}</span>
                          <button
                            onClick={() => setTab("courses")}
                            className="shrink-0 font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                          >
                            View →
                          </button>
                        </div>
                      )}
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
                                  <DeadlineCard key={item.id} item={item} onStatusChange={handleItemStatus} />
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  )}

                  {/* Grade Tracker */}
                  <section className="mb-10">
                    <h2 className="mb-5 text-lg font-bold text-gray-900">Grade Tracker</h2>
                    <GradeTracker
                      items={items}
                      grades={localGrades}
                      onSetGrade={handleLocalGrade}
                      onRemoveGrade={handleRemoveLocalGrade}
                    />
                  </section>

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
                        {studyPlan.map((week) => {
                          const wn = week.weekLabel.match(/Week\s+(\d+)/i)?.[1];
                          const wt = wn ? weeklyTopics?.find((t) => t.week === parseInt(wn)) : undefined;
                          return (
                            <StudyWeekCard
                              key={week.id}
                              week={week}
                              onToggleTask={toggleTask}
                              weekTopic={wt?.topic}
                              weekChapters={wt?.chapters}
                            />
                          );
                        })}
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
                </>
              )}
              </>
              )}

              {/* Assignment sub-mode */}
              {analyzeMode === "assignment" && (
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
                    proLoading={proLoading}
                    onUpgradeClick={() => setShowModal(true)}
                  />
                </div>
              ) : (
                assignmentResult && (
                  <>
                    {assignmentWasTruncated && (
                      <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                        <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                        </svg>
                        <p className="text-sm text-amber-800">
                          <span className="font-semibold">Assignment was trimmed —</span> your text was very long, so the end was cut before analysis. The plan above may be incomplete. Try pasting just the rubric or key instructions for a more focused result.
                        </p>
                      </div>
                    )}
                    <AssignmentResultView
                      result={assignmentResult}
                      isMock={assignmentIsMock}
                      isPro={isPro}
                      onReset={handleAssignmentReset}
                      onUpgrade={() => setShowModal(true)}
                    />
                  </>
                )
              )}
              </>
              )}
            </>
          )}

          {/* ── Practice Test Mode ── */}
          {tab === "practice" && (
            <PracticeTestMode
              isPro={isPro}
              onUpgradeClick={() => setShowModal(true)}
              classes={classes}
              initialTopic={practiceInitialTopic}
            />
          )}

          {/* ── Study Hub ── */}
          {tab === "study" && (
            classesLoading ? (
              <CoursesLoadingSkeleton />
            ) : (
              <StudyHub
                classes={classes}
                onOpenPracticeTest={(topic) => {
                  setPracticeInitialTopic(topic);
                  setTab("practice");
                }}
                onOpenFlashcards={(groupName, cls) => setFlashcardSession({ groupName, cls })}
                onOpenExplainer={(concept, cls) => setExplainerSession({ concept, cls })}
                onOpenCram={(item, cls) => setCramSession({ item, cls })}
                onAddNew={() => { setTab("analyze"); setAnalyzeMode("syllabus"); }}
              />
            )
          )}

          </div> {/* end tab content wrapper */}
        </main>
      </div>

      {/* Upgrade modal — rendered outside the layout so it overlays everything */}
      <UpgradeModal
        open={showModal}
        onClose={() => setShowModal(false)}
      />

      <OnboardingModal
        open={showOnboarding}
        onDone={() => {
          localStorage.setItem("sai_onboarded", "true");
          setShowOnboarding(false);
          setTab("analyze");
        }}
      />

      {/* Flashcard overlay */}
      {flashcardSession && (
        <FlashcardMode
          chapterName={flashcardSession.groupName}
          courseName={flashcardSession.cls.name}
          courseContext={flashcardSession.cls.rawText?.slice(0, 1500)}
          onClose={() => setFlashcardSession(null)}
        />
      )}

      {/* Cram overlay */}
      {cramSession && (
        <CramMode
          exam={cramSession.item}
          courseName={cramSession.cls.name}
          courseContext={cramSession.cls.rawText?.slice(0, 1500)}
          onClose={() => setCramSession(null)}
        />
      )}

      {/* Explainer overlay */}
      {explainerSession && (
        <ExplainerPanel
          courseName={explainerSession.cls.name}
          courseContext={explainerSession.cls.rawText?.slice(0, 1500)}
          initialConcept={explainerSession.concept}
          onClose={() => setExplainerSession(null)}
        />
      )}

      {/* Calendar overlay */}
      {calendarOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm p-3 pt-4 sm:p-4 sm:pt-16 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl ring-1 ring-black/10 dark:ring-white/10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
              <h2 className="text-base font-bold text-gray-900 dark:text-slate-100">Deadline Calendar</h2>
              <button
                onClick={() => setCalendarOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <CalendarView
                classes={classes}
                onGoToAnalyze={() => { setCalendarOpen(false); setTab("analyze"); }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Toast notifications */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-800 shadow-lg"
          >
            <svg className="h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            {toast.message}
          </div>
        ))}
      </div>
    </>
  );
}
