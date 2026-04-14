import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { mockAnalysis, mockAssignmentAnalysis } from "@/lib/mockData";
import {
  SyllabusAnalysis,
  AssignmentAnalysis,
  DeadlineItem,
  StudyWeek,
  ItemType,
  Priority,
  AnalysisMode,
} from "@/lib/types";

export const maxDuration = 60;

// ─── System Prompts ────────────────────────────────────────────────────────────

const SYLLABUS_SYSTEM_PROMPT = `You are an expert academic syllabus parser. Given a course syllabus, extract all structured information and return ONLY a valid JSON object — no markdown fences, no explanation, no extra text.

The JSON must conform exactly to this shape:

{
  "course": {
    "name": "Full course name",
    "code": "Course code (e.g. CS 101)",
    "instructor": "Instructor name with title",
    "semester": "Semester and year (e.g. Fall 2025)",
    "credits": 3,
    "schedule": "Days and times (e.g. MWF 10:00–11:00 AM)",
    "officeHours": "Office hours or empty string if not specified"
  },
  "items": [
    {
      "id": "unique-slug (e.g. hw1, quiz2, midterm)",
      "title": "Assignment/quiz/exam/project title",
      "type": "assignment" | "quiz" | "exam" | "project",
      "dueDate": "Human-readable date (e.g. Sep 19, 2025)",
      "points": 50,
      "priority": "low" | "medium" | "high",
      "completed": false
    }
  ],
  "studyPlan": [
    {
      "id": "week-1",
      "weekLabel": "Week 1 — Sep 15–21",
      "tasks": [
        {
          "id": "w1-t1",
          "day": "Monday",
          "date": "Sep 15",
          "description": "What to study or do",
          "relatedItem": "Item title this task prepares for",
          "completed": false
        }
      ]
    }
  ]
}

Priority rules:
- "high" for exams and final projects
- "medium" for quizzes and major assignments
- "low" for routine homework

Study plan rules:
- Generate 4–6 weeks covering the full course timeline
- Each week should have 3–5 tasks spread across different days
- Tasks should build toward upcoming deadlines
- Use full day names: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday

If a field cannot be determined from the syllabus, use sensible defaults (empty string, 0, or omit optional fields).`;

const ASSIGNMENT_SYSTEM_PROMPT = `You are an expert academic writing coach and assignment decoder. Given a single assignment prompt, rubric, or set of instructions, extract structured information and return ONLY a valid JSON object — no markdown fences, no explanation, no extra text.

The JSON must conform exactly to this shape:

{
  "title": "Assignment title (infer from text if not explicit)",
  "dueDate": "Due date if mentioned, otherwise empty string",
  "whatProfessorWants": "A clear 2–4 sentence summary of what the instructor is looking for. Focus on the academic goal and the type of thinking required.",
  "deliverables": [
    "Concrete, specific things the student must produce or submit (format, length, file type, etc.)"
  ],
  "stepByStepPlan": [
    "Ordered action steps to complete this assignment successfully. Be concrete and time-aware."
  ],
  "suggestedStructure": [
    "Recommended structure or outline sections for the final deliverable"
  ],
  "commonMistakes": [
    "Mistakes students commonly make on this type of assignment, based on what the prompt emphasizes"
  ],
  "rubricNotes": [
    "Grading criteria or rubric items extracted from the prompt. Empty array if none present."
  ]
}

Guidelines:
- stepByStepPlan should have 5–8 concrete steps in chronological order
- suggestedStructure should match what the deliverable actually is (paper outline, code structure, presentation flow, etc.)
- commonMistakes should be sharp and specific, not generic advice
- If no rubric is present, return an empty rubricNotes array
- All string values should be clear, direct, and student-facing`;

// ─── Sanitizers ────────────────────────────────────────────────────────────────

function sanitizeSyllabusAnalysis(raw: unknown): SyllabusAnalysis {
  const validTypes = new Set<ItemType>(["assignment", "quiz", "exam", "project"]);
  const validPriorities = new Set<Priority>(["low", "medium", "high"]);
  const validDays = new Set(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]);

  const obj = (raw ?? {}) as Record<string, unknown>;
  const course = (obj.course ?? {}) as Record<string, unknown>;
  const rawItems = Array.isArray(obj.items) ? obj.items : [];
  const rawPlan = Array.isArray(obj.studyPlan) ? obj.studyPlan : [];

  const items: DeadlineItem[] = rawItems.map((item: unknown, i: number) => {
    const it = (item ?? {}) as Record<string, unknown>;
    return {
      id: String(it.id ?? `item-${i}`),
      title: String(it.title ?? "Untitled"),
      type: validTypes.has(it.type as ItemType) ? (it.type as ItemType) : "assignment",
      dueDate: String(it.dueDate ?? "TBD"),
      points: typeof it.points === "number" ? it.points : undefined,
      priority: validPriorities.has(it.priority as Priority) ? (it.priority as Priority) : "medium",
      completed: false,
    };
  });

  const studyPlan: StudyWeek[] = rawPlan.map((week: unknown, wi: number) => {
    const w = (week ?? {}) as Record<string, unknown>;
    const rawTasks = Array.isArray(w.tasks) ? w.tasks : [];
    return {
      id: String(w.id ?? `week-${wi + 1}`),
      weekLabel: String(w.weekLabel ?? `Week ${wi + 1}`),
      tasks: rawTasks.map((task: unknown, ti: number) => {
        const t = (task ?? {}) as Record<string, unknown>;
        return {
          id: String(t.id ?? `w${wi + 1}-t${ti + 1}`),
          day: validDays.has(t.day as string) ? (t.day as string) : "Monday",
          date: String(t.date ?? ""),
          description: String(t.description ?? ""),
          relatedItem: String(t.relatedItem ?? ""),
          completed: false,
        };
      }),
    };
  });

  return {
    course: {
      name: String(course.name ?? "Unknown Course"),
      code: String(course.code ?? ""),
      instructor: String(course.instructor ?? ""),
      semester: String(course.semester ?? ""),
      credits: typeof course.credits === "number" ? course.credits : 3,
      schedule: String(course.schedule ?? ""),
      officeHours: String(course.officeHours ?? ""),
    },
    items,
    studyPlan,
  };
}

function sanitizeAssignmentAnalysis(raw: unknown): AssignmentAnalysis {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const toStringArray = (val: unknown): string[] =>
    Array.isArray(val) ? val.map((v) => String(v)) : [];

  return {
    title: String(obj.title ?? "Untitled Assignment"),
    dueDate: String(obj.dueDate ?? ""),
    whatProfessorWants: String(obj.whatProfessorWants ?? ""),
    deliverables: toStringArray(obj.deliverables),
    stepByStepPlan: toStringArray(obj.stepByStepPlan),
    suggestedStructure: toStringArray(obj.suggestedStructure),
    commonMistakes: toStringArray(obj.commonMistakes),
    rubricNotes: toStringArray(obj.rubricNotes),
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function extractJson(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1) return text.slice(start, end + 1);
  return text.trim();
}

// ─── Route Handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let text: string;
  let mode: AnalysisMode;

  try {
    const body = await req.json();
    text = body.text;
    mode = body.mode === "assignment" ? "assignment" : "syllabus";
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!text?.trim()) {
    return NextResponse.json({ error: "No text provided." }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const mockData = mode === "assignment" ? mockAssignmentAnalysis : mockAnalysis;
    return NextResponse.json({ data: mockData, mock: true });
  }

  try {
    const client = new Anthropic({ apiKey });

    const systemPrompt =
      mode === "assignment" ? ASSIGNMENT_SYSTEM_PROMPT : SYLLABUS_SYSTEM_PROMPT;

    const userContent =
      mode === "assignment"
        ? `Decode this assignment and return structured JSON:\n\n${text}`
        : `Parse this syllabus and return structured JSON:\n\n${text}`;

    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 4096,
      system: [
        {
          type: "text",
          text: systemPrompt,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userContent }],
    });

    const rawText =
      response.content[0].type === "text" ? response.content[0].text : "";
    const jsonStr = extractJson(rawText);
    const parsed = JSON.parse(jsonStr);

    const data =
      mode === "assignment"
        ? sanitizeAssignmentAnalysis(parsed)
        : sanitizeSyllabusAnalysis(parsed);

    return NextResponse.json({ data, mock: false });
  } catch (err) {
    console.error("[analyze] Claude API error:", err);
    return NextResponse.json(
      { error: "Failed to analyze. Please try again." },
      { status: 500 }
    );
  }
}
