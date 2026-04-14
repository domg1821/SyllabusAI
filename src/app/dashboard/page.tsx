"use client";

import React, { useState } from "react";
import {
  AnalysisMode,
  AssignmentAnalysis,
  CourseInfo,
  DeadlineItem,
  DashboardTab,
  ItemType,
  StudyWeek,
} from "@/lib/types";
import { usePro, FREE_LIMIT } from "@/lib/usePro";
import DashboardNav from "@/components/dashboard/DashboardNav";
import DeadlineCard from "@/components/dashboard/DeadlineCard";
import StudyWeekCard from "@/components/dashboard/StudyWeekCard";
import AssignmentResultView from "@/components/dashboard/AssignmentResultView";
import UpgradeModal, { LockedFeatureCard } from "@/components/dashboard/UpgradeModal";
import PracticeTestMode from "@/components/dashboard/PracticeTestMode";

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

const TAB_CONFIG: {
  value: DashboardTab;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "syllabus",
    label: "Syllabus",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    ),
  },
  {
    value: "assignment",
    label: "Assignment",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
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
];

function ModeToggle({
  tab,
  onChange,
}: {
  tab: DashboardTab;
  onChange: (t: DashboardTab) => void;
}) {
  return (
    <div className="inline-flex rounded-xl border border-gray-200 bg-gray-100 p-1">
      {TAB_CONFIG.map(({ value, label, icon }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={`relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
            tab === value
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {icon}
          {label}
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
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  async function extractPdfText(file: File) {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();

    const data = new Uint8Array(await file.arrayBuffer());
    const document = await pdfjs.getDocument({ data }).promise;
    const pages = await Promise.all(
      Array.from({ length: document.numPages }, async (_, index) => {
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

    console.log("Extracted PDF text length:", extractedText.length);

    return extractedText;
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    setFileError(null);
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
        const extractedText = await extractPdfText(file);

        if (!extractedText.trim()) {
          setFileError("No readable text was found in that PDF. Please paste the text directly.");
          setFileName(null);
        } else {
          onChange(extractedText);
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

      {/* File feedback */}
      {fileLoaded && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
          <svg className="h-4 w-4 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          <span className="flex-1 truncate text-xs font-medium text-emerald-700">{fileName}</span>
          <button
            onClick={() => { setFileName(null); onChange(""); }}
            className="shrink-0 text-emerald-500 hover:text-emerald-700 transition-colors"
            aria-label="Remove file"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
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
  const [checkoutBanner, setCheckoutBanner] = useState<"success" | "cancel" | null>(null);

  // Handle Stripe return — runs once on mount, reads URL params client-side
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");
    const sessionId = params.get("session_id");

    if (!checkout) return;

    // Clean the URL immediately so refreshing doesn't retrigger
    window.history.replaceState({}, "", "/dashboard");

    if (checkout === "cancel") {
      setCheckoutBanner("cancel");
      return;
    }

    if (checkout === "success" && sessionId) {
      fetch(`/api/checkout/verify?session_id=${encodeURIComponent(sessionId)}`)
        .then((r) => r.json())
        .then(({ paid }: { paid: boolean }) => {
          if (paid) {
            upgradeToPro();
            setCheckoutBanner("success");
          }
        })
        .catch(() => {
          // Verification failed — do not auto-upgrade; show neutral banner
          setCheckoutBanner("success");
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [tab, setTab] = useState<DashboardTab>("syllabus");

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
        setSyllabusError(
          json.error ??
            "The syllabus text was loaded, but analysis failed. Try a shorter section or re-upload."
        );
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
      setSyllabusError("The syllabus text was loaded, but analysis failed. Try a shorter section or re-upload.");
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

          {/* Mode toggle */}
          <div className="mb-8 flex flex-col items-center gap-2 text-center">
            <ModeToggle tab={tab} onChange={setTab} />
            <p className="text-xs text-gray-400">
              {tab === "syllabus"
                ? "Extract deadlines and build a study plan from your full syllabus"
                : tab === "assignment"
                  ? "Decode a single assignment prompt or rubric into a clear action plan"
                  : "Generate a custom practice exam and test your knowledge"}
            </p>
          </div>

          {/* ── Syllabus Mode ── */}
          {tab === "syllabus" && (
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
          {tab === "assignment" && (
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

          {/* ── Practice Test Mode ── */}
          {tab === "practice" && (
            <PracticeTestMode
              isPro={isPro}
              onUpgradeClick={() => setShowModal(true)}
            />
          )}
        </main>
      </div>

      {/* Upgrade modal — rendered outside the layout so it overlays everything */}
      <UpgradeModal
        open={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
