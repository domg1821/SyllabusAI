import { useState, useEffect, useCallback } from "react";
import { SavedClass, DeadlineItem, StudyWeek, GradeEntry } from "./types";

const CLASSES_KEY = "sai_classes";

function loadClasses(): SavedClass[] {
  try {
    const raw = localStorage.getItem(CLASSES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveClasses(classes: SavedClass[]) {
  try {
    localStorage.setItem(CLASSES_KEY, JSON.stringify(classes));
  } catch {
    // Storage quota exceeded — silently ignore
  }
}

export function useClasses() {
  const [classes, setClasses] = useState<SavedClass[]>([]);

  useEffect(() => {
    setClasses(loadClasses());
  }, []);

  const addClass = useCallback((cls: Omit<SavedClass, "id" | "createdAt" | "grades">) => {
    const newClass: SavedClass = {
      ...cls,
      id: `class-${Date.now()}`,
      createdAt: new Date().toISOString(),
      grades: [],
    };
    setClasses((prev) => {
      const next = [newClass, ...prev];
      saveClasses(next);
      return next;
    });
    return newClass.id;
  }, []);

  const updateClass = useCallback((id: string, updates: Partial<Pick<SavedClass, "items" | "studyPlan" | "grades">>) => {
    setClasses((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, ...updates } : c));
      saveClasses(next);
      return next;
    });
  }, []);

  const removeClass = useCallback((id: string) => {
    setClasses((prev) => {
      const next = prev.filter((c) => c.id !== id);
      saveClasses(next);
      return next;
    });
  }, []);

  const toggleClassItem = useCallback((classId: string, itemId: string) => {
    setClasses((prev) => {
      const next = prev.map((c) => {
        if (c.id !== classId) return c;
        return {
          ...c,
          items: c.items.map((item: DeadlineItem) =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
          ),
        };
      });
      saveClasses(next);
      return next;
    });
  }, []);

  const toggleClassTask = useCallback((classId: string, weekId: string, taskId: string) => {
    setClasses((prev) => {
      const next = prev.map((c) => {
        if (c.id !== classId) return c;
        return {
          ...c,
          studyPlan: c.studyPlan.map((week: StudyWeek) => {
            if (week.id !== weekId) return week;
            return {
              ...week,
              tasks: week.tasks.map((task) =>
                task.id === taskId ? { ...task, completed: !task.completed } : task
              ),
            };
          }),
        };
      });
      saveClasses(next);
      return next;
    });
  }, []);

  const setGrade = useCallback((classId: string, entry: GradeEntry) => {
    setClasses((prev) => {
      const next = prev.map((c) => {
        if (c.id !== classId) return c;
        const existing = c.grades.find((g) => g.itemId === entry.itemId);
        const grades = existing
          ? c.grades.map((g) => (g.itemId === entry.itemId ? entry : g))
          : [...c.grades, entry];
        return { ...c, grades };
      });
      saveClasses(next);
      return next;
    });
  }, []);

  const removeGrade = useCallback((classId: string, itemId: string) => {
    setClasses((prev) => {
      const next = prev.map((c) => {
        if (c.id !== classId) return c;
        return { ...c, grades: c.grades.filter((g) => g.itemId !== itemId) };
      });
      saveClasses(next);
      return next;
    });
  }, []);

  return {
    classes,
    addClass,
    updateClass,
    removeClass,
    toggleClassItem,
    toggleClassTask,
    setGrade,
    removeGrade,
  };
}
