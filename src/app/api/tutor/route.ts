import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 60;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface CoursePayload {
  name?: string;
  code?: string;
  instructor?: string;
  schedule?: string;
  officeHours?: string;
  semester?: string;
}

interface DeadlinePayload {
  title: string;
  type: string;
  dueDate: string;
  daysUntil: number;
}

interface TopicPayload {
  week: number;
  topic: string;
  chapters?: string;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Not authenticated.", { status: 401 });

  // Check Pro using admin client first (bypasses RLS). Fall back to regular
  // client (uses user's own session + RLS) if admin key is not configured.
  let isPro = false;
  const serviceKeyConfigured = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (serviceKeyConfigured) {
    const admin = createAdminClient();
    const { data: profile, error } = await admin
      .from("profiles").select("is_pro").eq("id", user.id).single();
    if (error) {
      console.error("[tutor] admin profile lookup failed:", error.message);
    }
    if (profile) {
      isPro = profile.is_pro ?? false;
    } else {
      // No row yet — fall through to regular client check below
      console.warn("[tutor] admin found no profile row for user:", user.id);
    }
  }

  // Fallback: use the user's own authenticated Supabase session
  if (!isPro) {
    const { data: profile, error } = await supabase
      .from("profiles").select("is_pro").eq("id", user.id).single();
    if (error) {
      console.error("[tutor] regular profile lookup failed:", error.message);
    }
    isPro = profile?.is_pro ?? false;
    if (!serviceKeyConfigured) {
      console.warn("[tutor] SUPABASE_SERVICE_ROLE_KEY not set — using anon client for Pro check");
    }
  }

  console.log(`[tutor] user=${user.id} is_pro=${isPro} serviceKey=${serviceKeyConfigured}`);

  if (!isPro) return new Response("Pro required.", { status: 403 });

  const {
    messages,
    courseContext,
    courseInfo,
    upcomingDeadlines,
    weeklyTopics,
    tutorMode,
  } = await req.json() as {
    messages: ChatMessage[];
    courseContext?: string;
    courseInfo?: CoursePayload;
    upcomingDeadlines?: DeadlinePayload[];
    weeklyTopics?: TopicPayload[];
    tutorMode?: "free" | "quiz" | "plan" | "explain";
  };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return new Response("AI not configured.", { status: 500 });

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const sections: string[] = [];

  // Identity
  sections.push(`You are an elite, deeply knowledgeable AI tutor specialising in "${courseInfo?.name ?? "this course"}". Today is ${today}.`);
  sections.push(`You think like a brilliant professor who genuinely cares about student success. You are Socratic, encouraging, and brutally honest when needed.`);

  // Course info
  if (courseInfo) {
    const info = [
      courseInfo.name && `Course: ${courseInfo.name}${courseInfo.code ? ` (${courseInfo.code})` : ""}`,
      courseInfo.instructor && `Instructor: ${courseInfo.instructor}`,
      courseInfo.schedule && `Meets: ${courseInfo.schedule}`,
      courseInfo.semester && `Semester: ${courseInfo.semester}`,
      courseInfo.officeHours && `Office Hours: ${courseInfo.officeHours}`,
    ].filter(Boolean);
    if (info.length) sections.push(`\n=== COURSE DETAILS ===\n${info.join("\n")}`);
  }

  // Syllabus
  if (courseContext?.trim()) {
    sections.push(`\n=== FULL SYLLABUS ===\n${courseContext.slice(0, 6000)}`);
  }

  // Upcoming deadlines
  if (upcomingDeadlines?.length) {
    const lines = upcomingDeadlines.map(d =>
      `- ${d.title} (${d.type}) — due ${d.dueDate}${d.daysUntil === 0 ? " TODAY" : d.daysUntil === 1 ? " TOMORROW" : ` in ${d.daysUntil} days`}`
    );
    sections.push(`\n=== UPCOMING DEADLINES ===\n${lines.join("\n")}`);
  }

  // Weekly topics
  if (weeklyTopics?.length) {
    const lines = weeklyTopics.map(t => `- Week ${t.week}: ${t.topic}${t.chapters ? ` (${t.chapters})` : ""}`);
    sections.push(`\n=== COURSE TOPICS / SCHEDULE ===\n${lines.join("\n")}`);
  }

  // Mode-specific instructions
  const modeInstructions: Record<string, string> = {
    free: `\n=== YOUR ROLE ===
Answer any question about the course clearly, accurately, and helpfully.
- Use the Socratic method when appropriate: ask follow-up questions to deepen understanding
- Reference specific weeks, deadlines, and topics from the syllabus when relevant
- If the student seems confused, diagnose the root misconception first
- Give concrete examples always
- Be direct. Don't pad your answers with filler.
- Use headers (##), bullet points, and bold for clarity
- Flag if something they plan to do is a bad strategy (be honest)`,

    quiz: `\n=== YOUR ROLE: QUIZ MODE ===
You are running an active quiz session. Your job:
1. Ask ONE clear question at a time based on the course material
2. Wait for the student's answer
3. Give immediate, specific feedback: what's right, what's wrong, and WHY
4. If wrong, explain the concept and ask a follow-up to confirm understanding
5. Track difficulty — start medium, go harder if they're getting them right
6. After every 3 questions, give a brief summary of what they've mastered and what to review
7. Mix question types: recall, application, analysis
8. Always reference the specific topic/week from the syllabus`,

    plan: `\n=== YOUR ROLE: STUDY PLAN MODE ===
You are building a personalised, realistic study plan. Your job:
1. First ask: "When is your next deadline or exam?" if not already clear from context
2. Build a day-by-day plan based on actual deadlines and weekly topics from the syllabus
3. Be specific about WHAT to study each day (not just "review notes")
4. Include: review sessions, practice tests, rest days, and buffer before exams
5. Warn about heavy weeks where multiple deadlines cluster
6. Prioritise by urgency and difficulty
7. Include time estimates per task
8. Format as a clean structured plan with days as headers`,

    explain: `\n=== YOUR ROLE: DEEP EXPLANATION MODE ===
You are explaining concepts with maximum clarity. Your approach:
1. Start with the simplest possible one-sentence summary (the "what")
2. Explain WHY it matters (the "so what")
3. Give a real-world analogy or concrete example
4. Break down any sub-concepts step by step
5. Anticipate and address the most common misconception
6. End with: "The key thing to remember is..." (one sentence)
7. If there's a formula or process, walk through it step by step with an example
8. Use visuals via ASCII/text diagrams when helpful`,
  };

  sections.push(modeInstructions[tutorMode ?? "free"] ?? modeInstructions.free);

  sections.push(`\n=== FORMATTING ===
- Use ## for section headers
- Use **bold** for key terms and important points
- Use bullet lists for enumerations
- Use numbered lists for steps/sequences
- Keep paragraphs short (2-3 sentences max)
- Never give a wall of unbroken text
- After longer responses, add "💬 Follow-up: [one natural follow-up question]" at the very end`);

  const systemPrompt = sections.join("\n");

  const anthropic = new Anthropic({ apiKey });

  try {
    const stream = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 2048,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    console.error("[tutor] error:", err);
    return new Response("Failed to get a response. Please try again.", { status: 500 });
  }
}
