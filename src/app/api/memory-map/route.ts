import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";
import { limiters, checkRateLimit, tooManyRequests } from "@/lib/ratelimit";

export const maxDuration = 30;

export type ConceptImportance = "core" | "supporting" | "detail";

export interface MemoryConcept {
  term: string;
  definition: string;
  connections: string[];
  importance: ConceptImportance;
}

const SYSTEM_PROMPT = `You are an expert educator creating a visual concept map. Return ONLY a valid JSON object — no markdown fences, no extra text.

JSON schema:
{
  "concepts": [
    {
      "term": "short name",
      "definition": "1–2 clear sentences",
      "connections": ["other term name"],
      "importance": "core"
    }
  ]
}

Rules:
- concepts: 8–12 items total
- importance levels: "core" (2–3 foundational concepts), "supporting" (3–4 concepts that build on core), "detail" (3–5 specific facts/nuances)
- term: 1–4 words max
- definition: plain language, no bullet points
- connections: list other terms from this same map that this concept links to`;

function mockConcepts(topic: string): MemoryConcept[] {
  return [
    { term: "Core Definition", definition: `The fundamental meaning of ${topic}, establishing what it is and what it is not.`, connections: ["Key Principles", "Real-World Applications"], importance: "core" },
    { term: "Key Principles", definition: `The foundational rules that govern how ${topic} works in theory and in practice.`, connections: ["Core Definition", "Methods & Techniques"], importance: "core" },
    { term: "Historical Origins", definition: `Where ${topic} came from and the key thinkers or events that shaped it.`, connections: ["Core Definition"], importance: "supporting" },
    { term: "Methods & Techniques", definition: `The systematic approaches used to apply ${topic} to real problems.`, connections: ["Key Principles", "Real-World Applications"], importance: "supporting" },
    { term: "Real-World Applications", definition: `Specific domains and scenarios where ${topic} is actively used today.`, connections: ["Core Definition", "Methods & Techniques"], importance: "supporting" },
    { term: "Related Concepts", definition: `Adjacent ideas that share overlap with ${topic} and are often confused with it.`, connections: ["Core Definition"], importance: "supporting" },
    { term: "Common Misconceptions", definition: `The most frequent wrong beliefs students hold about ${topic} and why they arise.`, connections: ["Key Principles"], importance: "detail" },
    { term: "Key Vocabulary", definition: `Specialized terms essential for discussing ${topic} accurately in an exam context.`, connections: ["Core Definition", "Key Principles"], importance: "detail" },
    { term: "Limitations & Edge Cases", definition: `Situations where ${topic} doesn't apply cleanly or requires modification.`, connections: ["Key Principles", "Real-World Applications"], importance: "detail" },
  ];
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const check = await checkRateLimit(limiters.practiceTest, `user:${user.id}`);
    if (check.blocked) return tooManyRequests(check.reset, "hour");
  }

  let topic: string;
  let chapterName: string;
  let courseContext: string;
  try {
    const body = await req.json();
    topic = String(body.topic ?? "").trim();
    chapterName = String(body.chapterName ?? topic).trim();
    courseContext = String(body.courseContext ?? "").slice(0, 1000).trim();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!topic) return NextResponse.json({ error: "Topic is required." }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ concepts: mockConcepts(topic), mock: true });

  try {
    const client = new Anthropic({ apiKey });
    const contextClause = courseContext ? `\nCourse context: ${courseContext}` : "";

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1400,
      system: SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: `Create a memory map for: "${chapterName}"${contextClause}

Return 8–12 concepts organized by importance (core/supporting/detail). Return ONLY valid JSON.`,
      }],
    }, { timeout: 25_000 });

    const rawText = response.content[0].type === "text" ? response.content[0].text : "";
    try {
      let cleaned = rawText.trim();
      if (cleaned.startsWith("```")) cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      const parsed = JSON.parse(start !== -1 && end !== -1 ? cleaned.slice(start, end + 1) : cleaned);
      const concepts: MemoryConcept[] = Array.isArray(parsed.concepts)
        ? parsed.concepts
            .map((c: Record<string, unknown>) => ({
              term: String(c.term ?? ""),
              definition: String(c.definition ?? ""),
              connections: Array.isArray(c.connections) ? c.connections.map(String) : [],
              importance: (["core", "supporting", "detail"].includes(String(c.importance))
                ? c.importance : "supporting") as ConceptImportance,
            }))
            .filter((c: MemoryConcept) => c.term && c.definition)
        : mockConcepts(topic);

      return NextResponse.json({ concepts, mock: false });
    } catch (parseErr) {
      Sentry.captureException(parseErr);
      return NextResponse.json({ concepts: mockConcepts(topic), mock: true });
    }
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json({ error: "Failed to generate memory map. Please try again." }, { status: 500 });
  }
}
