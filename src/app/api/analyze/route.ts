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

const SYLLABUS_SYSTEM_PROMPT = `You are an academic syllabus parser. Return ONLY a valid JSON object — no markdown fences, no explanation, no extra text.

JSON schema:
{
  "course": { "name": "", "code": "", "instructor": "", "semester": "", "credits": 3, "schedule": "", "officeHours": "" },
  "items": [{ "id": "hw1", "title": "", "type": "assignment"|"quiz"|"exam"|"project", "dueDate": "Sep 19, 2025", "points": 50, "priority": "low"|"medium"|"high", "completed": false }],
  "weeklyTopics": [{ "week": 1, "topic": "", "chapters": "" }],
  "studyPlan": [{ "id": "week-1", "weekLabel": "Week 1 — Sep 15–21", "tasks": [{ "id": "w1-t1", "day": "Monday", "date": "Sep 15", "description": "", "relatedItem": "", "notes": "", "estimatedMinutes": 60, "completed": false }] }]
}

Rules:
- priority: "high"=exams/finals, "medium"=major assignments (>30pts or >10% of grade), "low"=routine homework
- weeklyTopics: 3–5 entries with descriptive topic names; infer from course name if no schedule present
- studyPlan: 3–5 weeks, 2–3 tasks per week; descriptions must reference specific topics or chapters from the syllabus
- day: full name (Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday)
- dueDate: human-readable (e.g. "Sep 19, 2025") or "TBD"
- Use empty string for unknown string fields; 0 for unknown numeric fields`;

const ASSIGNMENT_SYSTEM_PROMPT = `You are an academic assignment decoder. Return ONLY a valid JSON object — no markdown fences, no explanation, no extra text.

JSON schema:
{
  "title": "",
  "dueDate": "",
  "whatProfessorWants": "2–3 sentence summary of what the instructor wants",
  "deliverables": ["specific items to submit"],
  "stepByStepPlan": ["5–7 ordered action steps"],
  "suggestedStructure": ["outline sections for the deliverable"],
  "commonMistakes": ["mistakes specific to this assignment type"],
  "rubricNotes": ["grading criteria from the prompt"]
}

Rules:
- stepByStepPlan: 5–7 concrete steps in chronological order
- commonMistakes: specific to this prompt, not generic advice
- rubricNotes: empty array [] if no rubric is present
- Keep all strings concise and student-facing`;

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
  // Top-level guard: any throw that escapes inner handlers (auth, DB, rate-limit,
  // unexpected SDK behaviour) is caught here so the client always gets valid JSON.
  try {
    return await handlePost(req);
  } catch (err) {
    console.error("[analyze] Unhandled error:", err);
    Sentry.captureException(err);
    return Response.json(
      { error: "Internal server error: " + String(err) },
      { status: 500 }
    );
  }
}

async function handlePost(req: NextRequest) {
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

    const response = await client.messages.create(
      {
        model: "claude-haiku-4-5-20251001",
        max_tokens: mode === "syllabus" ? 2000 : 1500,
        system: systemPrompt,
        messages: [{ role: "user", content: userContent }],
      },
      { timeout: 55_000 },
    );

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
    // Log the full error so it's visible in Vercel runtime logs.
    // Anthropic SDK errors carry .status and .error beyond the base .message.
    console.error("[analyze] Claude API error (full):", err);

    let clientMessage: string;
    let httpStatus = 500;

    if (err instanceof Anthropic.APIConnectionTimeoutError) {
      console.error("[analyze] Claude API timed out after 55s");
      clientMessage =
        mode === "syllabus"
          ? "Analysis timed out — your syllabus may be too long. Try pasting just the deadlines and grading sections."
          : "Analysis timed out. Try a shorter assignment description.";
      httpStatus = 504;
    } else if (err instanceof Anthropic.APIError) {
      const status = err.status;
      const apiMsg = (err.error as { error?: { message?: string } } | undefined)?.error?.message ?? err.message;
      console.error(`[analyze] Anthropic APIError status=${status} message=${apiMsg}`);

      if (status === 401) {
        clientMessage = "API key is invalid or missing. Contact support.";
        httpStatus = 502;
      } else if (status === 429) {
        clientMessage = "Our AI provider is rate-limited right now. Please wait a minute and try again.";
        httpStatus = 429;
      } else if (status === 529 || (status >= 500 && status < 600)) {
        clientMessage = "The AI provider is temporarily overloaded. Please try again in a moment.";
        httpStatus = 503;
      } else {
        clientMessage = `Analysis failed (API error ${status}): ${apiMsg}`;
      }
    } else {
      clientMessage =
        mode === "syllabus"
          ? "The syllabus text was loaded, but analysis failed. Please try again."
          : "Failed to analyze. Please try again.";
    }

    Sentry.withScope((scope) => {
      scope.setTag("route", "analyze");
      scope.setTag("analysis.mode", mode);
      scope.setUser({ id: user.id });
      Sentry.captureException(err);
    });

    return NextResponse.json({ error: clientMessage }, { status: httpStatus });
  }
}
