import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  rowToSavedClass,
  savedClassToRow,
  loadFromLocalStorage,
  isValidSavedClass,
  CLASSES_KEY,
} from "../courseUtils";
import type { SavedClass } from "../types";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const VALID_ROW = {
  id: "abc-123",
  name: "Intro to CS",
  code: "CS101",
  created_at: "2025-09-01T00:00:00.000Z",
  course_info: {
    name: "Intro to CS",
    code: "CS101",
    instructor: "Dr. Chen",
    semester: "Fall 2025",
    credits: 3,
    schedule: "MWF 10–11am",
    officeHours: "",
  },
  items: [
    {
      id: "item-1",
      title: "Homework 1",
      type: "assignment",
      dueDate: "2025-09-19",
      points: 50,
      priority: "medium",
      completed: false,
    },
  ],
  study_plan: [],
  weekly_topics: null,
  grades: [],
  raw_text: null,
};

const VALID_CLASS: SavedClass = {
  id: "abc-123",
  name: "Intro to CS",
  code: "CS101",
  createdAt: "2025-09-01T00:00:00.000Z",
  courseInfo: {
    name: "Intro to CS",
    code: "CS101",
    instructor: "Dr. Chen",
    semester: "Fall 2025",
    credits: 3,
    schedule: "MWF 10–11am",
    officeHours: "",
  },
  items: [
    {
      id: "item-1",
      title: "Homework 1",
      type: "assignment",
      dueDate: "2025-09-19",
      points: 50,
      priority: "medium",
      completed: false,
    },
  ],
  studyPlan: [],
  weeklyTopics: undefined,
  grades: [],
  rawText: undefined,
};

// ─── rowToSavedClass ──────────────────────────────────────────────────────────

describe("rowToSavedClass", () => {
  it("converts a complete DB row to a SavedClass", () => {
    const result = rowToSavedClass(VALID_ROW);
    expect(result.id).toBe("abc-123");
    expect(result.name).toBe("Intro to CS");
    expect(result.code).toBe("CS101");
    expect(result.createdAt).toBe("2025-09-01T00:00:00.000Z");
    expect(result.items).toHaveLength(1);
    expect(result.items[0].title).toBe("Homework 1");
    expect(result.grades).toEqual([]);
    expect(result.studyPlan).toEqual([]);
    expect(result.weeklyTopics).toBeUndefined();
    expect(result.rawText).toBeUndefined();
  });

  it("handles missing optional fields gracefully (no crash)", () => {
    // Simulate a row with only the bare minimum fields
    const sparse = { id: "x", name: "Math" };
    const result = rowToSavedClass(sparse);
    expect(result.id).toBe("x");
    expect(result.name).toBe("Math");
    expect(result.items).toEqual([]);
    expect(result.grades).toEqual([]);
    expect(result.studyPlan).toEqual([]);
    expect(result.code).toBe("");
  });

  it("converts weekly_topics when present", () => {
    const row = {
      ...VALID_ROW,
      weekly_topics: [{ week: 1, topic: "Variables", chapters: "Ch. 1" }],
    };
    const result = rowToSavedClass(row);
    expect(result.weeklyTopics).toHaveLength(1);
    expect(result.weeklyTopics![0].topic).toBe("Variables");
  });

  it("stores raw_text when present", () => {
    const row = { ...VALID_ROW, raw_text: "CS 101 syllabus text..." };
    const result = rowToSavedClass(row);
    expect(result.rawText).toBe("CS 101 syllabus text...");
  });

  it("round-trips with savedClassToRow without data loss", () => {
    const row = savedClassToRow(VALID_CLASS, "user-xyz");
    const restored = rowToSavedClass(row as Record<string, unknown>);

    expect(restored.id).toBe(VALID_CLASS.id);
    expect(restored.name).toBe(VALID_CLASS.name);
    expect(restored.code).toBe(VALID_CLASS.code);
    expect(restored.items).toEqual(VALID_CLASS.items);
    expect(restored.grades).toEqual(VALID_CLASS.grades);
    expect(restored.studyPlan).toEqual(VALID_CLASS.studyPlan);
  });
});

// ─── savedClassToRow ──────────────────────────────────────────────────────────

describe("savedClassToRow", () => {
  it("produces a row with user_id and snake_case keys", () => {
    const row = savedClassToRow(VALID_CLASS, "user-456");
    expect(row.user_id).toBe("user-456");
    expect(row.course_info).toEqual(VALID_CLASS.courseInfo);
    expect(row.study_plan).toEqual(VALID_CLASS.studyPlan);
    expect(row.weekly_topics).toBeNull(); // undefined → null for DB
    expect(row.raw_text).toBeNull();
  });

  it("converts weeklyTopics to weekly_topics (array → array)", () => {
    const cls = {
      ...VALID_CLASS,
      weeklyTopics: [{ week: 1, topic: "Intro" }],
    };
    const row = savedClassToRow(cls, "u1");
    expect(row.weekly_topics).toEqual([{ week: 1, topic: "Intro" }]);
  });

  it("converts rawText to raw_text", () => {
    const cls = { ...VALID_CLASS, rawText: "raw syllabus" };
    const row = savedClassToRow(cls, "u1");
    expect(row.raw_text).toBe("raw syllabus");
  });
});

// ─── isValidSavedClass ────────────────────────────────────────────────────────

describe("isValidSavedClass", () => {
  it("accepts a complete valid SavedClass", () => {
    expect(isValidSavedClass(VALID_CLASS)).toBe(true);
  });

  it("rejects null", () => {
    expect(isValidSavedClass(null)).toBe(false);
  });

  it("rejects a plain string", () => {
    expect(isValidSavedClass("some string")).toBe(false);
  });

  it("rejects an empty object", () => {
    expect(isValidSavedClass({})).toBe(false);
  });

  it("rejects an object missing id", () => {
    const { id, ...rest } = VALID_CLASS;
    void id;
    expect(isValidSavedClass(rest)).toBe(false);
  });

  it("rejects an object with empty id", () => {
    expect(isValidSavedClass({ ...VALID_CLASS, id: "" })).toBe(false);
  });

  it("rejects an object with empty name", () => {
    expect(isValidSavedClass({ ...VALID_CLASS, name: "" })).toBe(false);
  });

  it("rejects an object where items is not an array", () => {
    expect(isValidSavedClass({ ...VALID_CLASS, items: "not an array" })).toBe(
      false
    );
  });

  it("rejects an object where grades is not an array", () => {
    expect(isValidSavedClass({ ...VALID_CLASS, grades: null })).toBe(false);
  });

  it("accepts a class with missing studyPlan (old format)", () => {
    // Very old localStorage entries may lack studyPlan
    const old = { ...VALID_CLASS, studyPlan: undefined };
    expect(isValidSavedClass(old)).toBe(true);
  });

  it("rejects a class where studyPlan is not an array", () => {
    expect(
      isValidSavedClass({ ...VALID_CLASS, studyPlan: "invalid" })
    ).toBe(false);
  });
});

// ─── loadFromLocalStorage ─────────────────────────────────────────────────────

describe("loadFromLocalStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    localStorage.clear();
  });

  it("returns [] when localStorage is empty", () => {
    expect(loadFromLocalStorage()).toEqual([]);
  });

  it("returns [] when the key is missing", () => {
    expect(loadFromLocalStorage()).toEqual([]);
  });

  it("returns saved classes when the key has valid JSON", () => {
    localStorage.setItem(CLASSES_KEY, JSON.stringify([VALID_CLASS]));
    const result = loadFromLocalStorage();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("abc-123");
  });

  it("returns [] for malformed JSON (does not crash)", () => {
    localStorage.setItem(CLASSES_KEY, "{{{not valid json");
    expect(loadFromLocalStorage()).toEqual([]);
  });

  it("returns [] when the stored value is a non-array (object)", () => {
    localStorage.setItem(CLASSES_KEY, JSON.stringify({ id: "x" }));
    expect(loadFromLocalStorage()).toEqual([]);
  });

  it("returns [] when the stored value is a non-array (string)", () => {
    localStorage.setItem(CLASSES_KEY, JSON.stringify("just a string"));
    expect(loadFromLocalStorage()).toEqual([]);
  });

  it("filters out invalid entries from an otherwise valid array", () => {
    const badEntry = { id: "", name: "", items: "not-array" }; // invalid
    localStorage.setItem(
      CLASSES_KEY,
      JSON.stringify([VALID_CLASS, badEntry, null, 42])
    );
    const result = loadFromLocalStorage();
    // Only VALID_CLASS should survive the filter
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("abc-123");
  });

  it("handles an array of entirely invalid entries — returns []", () => {
    localStorage.setItem(
      CLASSES_KEY,
      JSON.stringify([
        null,
        undefined,
        {},
        { id: "" },
        { id: "x", name: "", items: [] }, // empty name — invalid
      ])
    );
    expect(loadFromLocalStorage()).toEqual([]);
  });

  it("handles a class whose items field has nulls — keeps the class", () => {
    // items is an array (even if it has garbage entries) — class is structurally valid
    const cls = { ...VALID_CLASS, items: [null, undefined] };
    localStorage.setItem(CLASSES_KEY, JSON.stringify([cls]));
    const result = loadFromLocalStorage();
    // isValidSavedClass checks Array.isArray(items), not item contents
    expect(result).toHaveLength(1);
  });
});
