import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";
import { limiters, checkRateLimit, tooManyRequests } from "@/lib/ratelimit";

export const maxDuration = 30;

const SYSTEM_PROMPT = `You are a patient, clear tutor. Return ONLY a valid JSON object — no markdown fences, no extra text.

JSON schema:
{
  "simpleExplanation": "2-3 sentences. No jargon. Written for someone hearing this for the first time.",
  "realWorldExample": "1 concrete scenario where this concept directly applies. Be specific.",
  "commonMisconceptions": ["string", "string"],
  "keyPoints": ["string", "string", "string"]
}

Rules:
- simpleExplanation: plain language, no bullet points, no academic phrasing
- realWorldExample: a specific, relatable scenario (not "imagine a situation where...")
- commonMisconceptions: 2 items, each a brief statement of the wrong belief followed by the correction
- keyPoints: 2-3 items, each a single crisp sentence of what to remember for an exam`;

function mockExplanation(concept: string) {
  return {
    simpleExplanation: `${concept} is a fundamental idea that describes how a set of related principles work together in a structured way. It forms the basis for understanding more complex topics that build on these foundational elements.`,
    realWorldExample: `A student preparing for an exam on ${concept} would encounter it directly when solving applied problems that require combining theoretical knowledge with practical reasoning.`,
    commonMisconceptions: [
      `Many students think ${concept} only applies in controlled settings — in reality it appears in everyday decisions and real-world systems.`,
      `It's easy to confuse ${concept} with adjacent ideas; the key difference is in the specific mechanism or scope each one addresses.`,
    ],
    keyPoints: [
      `${concept} is defined by its core mechanism, not just its surface appearance.`,
      `Application of ${concept} requires understanding both the conditions under which it applies and when it does not.`,
      `Exam questions on ${concept} often test whether you can identify it in unfamiliar contexts, not just recall the definition.`,
    ],
  };
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const check = await checkRateLimit(limiters.practiceTest, `user:${user.id}`);
    if (check.blocked) return tooManyRequests(check.reset, "hour");
  }

  let concept: string;
  let courseContext: string;

  try {
    const body = await req.json();
    concept = String(body.concept ?? "").trim();
    courseContext = String(body.courseContext ?? "").slice(0, 1500).trim();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!concept) {
    return NextResponse.json({ error: "Concept is required." }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ explanation: mockExplanation(concept), mock: true });
  }

  try {
    const client = new Anthropic({ apiKey });

    const contextClause = courseContext
      ? `\n\nCourse context (use for domain-specific framing):\n${courseContext}`
      : "";

    const userContent = `Explain this concept: "${concept}"${contextClause}

Return ONLY a valid JSON object matching the schema.`;

    const response = await client.messages.create(
      {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 800,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userContent }],
      },
      { timeout: 20_000 }
    );

    const rawText = response.content[0].type === "text" ? response.content[0].text : "";

    let explanation: ReturnType<typeof mockExplanation>;
    try {
      let cleaned = rawText.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
      }
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      const jsonStr = start !== -1 && end !== -1 ? cleaned.slice(start, end + 1) : cleaned;
      const parsed = JSON.parse(jsonStr);
      explanation = {
        simpleExplanation: String(parsed.simpleExplanation ?? ""),
        realWorldExample: String(parsed.realWorldExample ?? ""),
        commonMisconceptions: Array.isArray(parsed.commonMisconceptions)
          ? parsed.commonMisconceptions.map(String)
          : [],
        keyPoints: Array.isArray(parsed.keyPoints)
          ? parsed.keyPoints.map(String)
          : [],
      };
    } catch (parseError) {
      Sentry.captureException(parseError);
      return NextResponse.json(
        { error: "Failed to generate explanation. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ explanation, mock: false });
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json(
      { error: "Failed to generate explanation. Please try again." },
      { status: 500 }
    );
  }
}
