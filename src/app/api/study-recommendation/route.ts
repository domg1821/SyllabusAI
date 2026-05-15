import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";
import { limiters, checkRateLimit, tooManyRequests } from "@/lib/ratelimit";

export const maxDuration = 30;

const SYSTEM_PROMPT = `You are a smart study advisor. Return ONLY a valid JSON object — no markdown, no extra text.

JSON schema:
{
  "topPriority": "short label (max 6 words)",
  "reasoning": "2–3 sentences explaining why this is the most urgent thing to study right now",
  "suggestedTime": 60,
  "courseHint": "course name or empty string",
  "chapterHint": "specific topic/chapter or empty string"
}

Rules:
- topPriority: action-oriented label (e.g. "Cram for Organic Chemistry exam", "Review weak practice topics", "Start Calculus study plan")
- reasoning: practical, specific to their situation — reference the actual exam name, days until exam, or weak topic
- suggestedTime: recommended study minutes (30, 45, 60, 90, or 120)
- courseHint and chapterHint: help the UI route the user to the right place`;

interface UpcomingExam {
  title: string;
  courseName: string;
  daysUntil: number;
}

function mockRecommendation(upcomingExams: UpcomingExam[], weakTopics: string[]) {
  if (upcomingExams.length > 0) {
    const exam = upcomingExams[0];
    return {
      topPriority: `Cram for ${exam.title}`,
      reasoning: `Your ${exam.title} is in ${exam.daysUntil} day${exam.daysUntil !== 1 ? "s" : ""}. This should be your top focus right now — review core concepts, work through past-style questions, and make sure you can explain each major topic from scratch.`,
      suggestedTime: exam.daysUntil <= 2 ? 120 : 90,
      courseHint: exam.courseName,
      chapterHint: "",
    };
  }
  if (weakTopics.length > 0) {
    return {
      topPriority: `Review: ${weakTopics[0].slice(0, 40)}`,
      reasoning: `Your practice test history shows you're struggling with "${weakTopics[0]}". Targeted review of this topic will have the highest payoff — try flashcards first, then a focused practice test to confirm you've got it.`,
      suggestedTime: 45,
      courseHint: "",
      chapterHint: weakTopics[0],
    };
  }
  return {
    topPriority: "Start today's study session",
    reasoning: "You're on track — no urgent deadlines or weak spots flagged. Pick a chapter you haven't studied recently and run through flashcards or a practice test to keep momentum going.",
    suggestedTime: 30,
    courseHint: "",
    chapterHint: "",
  };
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const check = await checkRateLimit(limiters.practiceTest, `user:${user.id}`);
    if (check.blocked) return tooManyRequests(check.reset, "hour");
  }

  let upcomingExams: UpcomingExam[];
  let weakTopics: string[];
  let recentSessionCount: number;
  let courseCount: number;

  try {
    const body = await req.json();
    upcomingExams = Array.isArray(body.upcomingExams) ? body.upcomingExams : [];
    weakTopics = Array.isArray(body.weakTopics) ? body.weakTopics.map(String) : [];
    recentSessionCount = Number(body.recentSessionCount) || 0;
    courseCount = Number(body.courseCount) || 0;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ recommendation: mockRecommendation(upcomingExams, weakTopics), mock: true });
  }

  try {
    const client = new Anthropic({ apiKey });

    const examsText = upcomingExams.length > 0
      ? upcomingExams.map((e) => `- ${e.title} (${e.courseName}): ${e.daysUntil} days away`).join("\n")
      : "None";
    const weakText = weakTopics.length > 0 ? weakTopics.join(", ") : "None identified";

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 350,
      system: SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: `Student situation:
- Courses: ${courseCount}
- Study sessions this week: ${recentSessionCount}
- Upcoming exams:\n${examsText}
- Weak topics from practice tests: ${weakText}

What should they study today? Return ONLY valid JSON.`,
      }],
    }, { timeout: 20_000 });

    const rawText = response.content[0].type === "text" ? response.content[0].text : "";
    try {
      let cleaned = rawText.trim();
      if (cleaned.startsWith("```")) cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      const parsed = JSON.parse(start !== -1 && end !== -1 ? cleaned.slice(start, end + 1) : cleaned);
      return NextResponse.json({
        recommendation: {
          topPriority: String(parsed.topPriority ?? ""),
          reasoning: String(parsed.reasoning ?? ""),
          suggestedTime: Math.max(15, Number(parsed.suggestedTime) || 60),
          courseHint: String(parsed.courseHint ?? ""),
          chapterHint: String(parsed.chapterHint ?? ""),
        },
        mock: false,
      });
    } catch (parseErr) {
      Sentry.captureException(parseErr);
      return NextResponse.json({ recommendation: mockRecommendation(upcomingExams, weakTopics), mock: true });
    }
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json({ recommendation: mockRecommendation(upcomingExams, weakTopics), mock: true });
  }
}
