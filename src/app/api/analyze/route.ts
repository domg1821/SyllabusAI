import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";
import { FREE_LIMIT } from "@/lib/constants";
import { mockAnalysis, mockAssignmentAnalysis } from "@/lib/mockData";
import { limiters, checkRateLimit, tooManyRequests, clientIp } from "@/lib/ratelimit";
import {
  SyllabusAnalysis,
  AssignmentAnalysis,
  DeadlineItem,
  StudyWeek,
  WeeklyTopic,
  ItemType,
  Priority,
  AnalysisMode,
} from "@/lib/types";

export const maxDuration = 60;

// ─── System Prompts ────────────────────────────────────────────────────────────

const SYLLABUS_SYSTEM_PROMPT = `You are an expert academic syllabus parser and study strategist. Given a course syllabus, extract all structured information and return ONLY a valid JSON object — no markdown fences, no explanation, no extra text.

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
      "dueDate": "Human-readable date (e.g. Sep 19, 2025) or TBD if unknown",
      "points": 50,
      "priority": "low" | "medium" | "high",
      "completed": false
    }
  ],
  "weeklyTopics": [
    {
      "week": 1,
      "topic": "Main topic or chapter title for this week (e.g. Process Scheduling)",
      "chapters": "Chapter references if present (e.g. Ch. 5–6) or empty string"
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
          "description": "Specific, actionable task referencing the actual topic (e.g. 'Read Ch. 5 on CPU scheduling: understand FCFS, SJF, and Round Robin algorithms')",
          "relatedItem": "Exact title of the assignment/quiz/exam this task prepares for",
          "notes": "1–2 sentence study tip or what to focus on (e.g. 'Pay attention to how turnaround time is calculated — this commonly appears on quizzes.')",
          "estimatedMinutes": 60,
          "completed": false
        }
      ]
    }
  ]
}

Priority rules:
- "high" for exams and final projects
- "medium" for quizzes and major assignments (worth >30 pts or >10% of grade)
- "low" for routine homework

weeklyTopics rules:
- Extract the weekly topic/chapter schedule if the syllabus contains one
- If no explicit schedule, infer logical topic progression from assignments and course name
- Generate 4–8 entries covering the course arc
- topic should be concise but descriptive (not just "Week 1" — use the actual concept name)

Study plan rules:
- Generate 4–8 weeks covering the full course timeline
- Each week should have 3–5 tasks spread across different days
- Tasks MUST be highly specific — reference actual chapter names, concepts, or topics from the syllabus (never generic "study chapter X")
- description: concrete and actionable, naming the exact concept or skill (e.g. "Work through 5 CPU scheduling problems: calculate waiting time for FCFS and Round Robin with quantum=4")
- notes: 1–2 sentence tip about what to focus on, a common pitfall, or how this connects to an upcoming assessment
- estimatedMinutes: realistic estimate (30–120 typically)
- relatedItem: exact title of the upcoming assignment/quiz/exam this week builds toward
- Use full day names: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday
- If the syllabus has a topic schedule, align tasks with those topics

If a field cannot be determined from the syllabus, use sensible defaults (empty string, 0, or omit optional fields).
For weeklyTopics, always generate at least 3–4 entries even if the syllabus is sparse — infer from course name and items.`;

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
  const rawTopics = Array.isArray(obj.weeklyTopics) ? obj.weeklyTopics : [];

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
        const notes = typeof t.notes === "string" && t.notes.trim() ? t.notes.trim() : undefined;
        const estimatedMinutes =
          typeof t.estimatedMinutes === "number" && t.estimatedMinutes > 0
            ? t.estimatedMinutes
            : undefined;
        return {
          id: String(t.id ?? `w${wi + 1}-t${ti + 1}`),
          day: validDays.has(t.day as string) ? (t.day as string) : "Monday",
          date: String(t.date ?? ""),
          description: String(t.description ?? ""),
          relatedItem: String(t.relatedItem ?? ""),
          completed: false,
          ...(notes ? { notes } : {}),
          ...(estimatedMinutes ? { estimatedMinutes } : {}),
        };
      }),
    };
  });

  const weeklyTopics: WeeklyTopic[] = rawTopics
    .map((t: unknown, i: number) => {
      const tp = (t ?? {}) as Record<string, unknown>;
      return {
        week: typeof tp.week === "number" ? tp.week : i + 1,
        topic: String(tp.topic ?? ""),
        chapters: typeof tp.chapters === "string" && tp.chapters.trim() ? tp.chapters.trim() : undefined,
      };
    })
    .filter((t) => t.topic);

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
    weeklyTopics: weeklyTopics.length > 0 ? weeklyTopics : undefined,
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

// ─── Truncation ────────────────────────────────────────────────────────────────

const SYLLABUS_MAX_CHARS = 15_000;
const ASSIGNMENT_MAX_CHARS = 8_000;

function truncateText(raw: string, maxChars: number): { text: string; truncated: boolean } {
  if (raw.length <= maxChars) return { text: raw, truncated: false };

  // Prefer splitting on paragraph boundaries so we never cut mid-sentence.
  const paragraphs = raw.split(/\n{2,}/);
  const kept: string[] = [];
  let total = 0;
  for (const para of paragraphs) {
    const needed = kept.length > 0 ? para.length + 2 : para.length; // +2 for \n\n
    if (total + needed > maxChars) break;
    kept.push(para);
    total += needed;
  }
  if (kept.length > 0) return { text: kept.join("\n\n"), truncated: true };

  // Fallback: last sentence boundary in the first maxChars characters.
  const slice = raw.slice(0, maxChars);
  const lastSentence = Math.max(
    slice.lastIndexOf(". "),
    slice.lastIndexOf(".\n"),
    slice.lastIndexOf("! "),
    slice.lastIndexOf("? ")
  );
  if (lastSentence > maxChars * 0.5) {
    return { text: slice.slice(0, lastSentence + 1).trimEnd(), truncated: true };
  }

  return { text: slice, truncated: true };
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

function balanceJsonCandidate(text: string): string {
  let inString = false;
  let escaped = false;
  let depth = 0;
  let end = text.length;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
    } else if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }

  let candidate = text.slice(0, end).trim();
  candidate = candidate.replace(/,\s*([}\]])/g, "$1");

  const openBraces = (candidate.match(/\{/g) ?? []).length;
  const closeBraces = (candidate.match(/\}/g) ?? []).length;
  if (openBraces > closeBraces) {
    candidate += "}".repeat(openBraces - closeBraces);
  }

  const openBrackets = (candidate.match(/\[/g) ?? []).length;
  const closeBrackets = (candidate.match(/\]/g) ?? []).length;
  if (openBrackets > closeBrackets) {
    candidate += "]".repeat(openBrackets - closeBrackets);
  }

  return candidate;
}

function parseModelJson(rawText: string): unknown {
  const candidates = [
    extractJson(rawText),
    (() => {
      const match = rawText.match(/\{[\s\S]*$/);
      return match ? balanceJsonCandidate(match[0]) : "";
    })(),
    (() => {
      const match = rawText.match(/\{[\s\S]*\}/);
      return match ? balanceJsonCandidate(match[0]) : "";
    })(),
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      continue;
    }
  }

  throw new Error("Model returned text, but no parseable JSON object was found.");
}

// ─── Route Handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ─── Auth ──────────────────────────────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // IP-based rate limit for unauthenticated callers (3/hour)
    const ip = clientIp(req);
    const ipCheck = await checkRateLimit(limiters.analyzeIp, `anon:${ip}`);
    if (ipCheck.blocked) return tooManyRequests(ipCheck.reset, "hour");
    return NextResponse.json(
      { error: "Sign in to analyze syllabi and assignments." },
      { status: 401 }
    );
  }

  // Per-user rate limits: 10/hour and 50/day
  const hourlyCheck = await checkRateLimit(limiters.analyzeHourly, `user:${user.id}`);
  if (hourlyCheck.blocked) return tooManyRequests(hourlyCheck.reset, "hour");

  const dailyCheck = await checkRateLimit(limiters.analyzeDaily, `user:${user.id}`);
  if (dailyCheck.blocked) return tooManyRequests(dailyCheck.reset, "day");

  // ─── Free-tier quota ───────────────────────────────────────────────────────
  let { data: profile } = await supabase
    .from("profiles")
    .select("is_pro, analysis_count")
    .eq("id", user.id)
    .single();

  // Auto-create profile row for users who pre-date the handle_new_user trigger.
  if (!profile) {
    await supabase
      .from("profiles")
      .upsert({ id: user.id, is_pro: false, analysis_count: 0 });
    profile = { is_pro: false, analysis_count: 0 };
  }

  const isPro = profile.is_pro ?? false;
  const analysisCount = profile.analysis_count ?? 0;

  if (!isPro && analysisCount >= FREE_LIMIT) {
    return NextResponse.json(
      { error: "You've used all 3 free analyses. Upgrade to Pro for unlimited access." },
      { status: 403 }
    );
  }

  // Increments the DB count after a successful analysis.
  // Not called on parse/API errors so failures don't consume quota.
  async function markUsed() {
    if (isPro) return;
    const { error } = await supabase
      .from("profiles")
      .update({ analysis_count: analysisCount + 1 })
      .eq("id", user!.id);
    if (error) console.error("[analyze] count increment failed:", error.message);
  }

  // ─── Parse request ─────────────────────────────────────────────────────────
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

  // ─── Mock path (no API key) ────────────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const mockData = mode === "assignment" ? mockAssignmentAnalysis : mockAnalysis;
    await markUsed();
    return NextResponse.json({ data: mockData, mock: true });
  }

  // ─── Real path ─────────────────────────────────────────────────────────────
  try {
    const client = new Anthropic({ apiKey });
    const { text: preparedText, truncated: wasTruncated } = truncateText(
      text.trim(),
      mode === "syllabus" ? SYLLABUS_MAX_CHARS : ASSIGNMENT_MAX_CHARS
    );

    const systemPrompt =
      mode === "assignment" ? ASSIGNMENT_SYSTEM_PROMPT : SYLLABUS_SYSTEM_PROMPT;

    const truncationNote = wasTruncated
      ? `\n\n[Note: This ${mode} was trimmed to fit context limits. Extract all information visible above.]`
      : "";

    const userContent =
      mode === "assignment"
        ? `Decode this assignment and return structured JSON:\n\n${preparedText}${truncationNote}`
        : `Parse this syllabus and return structured JSON:\n\n${preparedText}${truncationNote}`;

    console.log(`[analyze] mode=${mode} inputLength=${preparedText.length} truncated=${wasTruncated} userId=${user.id}`);

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
    });

    const rawText = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    console.log("[analyze] raw response preview:", rawText.slice(0, 500));
    let parsed: unknown;

    try {
      parsed = parseModelJson(rawText);
    } catch (parseError) {
      console.error(
        "[analyze] Failed to parse model response:",
        parseError instanceof Error ? parseError.message : String(parseError)
      );
      console.error("[analyze] Raw model response:", rawText);

      Sentry.withScope((scope) => {
        scope.setTag("route", "analyze");
        scope.setTag("analysis.mode", mode);
        scope.setContext("claude_response", {
          rawTextPreview: rawText.slice(0, 1000),
          rawTextLength: rawText.length,
          inputLength: preparedText.length,
        });
        scope.setUser({ id: user.id });
        Sentry.captureException(parseError);
      });

      return NextResponse.json(
        {
          error:
            mode === "syllabus"
              ? "Analysis failed while parsing the model response. Try a shorter syllabus section or re-upload."
              : "Analysis failed while parsing the model response. Try a shorter section and try again.",
        },
        { status: 500 }
      );
    }

    const data =
      mode === "assignment"
        ? sanitizeAssignmentAnalysis(parsed)
        : sanitizeSyllabusAnalysis(parsed);

    await markUsed();
    return NextResponse.json({ data, mock: false, truncated: wasTruncated });
  } catch (err) {
    console.error(
      "[analyze] Claude API error:",
      err instanceof Error ? err.message : String(err)
    );
    Sentry.withScope((scope) => {
      scope.setTag("route", "analyze");
      scope.setTag("analysis.mode", mode);
      scope.setUser({ id: user.id });
      Sentry.captureException(err);
    });
    return NextResponse.json(
      {
        error:
          mode === "syllabus"
            ? "The syllabus text was loaded, but analysis failed. Try a shorter section or re-upload."
            : "Failed to analyze. Please try again.",
      },
      { status: 500 }
    );
  }
}
