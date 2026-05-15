import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";
import { limiters, checkRateLimit, tooManyRequests } from "@/lib/ratelimit";

export const maxDuration = 30;

const SYSTEM_PROMPT = `You are an expert tutor evaluating a student's explanation using the Feynman Technique. Return ONLY a valid JSON object — no markdown fences, no extra text.

JSON schema:
{
  "score": 7,
  "strengths": ["string", "string"],
  "gaps": ["string", "string"],
  "improvedExplanation": "string"
}

Rules:
- score: integer 1–10 (1=very poor understanding, 10=exceptionally clear)
- strengths: 2–3 specific things the student got right or explained well
- gaps: 1–3 specific concepts they missed, oversimplified, or stated incorrectly
- improvedExplanation: a model explanation (150–200 words) showing what an excellent answer looks like — simple, concrete, with a real example`;

function mockFeedback(topic: string) {
  return {
    score: 7,
    strengths: [
      "Used accessible language without unnecessary jargon",
      "Included a concrete real-world analogy to illustrate the concept",
    ],
    gaps: [
      `The core mechanism of ${topic} wasn't fully explained — focus on the 'how'`,
      "Missing explanation of when or why this concept matters practically",
    ],
    improvedExplanation: `${topic} is best understood by starting with its purpose: it exists to solve a specific problem. Think of it like [everyday analogy] — where [familiar thing] does [familiar action]. In the same way, ${topic} works by [core mechanism]. The reason this matters is [practical consequence]. A key thing to remember: [most exam-testable fact]. If you get confused, ask yourself: 'What problem was this invented to solve?' That question usually unlocks the whole concept.`,
  };
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const check = await checkRateLimit(limiters.practiceTest, `user:${user.id}`);
    if (check.blocked) return tooManyRequests(check.reset, "hour");
  }

  let topic: string;
  let explanation: string;
  let courseContext: string;
  try {
    const body = await req.json();
    topic = String(body.topic ?? "").trim();
    explanation = String(body.explanation ?? "").slice(0, 3000).trim();
    courseContext = String(body.courseContext ?? "").slice(0, 800).trim();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!topic || !explanation) {
    return NextResponse.json({ error: "Topic and explanation are required." }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ feedback: mockFeedback(topic), mock: true });

  try {
    const client = new Anthropic({ apiKey });
    const contextClause = courseContext ? `\nCourse context: ${courseContext}` : "";

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 700,
      system: SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: `Evaluate this student's Feynman-style explanation of "${topic}"${contextClause}

Student's explanation:
${explanation}

Return ONLY a valid JSON object matching the schema.`,
      }],
    }, { timeout: 25_000 });

    const rawText = response.content[0].type === "text" ? response.content[0].text : "";
    try {
      let cleaned = rawText.trim();
      if (cleaned.startsWith("```")) cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      const parsed = JSON.parse(start !== -1 && end !== -1 ? cleaned.slice(start, end + 1) : cleaned);
      return NextResponse.json({
        feedback: {
          score: Math.min(10, Math.max(1, Number(parsed.score) || 5)),
          strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String) : [],
          gaps: Array.isArray(parsed.gaps) ? parsed.gaps.map(String) : [],
          improvedExplanation: String(parsed.improvedExplanation ?? ""),
        },
        mock: false,
      });
    } catch (parseErr) {
      Sentry.captureException(parseErr);
      return NextResponse.json({ feedback: mockFeedback(topic), mock: true });
    }
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json({ error: "Failed to evaluate explanation. Please try again." }, { status: 500 });
  }
}
