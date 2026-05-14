/**
 * Pure utility functions for course data conversion and validation.
 * Extracted from useClasses so they can be unit-tested without mocking Supabase.
 */

import {
  SavedClass,
  DeadlineItem,
  StudyWeek,
  GradeEntry,
  CourseInfo,
  WeeklyTopic,
} from "./types";

export const CLASSES_KEY = "sai_classes";
export const MIGRATED_KEY = "sai_migrated";

// ─── DB row ↔ SavedClass ───────────────────────────────────────────────────────

/** Convert a Supabase courses row (snake_case JSONB) to the TypeScript shape. */
export function rowToSavedClass(row: Record<string, unknown>): SavedClass {
  return {
    id: (row.id as string) ?? "",
    name: (row.name as string) ?? "",
    code: (row.code as string) ?? "",
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
    courseInfo: (row.course_info as CourseInfo) ?? {
      name: "",
      code: "",
      instructor: "",
      semester: "",
      credits: 0,
      schedule: "",
      officeHours: "",
    },
    items: (row.items as DeadlineItem[]) ?? [],
    studyPlan: (row.study_plan as StudyWeek[]) ?? [],
    weeklyTopics:
      (row.weekly_topics as WeeklyTopic[] | null) ?? undefined,
    grades: (row.grades as GradeEntry[]) ?? [],
    rawText: (row.raw_text as string | null) ?? undefined,
  };
}

/** Convert a SavedClass to the Supabase insert/update payload. */
export function savedClassToRow(cls: SavedClass, userId: string) {
  return {
    id: cls.id,
    user_id: userId,
    name: cls.name,
    code: cls.code,
    course_info: cls.courseInfo,
    items: cls.items,
    study_plan: cls.studyPlan,
    weekly_topics: cls.weeklyTopics ?? null,
    grades: cls.grades,
    raw_text: cls.rawText ?? null,
    created_at: cls.createdAt,
  };
}

// ─── LocalStorage ─────────────────────────────────────────────────────────────

/** Load courses from localStorage. Returns [] on any error. */
export function loadFromLocalStorage(): SavedClass[] {
  try {
    const raw = localStorage.getItem(CLASSES_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Filter out malformed entries instead of crashing
    return parsed.filter(isValidSavedClass);
  } catch {
    return [];
  }
}

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Runtime check for minimum viable SavedClass shape.
 * Used during localStorage migration to skip corrupted entries.
 */
export function isValidSavedClass(obj: unknown): obj is SavedClass {
  if (!obj || typeof obj !== "object") return false;
  const c = obj as Record<string, unknown>;
  return (
    typeof c.id === "string" &&
    c.id.length > 0 &&
    typeof c.name === "string" &&
    c.name.length > 0 &&
    Array.isArray(c.items) &&
    Array.isArray(c.grades) &&
    // studyPlan might be missing in very old localStorage entries
    (c.studyPlan === undefined || Array.isArray(c.studyPlan))
  );
}
