"use client";

import React from "react";
import { AssignmentAnalysis } from "@/lib/types";
import { LockedFeatureCard, ProBadge } from "./UpgradeModal";

interface Props {
  result: AssignmentAnalysis;
  isMock: boolean;
  isPro: boolean;
  onReset: () => void;
  onUpgrade: () => void;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionCard({
  title,
  icon,
  badge,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-gray-400">{icon}</span>
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        {badge}
      </div>
      {children}
    </div>
  );
}

function BulletList({
  items,
  variant = "default",
}: {
  items: string[];
  variant?: "default" | "warning" | "numbered";
}) {
  if (items.length === 0)
    return <p className="text-sm text-gray-400">None specified.</p>;

  if (variant === "numbered") {
    return (
      <ol className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
              {i + 1}
            </span>
            <span className="text-sm leading-relaxed text-gray-700">{item}</span>
          </li>
        ))}
      </ol>
    );
  }

  if (variant === "warning") {
    return (
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <svg
              className="mt-0.5 h-4 w-4 shrink-0 text-amber-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
            <span className="text-sm leading-relaxed text-gray-700">{item}</span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
          <span className="text-sm leading-relaxed text-gray-700">{item}</span>
        </li>
      ))}
    </ul>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AssignmentResultView({
  result,
  isMock,
  isPro,
  onReset,
  onUpgrade,
}: Props) {
  return (
    <div className="space-y-5">
      {/* Demo mode banner */}
      {isMock && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span className="font-semibold">Demo mode —</span> No{" "}
          <code className="rounded bg-amber-100 px-1 font-mono text-xs">
            ANTHROPIC_API_KEY
          </code>{" "}
          detected. Showing sample data.
        </div>
      )}

      {/* Header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-indigo-500">
              Assignment Breakdown
            </p>
            <h1 className="text-xl font-bold text-gray-900">{result.title}</h1>
            {result.dueDate && (
              <div className="mt-2 flex items-center gap-1.5 text-sm text-gray-500">
                <svg
                  className="h-4 w-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                  />
                </svg>
                Due {result.dueDate}
              </div>
            )}
          </div>
          <button
            onClick={onReset}
            className="shrink-0 text-xs font-medium text-gray-400 hover:text-indigo-500 transition-colors"
          >
            Analyze another →
          </button>
        </div>
      </div>

      {/* What the professor wants */}
      <SectionCard
        title="What the professor wants"
        icon={
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
          </svg>
        }
      >
        <p className="text-sm leading-relaxed text-gray-700">{result.whatProfessorWants}</p>
      </SectionCard>

      {/* Step-by-step plan — Pro gated */}
      {isPro ? (
        <SectionCard
          title="Step-by-step plan"
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
          }
        >
          <BulletList items={result.stepByStepPlan} variant="numbered" />
        </SectionCard>
      ) : (
        <LockedFeatureCard
          title="Step-by-step plan"
          description="A clear, ordered plan to complete this assignment from start to finish."
          onUpgrade={onUpgrade}
          preview={
            <div className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-gray-300">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                  </svg>
                </span>
                <span className="text-sm font-semibold text-gray-400">Step-by-step plan</span>
              </div>
              <ol className="space-y-2">
                {[1, 2, 3].map((n) => (
                  <li key={n} className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-400">
                      {n}
                    </span>
                    <div className="h-3.5 w-48 rounded-full bg-gray-200" />
                  </li>
                ))}
              </ol>
            </div>
          }
        />
      )}

      {/* Deliverables + Structure grid */}
      <div className="grid gap-5 sm:grid-cols-2">
        <SectionCard
          title="Required deliverables"
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          }
        >
          <BulletList items={result.deliverables} />
        </SectionCard>

        {/* Suggested structure — Pro gated */}
        {isPro ? (
          <SectionCard
            title="Suggested structure"
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
              </svg>
            }
          >
            <BulletList items={result.suggestedStructure} />
          </SectionCard>
        ) : (
          <LockedFeatureCard
            title="Suggested structure"
            description="A recommended outline for your submission."
            onUpgrade={onUpgrade}
            preview={
              <div className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-gray-300">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
                    </svg>
                  </span>
                  <span className="text-sm font-semibold text-gray-400">Suggested structure</span>
                </div>
                <ul className="space-y-2">
                  {[1, 2, 3].map((n) => (
                    <li key={n} className="flex items-start gap-2.5">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300" />
                      <div className="h-3 w-40 rounded-full bg-gray-200" />
                    </li>
                  ))}
                </ul>
              </div>
            }
          />
        )}
      </div>

      {/* Common mistakes */}
      <SectionCard
        title="Common mistakes to avoid"
        icon={
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        }
      >
        <BulletList items={result.commonMistakes} variant="warning" />
      </SectionCard>

      {/* Rubric notes */}
      {result.rubricNotes.length > 0 && (
        <SectionCard
          title="Rubric & grading notes"
          badge={!isPro ? <ProBadge /> : undefined}
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
            </svg>
          }
        >
          {isPro ? (
            <BulletList items={result.rubricNotes} />
          ) : (
            <div className="space-y-2">
              {result.rubricNotes.slice(0, 1).map((item, i) => (
                <div key={i} className="flex items-start gap-2.5 opacity-40 blur-[2px] select-none pointer-events-none">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                  <span className="text-sm leading-relaxed text-gray-700">{item}</span>
                </div>
              ))}
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={onUpgrade}
                  className="text-xs font-semibold text-indigo-500 hover:text-indigo-600 transition-colors"
                >
                  Upgrade to see full rubric →
                </button>
              </div>
            </div>
          )}
        </SectionCard>
      )}
    </div>
  );
}
