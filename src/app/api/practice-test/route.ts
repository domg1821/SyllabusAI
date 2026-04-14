import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  TestQuestion,
  MCQuestion,
  SAQuestion,
  Difficulty,
  QuestionType,
} from "@/lib/types";

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

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const MOCK_QUESTIONS: TestQuestion[] = [
  {
    id: "q1",
    type: "multiple_choice",
    question: "What is the primary function of RAM in a computer?",
    options: [
      "A. Permanently store the operating system",
      "B. Temporarily store data and instructions the CPU is actively using",
      "C. Process arithmetic and logic operations",
      "D. Manage input and output devices",
    ],
    correctAnswer: "B",
    explanation:
      "RAM (Random Access Memory) is volatile memory that temporarily holds data and program instructions the CPU needs right now. It provides fast access compared to permanent storage.",
    wrongExplanation:
      "A is wrong — permanent OS storage is the SSD/HDD's job. C is wrong — that describes the CPU/ALU. D is wrong — that describes the I/O controller or OS.",
  },
  {
    id: "q2",
    type: "multiple_choice",
    question: "Which of the following best describes the Von Neumann architecture?",
    options: [
      "A. A design where data and instructions are stored in separate memory units",
      "B. A design where data and program instructions share the same memory and bus",
      "C. A design that uses parallel processing across multiple CPUs",
      "D. A design optimized for real-time operating systems",
    ],
    correctAnswer: "B",
    explanation:
      "Von Neumann architecture stores both data and instructions in the same memory system, accessed over a single shared bus. This simplicity made it the dominant design for general-purpose computers.",
    wrongExplanation:
      "A describes Harvard architecture (separate instruction/data memory). C describes multi-core or distributed systems. D is not a defining trait of Von Neumann architecture.",
  },
  {
    id: "q3",
    type: "short_answer",
    question:
      "Explain the difference between a process and a thread in an operating system.",
    sampleAnswer:
      "A process is an independent program in execution with its own memory space, file handles, and system resources. A thread is a unit of execution that exists within a process, sharing the process's memory and resources with other threads in the same process. Multiple threads within one process can run concurrently, making them lightweight compared to spawning new processes. The trade-off is that thread errors can corrupt shared memory for all threads, while process isolation prevents one process from crashing another.",
    explanation:
      "A strong answer distinguishes resource ownership (process has its own memory; threads share it), explains concurrency benefits of threads, and touches on isolation vs. overhead trade-offs.",
    keyPoints: [
      "Process has its own memory space; threads share the parent process's memory",
      "Threads are lighter weight to create and context-switch than processes",
      "Threads within a process can communicate directly through shared memory",
      "A crashing thread can bring down the whole process; a crashing process doesn't affect others",
    ],
  },
];

// ─── Sanitizer ─────────────────────────────────────────────────────────────────

const VALID_ANSWERS = new Set(["A", "B", "C", "D"]);

function sanitizeQuestions(raw: unknown): TestQuestion[] {
  if (!Array.isArray(raw)) return MOCK_QUESTIONS;

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
      data: { questions: MOCK_QUESTIONS.slice(0, questionCount) },
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
    const jsonStr = extractJson(rawText);
    const parsed = JSON.parse(jsonStr);
    const questions = sanitizeQuestions(
      Array.isArray(parsed.questions) ? parsed.questions : parsed
    );

    if (questions.length === 0) {
      return NextResponse.json(
        { error: "Failed to generate questions. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: { questions }, mock: false });
  } catch (err) {
    console.error("[practice-test] Claude API error:", err);
    return NextResponse.json(
      { error: "Failed to generate test. Please try again." },
      { status: 500 }
    );
  }
}
