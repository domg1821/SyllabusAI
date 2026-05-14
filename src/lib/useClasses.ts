import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { SavedClass, GradeEntry } from "./types";
import {
  rowToSavedClass,
  savedClassToRow,
  loadFromLocalStorage,
  MIGRATED_KEY,
} from "./courseUtils";

// ─── Error formatting ──────────────────────────────────────────────────────────
// console.error("prefix:", error) shows {} for PostgrestError because
// .message is non-enumerable (set by the Error constructor).
// This helper explicitly reads all relevant fields so the real cause is visible.

function fmtErr(err: unknown): string {
  if (!err) return "(empty error)";
  if (err instanceof Error) {
    // Covers PostgrestError (extends Error) — .message is accessible even when
    // it's non-enumerable in the browser console's default object display.
    return `${err.name}: ${err.message}`;
  }
  if (typeof err === "object") {
    const e = err as Record<string, unknown>;
    const parts: string[] = [];
    if (e.message) parts.push(`message: ${e.message}`);
    if (e.code)    parts.push(`code: ${e.code}`);
    if (e.details) parts.push(`details: ${e.details}`);
    if (e.hint)    parts.push(`hint: ${e.hint}`);
    if (parts.length) return parts.join(" | ");
    try { return JSON.stringify(err); } catch { return "[unserializable]"; }
  }
  return String(err);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useClasses() {
  const supabase = useMemo(() => createClient(), []);

  const [classes, _setClasses] = useState<SavedClass[]>([]);
  const [loading, setLoading] = useState(true);

  // Ref mirror of classes — lets callbacks read current state without
  // needing React's functional-update pattern for every async write.
  const classesRef = useRef<SavedClass[]>([]);

  // Cached user ID — avoids calling getUser() on every mutation.
  const userIdRef = useRef<string | null>(null);

  // Wrapper that keeps classesRef in sync with React state.
  // This makes the ref a reliable source of truth for snapshot-based rollback.
  const setClasses = useCallback(
    (next: SavedClass[] | ((prev: SavedClass[]) => SavedClass[])) => {
      _setClasses((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next;
        classesRef.current = resolved;
        return resolved;
      });
    },
    [] // _setClasses is stable from useState
  );

  // Helper: get userId from cache or Supabase
  const getUserId = useCallback(async (): Promise<string | null> => {
    if (userIdRef.current) return userIdRef.current;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) userIdRef.current = user.id;
    return user?.id ?? null;
  }, [supabase]);

  /**
   * Runs a DB write operation. If it fails (Supabase error or network throw),
   * calls the optional rollback function to revert the optimistic state update.
   *
   * `fn` should return the raw Supabase result so errors can be detected
   * without the Supabase client throwing (it typically returns { error } instead).
   */
  const dbSync = useCallback(
    async (
      fn: (userId: string) => PromiseLike<{ error: unknown } | null | void>,
      onFailure?: () => void
    ) => {
      try {
        const userId = await getUserId();
        if (!userId) return;
        const result = await fn(userId);
        if (result?.error) {
          console.error("[useClasses] DB write failed:", fmtErr(result.error));
          onFailure?.();
        }
      } catch (err) {
        console.error("[useClasses] Unexpected sync error:", fmtErr(err));
        onFailure?.();
      }
    },
    [getUserId]
  );

  // ── Initial load ──────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // Not signed in — fall back to localStorage (graceful degradation).
        // In normal app flow this shouldn't happen because middleware guards /dashboard.
        const local = loadFromLocalStorage();
        if (!cancelled) {
          setClasses(local);
          setLoading(false);
        }
        return;
      }

      userIdRef.current = user.id;

      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (error) {
        console.error("[useClasses] load error:", fmtErr(error));
        setClasses([]);
        setLoading(false);
        return;
      }

      const loaded = (data ?? []).map(rowToSavedClass);

      // One-time migration: if Supabase is empty and localStorage has courses,
      // copy them over so existing users don't lose their data on upgrade.
      if (loaded.length === 0 && !localStorage.getItem(MIGRATED_KEY)) {
        localStorage.setItem(MIGRATED_KEY, "true");
        const local = loadFromLocalStorage();
        if (local.length > 0) {
          const rows = local.map((cls) => savedClassToRow(cls, user.id));
          const { error: migrateErr } = await supabase
            .from("courses")
            .insert(rows);
          if (!migrateErr && !cancelled) {
            setClasses(local);
            setLoading(false);
            return;
          }
          // If migration insert fails, still show the local data
          if (!cancelled) {
            setClasses(local);
            setLoading(false);
          }
          return;
        }
      } else if (loaded.length > 0) {
        localStorage.setItem(MIGRATED_KEY, "true");
      }

      if (!cancelled) {
        setClasses(loaded);
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [supabase, setClasses]);

  // ── CRUD Operations ───────────────────────────────────────────────────────
  // Pattern for every mutation:
  //   1. Capture snapshot of current state (for rollback if DB write fails)
  //   2. Apply optimistic state update immediately
  //   3. Fire async DB write; if it fails, roll back state to snapshot

  const addClass = useCallback(
    (
      cls: Omit<SavedClass, "id" | "createdAt" | "grades"> & {
        grades?: GradeEntry[];
      }
    ): string => {
      const snapshot = classesRef.current.slice();
      const newId = crypto.randomUUID();
      const newClass: SavedClass = {
        ...cls,
        id: newId,
        createdAt: new Date().toISOString(),
        grades: cls.grades ?? [],
      };

      setClasses((prev) => [newClass, ...prev]);

      dbSync(
        (userId) =>
          supabase.from("courses").insert(savedClassToRow(newClass, userId)),
        () => {
          console.error("[useClasses] addClass rolled back");
          setClasses(snapshot);
        }
      );

      return newId;
    },
    [supabase, setClasses, dbSync]
  );

  const updateClass = useCallback(
    (
      id: string,
      updates: Partial<Pick<SavedClass, "items" | "studyPlan" | "grades">>
    ) => {
      const snapshot = classesRef.current.slice();
      setClasses((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
      );

      dbSync(
        (userId) => {
          const dbUpdates: Record<string, unknown> = {};
          if (updates.items !== undefined) dbUpdates.items = updates.items;
          if (updates.studyPlan !== undefined)
            dbUpdates.study_plan = updates.studyPlan;
          if (updates.grades !== undefined) dbUpdates.grades = updates.grades;
          return supabase
            .from("courses")
            .update(dbUpdates)
            .eq("id", id)
            .eq("user_id", userId);
        },
        () => {
          console.error("[useClasses] updateClass rolled back");
          setClasses(snapshot);
        }
      );
    },
    [supabase, setClasses, dbSync]
  );

  const removeClass = useCallback(
    (id: string) => {
      const snapshot = classesRef.current.slice();
      setClasses((prev) => prev.filter((c) => c.id !== id));

      dbSync(
        (userId) =>
          supabase
            .from("courses")
            .delete()
            .eq("id", id)
            .eq("user_id", userId),
        () => {
          console.error("[useClasses] removeClass rolled back");
          setClasses(snapshot);
        }
      );
    },
    [supabase, setClasses, dbSync]
  );

  const toggleClassItem = useCallback(
    (classId: string, itemId: string) => {
      const cls = classesRef.current.find((c) => c.id === classId);
      if (!cls) return;
      const snapshot = classesRef.current.slice();

      const newItems = cls.items.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      );

      setClasses((prev) =>
        prev.map((c) => (c.id === classId ? { ...c, items: newItems } : c))
      );

      dbSync(
        (userId) =>
          supabase
            .from("courses")
            .update({ items: newItems })
            .eq("id", classId)
            .eq("user_id", userId),
        () => {
          console.error("[useClasses] toggleClassItem rolled back");
          setClasses(snapshot);
        }
      );
    },
    [supabase, setClasses, dbSync]
  );

  const toggleClassTask = useCallback(
    (classId: string, weekId: string, taskId: string) => {
      const cls = classesRef.current.find((c) => c.id === classId);
      if (!cls) return;
      const snapshot = classesRef.current.slice();

      const newStudyPlan = cls.studyPlan.map((week) => {
        if (week.id !== weekId) return week;
        return {
          ...week,
          tasks: week.tasks.map((task) =>
            task.id === taskId ? { ...task, completed: !task.completed } : task
          ),
        };
      });

      setClasses((prev) =>
        prev.map((c) =>
          c.id === classId ? { ...c, studyPlan: newStudyPlan } : c
        )
      );

      dbSync(
        (userId) =>
          supabase
            .from("courses")
            .update({ study_plan: newStudyPlan })
            .eq("id", classId)
            .eq("user_id", userId),
        () => {
          console.error("[useClasses] toggleClassTask rolled back");
          setClasses(snapshot);
        }
      );
    },
    [supabase, setClasses, dbSync]
  );

  const setGrade = useCallback(
    (classId: string, entry: GradeEntry) => {
      const cls = classesRef.current.find((c) => c.id === classId);
      if (!cls) return;
      const snapshot = classesRef.current.slice();

      const existing = cls.grades.find((g) => g.itemId === entry.itemId);
      const newGrades = existing
        ? cls.grades.map((g) => (g.itemId === entry.itemId ? entry : g))
        : [...cls.grades, entry];

      setClasses((prev) =>
        prev.map((c) => (c.id === classId ? { ...c, grades: newGrades } : c))
      );

      dbSync(
        (userId) =>
          supabase
            .from("courses")
            .update({ grades: newGrades })
            .eq("id", classId)
            .eq("user_id", userId),
        () => {
          console.error("[useClasses] setGrade rolled back");
          setClasses(snapshot);
        }
      );
    },
    [supabase, setClasses, dbSync]
  );

  const removeGrade = useCallback(
    (classId: string, itemId: string) => {
      const cls = classesRef.current.find((c) => c.id === classId);
      if (!cls) return;
      const snapshot = classesRef.current.slice();

      const newGrades = cls.grades.filter((g) => g.itemId !== itemId);

      setClasses((prev) =>
        prev.map((c) => (c.id === classId ? { ...c, grades: newGrades } : c))
      );

      dbSync(
        (userId) =>
          supabase
            .from("courses")
            .update({ grades: newGrades })
            .eq("id", classId)
            .eq("user_id", userId),
        () => {
          console.error("[useClasses] removeGrade rolled back");
          setClasses(snapshot);
        }
      );
    },
    [supabase, setClasses, dbSync]
  );

  return {
    classes,
    loading,
    addClass,
    updateClass,
    removeClass,
    toggleClassItem,
    toggleClassTask,
    setGrade,
    removeGrade,
  };
}
