import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import * as Sentry from "@sentry/nextjs";
import {
  TestQuestion,
  MCQuestion,
  SAQuestion,
  Difficulty,
  QuestionType,
} from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { limiters, checkRateLimit, tooManyRequests } from "@/lib/ratelimit";

export const maxDuration = 60;

// ─── System Prompt ─────────────────────────────────────────────────────────────

const PRACTICE_TEST_SYSTEM_PROMPT = `You are an expert educator and exam question writer. Generate a practice test in JSON format based on the given topic, difficulty, and question type. Return ONLY a valid JSON object — no markdown fences, no explanation, no extra text.

The JSON must conform exactly to this shape:

{
  "questions": [
    // For multiple_choice questions:
    {
      "id": "q1",
      "type": "multiple_choice",
      "question": "Clear, direct question text",
      "options": ["A. First option", "B. Second option", "C. Third option", "D. Fourth option"],
      "correctAnswer": "A",
      "explanation": "Concise explanation of why the correct answer is right, with relevant reasoning or context.",
      "wrongExplanation": "Brief explanation of why each wrong option is incorrect: B is wrong because...; C is wrong because...; D is wrong because..."
    },
    // For short_answer questions:
    {
      "id": "q2",
      "type": "short_answer",
      "question": "Clear question that requires a written response",
      "sampleAnswer": "A comprehensive model answer the student should aim for",
      "explanation": "What makes a good answer and what key concepts should be addressed",
      "keyPoints": ["Key concept 1", "Key concept 2", "Key concept 3"]
    }
  ]
}

Difficulty guidelines:
- easy: Recall and basic comprehension. Straightforward questions about definitions, facts, and simple concepts.
- medium: Application and analysis. Questions require applying concepts to scenarios or analyzing relationships.
- hard: Synthesis and evaluation. Questions require combining multiple concepts, critical thinking, or nuanced understanding.

Question type rules:
- multiple_choice only: ALL questions must have type "multiple_choice"
- short_answer only: ALL questions must have type "short_answer"
- mixed: alternate between "multiple_choice" and "short_answer" (roughly half and half)

Additional rules:
- Each question must directly test the given topic — no generic filler
- Multiple choice: all 4 options must be plausible; exactly one correct answer
- correctAnswer must be exactly one of: "A", "B", "C", "D" — no deviations
- Options must be labeled exactly: "A. text", "B. text", "C. text", "D. text"
- Explanations must be educational — explain the reasoning, not just restate the answer
- Questions must be fully self-contained (no "refer to the passage" or "from the table" references)
- Generate exactly the number of questions requested`;

// ─── Contextual Mock Generator ─────────────────────────────────────────────────

function generateMockQuestions(topic: string, count: number, type: QuestionType): TestQuestion[] {
  const t = topic;

  const mcQuestions: MCQuestion[] = [
    {
      id: "q1",
      type: "multiple_choice",
      question: `What is the most important reason to study ${t}?`,
      options: [
        `A. To build a foundational understanding of core ${t} concepts`,
        `B. To memorize every definition related to ${t}`,
        `C. To avoid applying ${t} in unfamiliar situations`,
        `D. To replace older frameworks with ${t} entirely`,
      ],
      correctAnswer: "A",
      explanation: `Studying ${t} is fundamentally about building conceptual understanding that enables application, analysis, and deeper learning — not rote memorization.`,
      wrongExplanation: `B focuses on memorization over understanding. C is counterproductive — application is the goal. D oversimplifies how academic fields progress.`,
    },
    {
      id: "q2",
      type: "multiple_choice",
      question: `Which approach best supports deep understanding of ${t}?`,
      options: [
        `A. Skipping foundational concepts to focus on advanced ${t} topics`,
        `B. Building from core principles toward more complex applications of ${t}`,
        `C. Studying ${t} definitions in isolation without applying them`,
        `D. Avoiding connections between ${t} and related fields`,
      ],
      correctAnswer: "B",
      explanation: `A bottom-up approach — mastering core principles before tackling complexity — consistently leads to stronger retention and application in ${t}.`,
      wrongExplanation: `A creates gaps that surface later. C is insufficient without practice. D misses how fields reinforce each other.`,
    },
    {
      id: "q3",
      type: "multiple_choice",
      question: `When analyzing a problem in ${t}, what should you do first?`,
      options: [
        `A. Jump directly to the solution using familiar patterns`,
        `B. Identify the core question and relevant constraints before solving`,
        `C. Apply the most complex available technique immediately`,
        `D. Focus only on what is easiest to calculate or describe`,
      ],
      correctAnswer: "B",
      explanation: `In ${t}, identifying the core question and constraints first prevents wasted effort on the wrong approach and ensures the solution actually addresses the problem.`,
      wrongExplanation: `A risks missing nuance. C wastes effort when simpler methods suffice. D can lead to incomplete or misleading answers.`,
    },
    {
      id: "q4",
      type: "multiple_choice",
      question: `Which statement about ${t} is most accurate?`,
      options: [
        `A. ${t} is only relevant in highly specialized academic settings`,
        `B. ${t} has broad applications that connect to real-world problems`,
        `C. ${t} can be fully understood from definitions alone`,
        `D. ${t} requires no prior knowledge to master at an advanced level`,
      ],
      correctAnswer: "B",
      explanation: `Most fields of study, including ${t}, are grounded in practical relevance — connecting abstract concepts to real problems is what makes mastery meaningful.`,
      wrongExplanation: `A underestimates ${t}'s reach. C ignores that application is essential. D contradicts how knowledge builds over time.`,
    },
    {
      id: "q5",
      type: "multiple_choice",
      question: `How should you verify your understanding of a concept in ${t}?`,
      options: [
        `A. Re-read the same definition multiple times`,
        `B. Try to explain the concept in your own words and apply it to a new example`,
        `C. Accept your first interpretation without testing it`,
        `D. Only proceed if you can recall the exact wording from the source`,
      ],
      correctAnswer: "B",
      explanation: `Explaining a concept in your own words and applying it to new situations — the Feynman Technique — is one of the most effective ways to confirm and deepen understanding in any subject, including ${t}.`,
      wrongExplanation: `A is passive learning with low retention. C risks building on faulty assumptions. D confuses memorization with comprehension.`,
    },
  ];

  const saQuestions: SAQuestion[] = [
    {
      id: "sa1",
      type: "short_answer",
      question: `In your own words, explain the key concepts that form the foundation of ${t} and why they matter.`,
      sampleAnswer: `The foundational concepts of ${t} include its core principles, the frameworks or methods used to study it, and the real-world contexts where it applies. A thorough answer connects these elements and explains how understanding them enables deeper analysis and problem-solving.`,
      explanation: `A strong response identifies the most fundamental ideas in ${t}, explains them clearly without jargon, and demonstrates understanding by connecting them to applications or consequences.`,
      keyPoints: [
        `Define the central focus or question that ${t} addresses`,
        `Identify 2–3 core principles or methods`,
        `Explain how these connect to real-world applications`,
        `Describe what distinguishes ${t} from related fields or approaches`,
      ],
    },
    {
      id: "sa2",
      type: "short_answer",
      question: `Describe a situation where understanding ${t} would lead to a meaningfully better decision or outcome than not knowing it.`,
      sampleAnswer: `Understanding ${t} allows a decision-maker to recognize patterns, anticipate consequences, and apply proven frameworks where someone without this knowledge might rely on intuition alone. A concrete example would show how ${t} concepts directly influence the approach, execution, or evaluation of a decision.`,
      explanation: `The best answers are specific — they name a concrete scenario, explain what ${t} contributes, and contrast it with what would happen without that knowledge.`,
      keyPoints: [
        `Identify a realistic scenario where ${t} is relevant`,
        `Explain which concepts from ${t} apply and why`,
        `Contrast the informed vs. uninformed approach`,
        `Note any limitations or edge cases in your example`,
      ],
    },
    {
      id: "sa3",
      type: "short_answer",
      question: `What are the most common mistakes students make when first learning ${t}, and how can they be avoided?`,
      sampleAnswer: `Common mistakes in early study of ${t} include confusing related terms, applying concepts out of context, and focusing on memorization over understanding. These can be avoided by practicing with varied examples, testing comprehension through explanation, and consistently connecting new material to foundational principles.`,
      explanation: `A strong response reflects genuine metacognitive awareness — not just listing mistakes but explaining the underlying reason each one occurs and offering a concrete corrective strategy.`,
      keyPoints: [
        `Identify at least two specific misconceptions or errors`,
        `Explain why each mistake happens (root cause)`,
        `Suggest a concrete strategy to avoid or correct each`,
        `Connect good habits to long-term mastery of ${t}`,
      ],
    },
  ];

  let pool: TestQuestion[];
  if (type === "short_answer") {
    pool = saQuestions;
  } else if (type === "multiple_choice") {
    pool = mcQuestions;
  } else {
    // mixed: interleave MC and SA
    pool = [];
    const maxLen = Math.max(mcQuestions.length, saQuestions.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < mcQuestions.length) pool.push(mcQuestions[i]);
      if (i < saQuestions.length) pool.push(saQuestions[i]);
    }
  }

  return pool.slice(0, count).map((q, i) => ({ ...q, id: `q${i + 1}` }));
}

// ─── Sanitizer ─────────────────────────────────────────────────────────────────

const VALID_ANSWERS = new Set(["A", "B", "C", "D"]);

function sanitizeQuestions(raw: unknown): TestQuestion[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item: unknown, i: number): TestQuestion | null => {
      const q = (item ?? {}) as Record<string, unknown>;
      const id = String(q.id ?? `q${i + 1}`);

      if (q.type === "short_answer") {
        const sa: SAQuestion = {
          id,
          type: "short_answer",
          question: String(q.question ?? ""),
          sampleAnswer: String(q.sampleAnswer ?? ""),
          explanation: String(q.explanation ?? ""),
          keyPoints: Array.isArray(q.keyPoints)
            ? q.keyPoints.map((k) => String(k))
            : [],
        };
        return sa.question ? sa : null;
      }

      // Default to multiple_choice
      const rawAnswer = String(q.correctAnswer ?? "A").toUpperCase().trim();
      const correctAnswer = VALID_ANSWERS.has(rawAnswer) ? rawAnswer : "A";

      const rawOptions = Array.isArray(q.options) ? q.options : [];
      const options =
        rawOptions.length === 4
          ? rawOptions.map((o) => String(o))
          : ["A. Option A", "B. Option B", "C. Option C", "D. Option D"];

      const mc: MCQuestion = {
        id,
        type: "multiple_choice",
        question: String(q.question ?? ""),
        options,
        correctAnswer,
        explanation: String(q.explanation ?? ""),
        wrongExplanation: String(q.wrongExplanation ?? ""),
      };
      return mc.question ? mc : null;
    })
    .filter((q): q is TestQuestion => q !== null);
}

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
  // Rate limit authenticated users at 20 requests/hour
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const check = await checkRateLimit(limiters.practiceTest, `user:${user.id}`);
    if (check.blocked) return tooManyRequests(check.reset, "hour");
  }

  let topic: string;
  let questionCount: number;
  let questionType: QuestionType;
  let difficulty: Difficulty;

  try {
    const body = await req.json();
    topic = String(body.topic ?? "").trim();
    questionCount = Math.min(25, Math.max(1, Number(body.questionCount) || 5));
    questionType =
      body.questionType === "short_answer"
        ? "short_answer"
        : body.questionType === "mixed"
          ? "mixed"
          : "multiple_choice";
    difficulty =
      body.difficulty === "medium"
        ? "medium"
        : body.difficulty === "hard"
          ? "hard"
          : "easy";
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!topic) {
    return NextResponse.json({ error: "Topic is required." }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      data: { questions: generateMockQuestions(topic, questionCount, questionType) },
      mock: true,
    });
  }

  try {
    const client = new Anthropic({ apiKey });

    const typeDescription =
      questionType === "mixed"
        ? "mixed (roughly half multiple_choice, half short_answer)"
        : questionType;

    const userContent = `Generate a practice test with exactly ${questionCount} question${questionCount !== 1 ? "s" : ""} on this topic: "${topic}"

Difficulty: ${difficulty}
Question type: ${typeDescription}

Return ONLY a valid JSON object with a "questions" array containing exactly ${questionCount} question${questionCount !== 1 ? "s" : ""}.`;

    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 4096,
      system: [
        {
          type: "text",
          text: PRACTICE_TEST_SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userContent }],
    });

    const rawText =
      response.content[0].type === "text" ? response.content[0].text : "";

    let questions;
    try {
      const jsonStr = extractJson(rawText);
      const parsed = JSON.parse(jsonStr);
      questions = sanitizeQuestions(
        Array.isArray(parsed.questions) ? parsed.questions : parsed
      );
    } catch (parseError) {
      console.error("[practice-test] Failed to parse model response:", parseError);
      Sentry.withScope((scope) => {
        scope.setTag("route", "practice-test");
        scope.setContext("claude_response", {
          rawTextPreview: rawText.slice(0, 1000),
          topic,
          questionCount,
          questionType,
          difficulty,
        });
        Sentry.captureException(parseError);
      });
      return NextResponse.json(
        { error: "Failed to generate questions. Please try again." },
        { status: 500 }
      );
    }

    if (questions.length === 0) {
      return NextResponse.json(
        { error: "Failed to generate questions. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: { questions }, mock: false });
  } catch (err) {
    console.error("[practice-test] Claude API error:", err);
    Sentry.withScope((scope) => {
      scope.setTag("route", "practice-test");
      scope.setContext("request", { topic, questionCount, questionType, difficulty });
      Sentry.captureException(err);
    });
    return NextResponse.json(
      { error: "Failed to generate test. Please try again." },
      { status: 500 }
    );
  }
}
