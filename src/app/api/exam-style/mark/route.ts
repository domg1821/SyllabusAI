import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";
import { limiters, checkRateLimit, tooManyRequests } from "@/lib/ratelimit";
import type { ExamQuestion } from "../route";

export const maxDuration = 60;

export interface QuestionResult {
  id: string;
  score: number;
  maxScore: number;
  feedback: string;
  modelAnswer: string;
}

const SYSTEM_PROMPT = `You are an exam marker. Evaluate student answers and return ONLY a valid JSON object.

JSON schema:
{
  "results": [
    {
      "id": "q1",
      "score": 6,
      "feedback": "Strong explanation of X but missing Y. You correctly identified Z."
    }
  ]
}

Rules:
- score: integer, 0 to the question's max points
- feedback: 1–2 sentences — what was good and what was missing/incorrect
- Be strict but fair — award marks for correct points even if phrasing is imperfect
- For MC: full marks if correct, 0 if wrong
- For short_answer/essay: partial credit based on marking criteria`;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const check = await checkRateLimit(limiters.practiceTest, `user:${user.id}`);
    if (check.blocked) return tooManyRequests(check.reset, "hour");
  }

  let topic: string;
  let questions: ExamQuestion[];
  let answers: Record<string, string>;
  let courseContext: string;
  try {
    const body = await req.json();
    topic = String(body.topic ?? "").trim();
    questions = Array.isArray(body.questions) ? body.questions : [];
    answers = (typeof body.answers === "object" && body.answers !== null) ? body.answers : {};
    courseContext = String(body.courseContext ?? "").slice(0, 600).trim();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!questions.length) return NextResponse.json({ error: "Questions are required." }, { status: 400 });

  // Auto-grade MC immediately
  const mcResults: QuestionResult[] = questions
    .filter((q) => q.type === "multiple_choice")
    .map((q) => {
      const userAnswer = (answers[q.id] ?? "").toUpperCase().trim();
      const correct = q.correctAnswer?.toUpperCase().trim();
      const isCorrect = userAnswer === correct;
      return {
        id: q.id,
        score: isCorrect ? q.points : 0,
        maxScore: q.points,
        feedback: isCorrect
          ? `Correct! ${q.modelAnswer ?? ""}`
          : `Incorrect. The correct answer is ${correct}. ${q.modelAnswer ?? ""}`,
        modelAnswer: q.modelAnswer ?? `The correct answer is ${correct}.`,
      };
    });

  const openEndedQs = questions.filter((q) => q.type !== "multiple_choice");

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || openEndedQs.length === 0) {
    // Mock marking for open-ended
    const mockResults: QuestionResult[] = openEndedQs.map((q) => {
      const answer = answers[q.id] ?? "";
      const partial = answer.length > 50 ? Math.round(q.points * 0.65) : Math.round(q.points * 0.3);
      return {
        id: q.id,
        score: partial,
        maxScore: q.points,
        feedback: answer.length > 50
          ? "Good attempt — you covered the main idea. To score full marks, include more specific examples and engage with the marking criteria explicitly."
          : "Your answer is too brief. Expand on the key mechanisms and provide concrete examples.",
        modelAnswer: q.modelAnswer ?? "A full model answer would cover the key concepts with specific examples.",
      };
    });

    const allResults = [...mcResults, ...mockResults].sort((a, b) => {
      const ai = questions.findIndex((q) => q.id === a.id);
      const bi = questions.findIndex((q) => q.id === b.id);
      return ai - bi;
    });
    const totalScore = allResults.reduce((s, r) => s + r.score, 0);
    const maxScore = allResults.reduce((s, r) => s + r.maxScore, 0);
    return NextResponse.json({ results: allResults, totalScore, maxScore, mock: !apiKey });
  }

  try {
    const client = new Anthropic({ apiKey });
    const contextClause = courseContext ? `\nCourse context: ${courseContext}` : "";

    const questionsText = openEndedQs.map((q) => {
      const criteria = q.markingCriteria?.join("; ") ?? q.rubric?.map((r) => `${r.criterion} (${r.marks} marks)`).join("; ") ?? "";
      return `Question ${q.id} [${q.points} marks] — ${q.type}:
${q.question}
${criteria ? `Marking criteria: ${criteria}` : ""}
Student answer: ${answers[q.id] ?? "(no answer provided)"}`;
    }).join("\n\n");

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1200,
      system: SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: `Mark these answers for the topic: "${topic}"${contextClause}

${questionsText}

Return ONLY valid JSON with a "results" array.`,
      }],
    }, { timeout: 50_000 });

    const rawText = response.content[0].type === "text" ? response.content[0].text : "";
    try {
      let cleaned = rawText.trim();
      if (cleaned.startsWith("```")) cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      const parsed = JSON.parse(start !== -1 && end !== -1 ? cleaned.slice(start, end + 1) : cleaned);

      const markedResults: QuestionResult[] = Array.isArray(parsed.results)
        ? parsed.results.map((r: Record<string, unknown>) => {
            const q = openEndedQs.find((q) => q.id === r.id);
            return {
              id: String(r.id ?? ""),
              score: Math.min(q?.points ?? 0, Math.max(0, Number(r.score) || 0)),
              maxScore: q?.points ?? 0,
              feedback: String(r.feedback ?? ""),
              modelAnswer: q?.modelAnswer ?? "",
            };
          })
        : [];

      const allResults = [...mcResults, ...markedResults].sort((a, b) => {
        const ai = questions.findIndex((q) => q.id === a.id);
        const bi = questions.findIndex((q) => q.id === b.id);
        return ai - bi;
      });
      const totalScore = allResults.reduce((s, r) => s + r.score, 0);
      const maxScore = allResults.reduce((s, r) => s + r.maxScore, 0);
      return NextResponse.json({ results: allResults, totalScore, maxScore, mock: false });
    } catch (parseErr) {
      Sentry.captureException(parseErr);
      return NextResponse.json({ error: "Failed to mark answers. Please try again." }, { status: 500 });
    }
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json({ error: "Failed to mark answers. Please try again." }, { status: 500 });
  }
}
