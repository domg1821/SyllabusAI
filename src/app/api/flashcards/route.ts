import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import * as Sentry from "@sentry/nextjs";
import { Flashcard } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { limiters, checkRateLimit, tooManyRequests } from "@/lib/ratelimit";

export const maxDuration = 30;

const SYSTEM_PROMPT = `You are a study assistant. Return ONLY a valid JSON object — no markdown fences, no explanation.

JSON schema:
{
  "cards": [
    { "front": "Term or question", "back": "Definition or answer", "difficulty": "easy" }
  ]
}

Rules:
- front: concise term, concept, or question (under 15 words)
- back: clear, complete answer (1-3 sentences, plain prose)
- difficulty: "easy" (recall/definitions), "medium" (application), "hard" (synthesis/analysis)
- Cover the most important, testable concepts for the topic
- No duplicate cards; no filler`;

function generateMockCards(topic: string): Flashcard[] {
  return [
    { front: `What is the core definition of ${topic}?`, back: `${topic} refers to the systematic study and application of its foundational principles, involving key concepts that form its theoretical and practical basis.`, difficulty: "easy" },
    { front: `How is ${topic} applied in practice?`, back: `${topic} is applied by identifying relevant principles, analyzing the context, and implementing solutions that align with established frameworks and best practices.`, difficulty: "medium" },
    { front: `What distinguishes ${topic} from related concepts?`, back: `${topic} is distinguished by its specific focus, methodology, and scope — though it shares conceptual overlap with adjacent fields, its unique approach sets it apart.`, difficulty: "hard" },
    { front: `What are the key components of ${topic}?`, back: `The key components include foundational principles, core methodologies, primary use cases, and the contextual factors that determine its applicability.`, difficulty: "medium" },
    { front: `Why is ${topic} important to study?`, back: `Understanding ${topic} builds analytical skills directly applicable to real-world scenarios, forming a foundation for more advanced concepts in the field.`, difficulty: "easy" },
    { front: `What common mistakes arise when first learning ${topic}?`, back: `Common mistakes include confusing related terms, applying concepts out of context, and focusing on memorization over understanding. Practice with varied examples helps avoid these.`, difficulty: "medium" },
    { front: `How does ${topic} connect to real-world problems?`, back: `${topic} connects to real-world problems by providing frameworks for analysis, decision-making, and problem-solving that extend beyond theoretical classroom settings.`, difficulty: "hard" },
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
  let count: number;

  try {
    const body = await req.json();
    topic = String(body.topic ?? "").trim();
    chapterName = String(body.chapterName ?? topic).trim();
    courseContext = String(body.courseContext ?? "").slice(0, 2000).trim();
    count = Math.min(15, Math.max(5, Number(body.count) || 10));
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!topic) {
    return NextResponse.json({ error: "Topic is required." }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ cards: generateMockCards(topic), mock: true });
  }

  try {
    const client = new Anthropic({ apiKey });

    const contextClause = courseContext
      ? `\n\nCourse context:\n${courseContext}`
      : "";

    const userContent = `Generate exactly ${count} flashcards for the topic: "${chapterName}"${contextClause}

Return ONLY a valid JSON object with a "cards" array containing exactly ${count} cards.`;

    const response = await client.messages.create(
      {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userContent }],
      },
      { timeout: 25_000 }
    );

    const rawText = response.content[0].type === "text" ? response.content[0].text : "";

    let cards: Flashcard[];
    try {
      let cleaned = rawText.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
      }
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      const jsonStr = start !== -1 && end !== -1 ? cleaned.slice(start, end + 1) : cleaned;
      const parsed = JSON.parse(jsonStr);
      const raw: unknown[] = Array.isArray(parsed.cards) ? parsed.cards : [];
      cards = raw
        .map((c) => {
          const card = (c ?? {}) as Record<string, unknown>;
          return {
            front: String(card.front ?? ""),
            back: String(card.back ?? ""),
            difficulty: (["easy", "medium", "hard"].includes(String(card.difficulty))
              ? card.difficulty
              : "medium") as Flashcard["difficulty"],
          };
        })
        .filter((c) => c.front && c.back);
    } catch (parseError) {
      Sentry.captureException(parseError);
      return NextResponse.json(
        { error: "Failed to generate flashcards. Please try again." },
        { status: 500 }
      );
    }

    if (cards.length === 0) {
      return NextResponse.json(
        { error: "Failed to generate flashcards. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ cards, mock: false });
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json(
      { error: "Failed to generate flashcards. Please try again." },
      { status: 500 }
    );
  }
}
