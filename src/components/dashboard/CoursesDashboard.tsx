"use client";

import React, { useState } from "react";
import { SavedClass } from "@/lib/types";
import DeadlineCard from "./DeadlineCard";
import StudyWeekCard from "./StudyWeekCard";
import GradeTracker from "./GradeTracker";
interface Props {
  classes: SavedClass[];
  isPro: boolean;
  onToggleItem: (classId: string, itemId: string) => void;
  onToggleTask: (classId: string, weekId: string, taskId: string) => void;
  onSetGrade: (classId: string, entry: import("@/lib/types").GradeEntry) => void;
  onRemoveGrade: (classId: string, itemId: string) => void;
  onDelete: (classId: string) => void;
  onUpgradeClick: () => void;
  onAddNew: () => void;
}

type ClassView = "deadlines" | "study" | "grades";

export default function CoursesDashboard({
  classes,
  isPro,
  onToggleItem,
  onToggleTask,
  onSetGrade,
  onRemoveGrade,
  onDelete,
  onUpgradeClick,
  onAddNew,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [classView, setClassView] = useState<ClassView>("deadlines");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  if (classes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
          <svg className="h-7 w-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
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

  const expanded = classes.find((c) => c.id === expandedId) ?? null;

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
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
            <div key={cls.id} className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              {/* Course header row */}
              <div className="flex items-center gap-4 px-5 py-4">
                <button
                  onClick={() => {
                    setExpandedId(isExpanded ? null : cls.id);
                    setClassView("deadlines");
                  }}
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
                    <div className="text-sm font-bold text-gray-800">{completedItems}/{totalItems}</div>
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
                        onClick={() => { onDelete(cls.id); setConfirmDelete(null); setExpandedId(null); }}
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
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete(cls.id); }}
                      className="text-gray-300 hover:text-red-400 transition-colors"
                      title="Delete course"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  )}

                  <button
                    onClick={() => { setExpandedId(isExpanded ? null : cls.id); setClassView("deadlines"); }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg
                      className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
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
                <div className="border-t border-gray-100 px-5 py-4">
                  {/* Sub-nav */}
                  <div className="mb-4 flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 w-fit">
                    {(["deadlines", "study", "grades"] as ClassView[]).map((v) => (
                      <button
                        key={v}
                        onClick={() => setClassView(v)}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors capitalize ${
                          classView === v ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {v === "study" ? "Study Plan" : v === "grades" ? "Grades" : "Deadlines"}
                      </button>
                    ))}
                  </div>

                  {classView === "deadlines" && (
                    cls.items.length === 0 ? (
                      <p className="text-sm text-gray-400">No deadlines found.</p>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {cls.items.map((item) => (
                          <DeadlineCard
                            key={item.id}
                            item={item}
                            onToggle={(id) => onToggleItem(cls.id, id)}
                          />
                        ))}
                      </div>
                    )
                  )}

                  {classView === "study" && (
                    isPro ? (
                      cls.studyPlan.length === 0 ? (
                        <p className="text-sm text-gray-400">No study plan available.</p>
                      ) : (
                        <div className="space-y-3">
                          {cls.studyPlan.map((week) => {
                            const wn = week.weekLabel.match(/Week\s+(\d+)/i)?.[1];
                            const wt = wn ? cls.weeklyTopics?.find((t) => t.week === parseInt(wn)) : undefined;
                            return (
                              <StudyWeekCard
                                key={week.id}
                                week={week}
                                onToggleTask={(weekId, taskId) => onToggleTask(cls.id, weekId, taskId)}
                                weekTopic={wt?.topic}
                                weekChapters={wt?.chapters}
                              />
                            );
                          })}
                        </div>
                      )
                    ) : (
                      <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50 p-6 text-center">
                        <p className="text-sm font-semibold text-indigo-700">Study plans are a Pro feature</p>
                        <p className="mt-1 text-xs text-indigo-500">Upgrade to see your week-by-week study schedule.</p>
                        <button
                          onClick={onUpgradeClick}
                          className="mt-3 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
                        >
                          Upgrade to Pro
                        </button>
                      </div>
                    )
                  )}

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
