import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";
import { limiters, checkRateLimit, tooManyRequests } from "@/lib/ratelimit";

export const maxDuration = 60;

export type ExamQuestionType = "multiple_choice" | "short_answer" | "essay";

export interface ExamQuestion {
  id: string;
  type: ExamQuestionType;
  question: string;
  points: number;
  options?: string[];
  correctAnswer?: string;
  modelAnswer?: string;
  markingCriteria?: string[];
  rubric?: { criterion: string; marks: number }[];
}

const SYSTEM_PROMPT = `You are a university exam paper writer. Generate exam-level questions at maximum difficulty. Return ONLY a valid JSON object.

JSON schema:
{
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice",
      "question": "...",
      "points": 4,
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correctAnswer": "B",
      "modelAnswer": "B is correct because..."
    },
    {
      "id": "q2",
      "type": "short_answer",
      "question": "...",
      "points": 8,
      "modelAnswer": "A complete 2–3 sentence response covering...",
      "markingCriteria": ["Must mention X", "Must explain Y"]
    },
    {
      "id": "q3",
      "type": "essay",
      "question": "...",
      "points": 20,
      "modelAnswer": "A strong essay would...",
      "rubric": [
        { "criterion": "Thesis and argument clarity", "marks": 6 },
        { "criterion": "Use of evidence and examples", "marks": 8 },
        { "criterion": "Critical analysis depth", "marks": 6 }
      ]
    }
  ]
}

Rules:
- Generate 3–5 questions total based on examType
- multiple_choice: 4-option questions; correctAnswer is "A", "B", "C", or "D"; all options must be plausible
- short_answer: require 2–3 sentence responses; markingCriteria has 2–3 items
- essay: one longer 20-mark question; rubric has 3 criteria; modelAnswer describes what a strong response covers
- All questions must be exam-level difficulty — synthesis, evaluation, application; no pure recall
- Questions must be fully self-contained (no external references needed)`;

function mockQuestions(topic: string, examType: ExamQuestionType): ExamQuestion[] {
  if (examType === "multiple_choice") {
    return [
      { id: "q1", type: "multiple_choice", question: `Which statement BEST describes the core mechanism of ${topic}?`, points: 4, options: [`A. It operates through direct memorization of isolated facts`, `B. It functions via a systematic process that transforms inputs into structured outputs`, `C. It is primarily a descriptive framework with no predictive power`, `D. It applies only in controlled experimental conditions`], correctAnswer: "B", modelAnswer: "B is correct because the core of this concept involves a transformation process rather than mere recall." },
      { id: "q2", type: "multiple_choice", question: `A student applies ${topic} to a new scenario and gets an unexpected result. Which explanation is MOST likely?`, points: 4, options: [`A. The concept is fundamentally flawed`, `B. The student applied it outside its valid scope or missed a key condition`, `C. The scenario is too simple to reveal the concept's complexity`, `D. The result proves that ${topic} is purely theoretical`], correctAnswer: "B", modelAnswer: "B is correct because unexpected results usually indicate boundary conditions or application errors, not concept failure." },
      { id: "q3", type: "multiple_choice", question: `Which example BEST illustrates a real-world application of ${topic}?`, points: 4, options: [`A. A purely abstract mathematical proof with no empirical basis`, `B. A historical event that predates the concept's formalization`, `C. A contemporary system that directly uses the concept's principles to achieve a measurable outcome`, `D. A hypothetical thought experiment designed to disprove the concept`], correctAnswer: "C", modelAnswer: "C describes a genuine application — real-world systems that operationalize the concept's principles." },
    ];
  }
  if (examType === "essay") {
    return [{
      id: "q1", type: "essay",
      question: `Critically evaluate the significance of ${topic} in its field. In your response, you should: (i) explain the core principles and their theoretical basis; (ii) assess the strengths and limitations of ${topic} with reference to at least two concrete examples; (iii) consider how ${topic} relates to or challenges competing frameworks. (20 marks)`,
      points: 20,
      modelAnswer: `A strong essay would open with a clear thesis on ${topic}'s significance, define its core principles precisely, then move into critical evaluation. The body should alternate between strengths (with examples) and limitations (with counterexamples or edge cases). The comparison to competing frameworks should show analytical depth — not just listing alternatives but explaining what ${topic} does differently. Conclusion should synthesize findings into a clear judgment.`,
      rubric: [
        { criterion: "Conceptual clarity and definition", marks: 5 },
        { criterion: "Critical evaluation with evidence", marks: 9 },
        { criterion: "Comparison to competing frameworks", marks: 6 },
      ],
    }];
  }
  // short_answer (default)
  return [
    { id: "q1", type: "short_answer", question: `Explain the primary mechanism of ${topic} and give one specific example of how it operates in practice. (8 marks)`, points: 8, modelAnswer: `${topic} operates through [core mechanism]. A concrete example is [specific scenario] where [mechanism in action]. The key outcome is [result], which demonstrates why the mechanism is important.`, markingCriteria: ["Clear explanation of core mechanism (4 marks)", "Specific and accurate example with explanation of outcome (4 marks)"] },
    { id: "q2", type: "short_answer", question: `Identify two limitations of ${topic} and explain why each matters. (8 marks)`, points: 8, modelAnswer: `First limitation: [limitation A] — this matters because [consequence]. Second limitation: [limitation B] — this is significant because [consequence]. These limitations suggest ${topic} is most reliable when [boundary conditions].`, markingCriteria: ["Two distinct, accurate limitations identified (2 marks each)", "Explanation of why each limitation is significant (2 marks each)"] },
    { id: "q3", type: "short_answer", question: `Compare ${topic} to one alternative approach. When would you prefer each? (9 marks)`, points: 9, modelAnswer: `${topic} differs from [alternative] primarily in [key difference]. ${topic} is preferable when [conditions] because [reason]. The alternative is better when [different conditions] because [reason]. The choice depends on [key decision factor].`, markingCriteria: ["Accurate characterization of both approaches (3 marks)", "Clear reasoning for when each is preferred (3 marks each)"] },
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
  let examType: ExamQuestionType;
  let courseContext: string;
  try {
    const body = await req.json();
    topic = String(body.topic ?? "").trim();
    examType = (["multiple_choice", "short_answer", "essay"].includes(String(body.examType))
      ? body.examType : "short_answer") as ExamQuestionType;
    courseContext = String(body.courseContext ?? "").slice(0, 1000).trim();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!topic) return NextResponse.json({ error: "Topic is required." }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ questions: mockQuestions(topic, examType), mock: true });

  try {
    const client = new Anthropic({ apiKey });
    const contextClause = courseContext ? `\nCourse context: ${courseContext}` : "";
    const typeInstructions = examType === "multiple_choice"
      ? "Generate 4–5 multiple_choice questions only."
      : examType === "essay"
        ? "Generate 1 essay question worth 20 marks with a rubric."
        : "Generate 3 short_answer questions worth 8–9 marks each.";

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: `Generate exam-style questions for: "${topic}"${contextClause}

${typeInstructions}
All questions must be exam-level difficulty. Return ONLY valid JSON.`,
      }],
    }, { timeout: 50_000 });

    const rawText = response.content[0].type === "text" ? response.content[0].text : "";
    try {
      let cleaned = rawText.trim();
      if (cleaned.startsWith("```")) cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      const parsed = JSON.parse(start !== -1 && end !== -1 ? cleaned.slice(start, end + 1) : cleaned);
      const questions: ExamQuestion[] = Array.isArray(parsed.questions)
        ? parsed.questions.map((q: Record<string, unknown>, i: number) => ({
            id: String(q.id ?? `q${i + 1}`),
            type: (["multiple_choice", "short_answer", "essay"].includes(String(q.type)) ? q.type : "short_answer") as ExamQuestionType,
            question: String(q.question ?? ""),
            points: Math.max(1, Number(q.points) || 8),
            options: Array.isArray(q.options) ? q.options.map(String) : undefined,
            correctAnswer: q.correctAnswer ? String(q.correctAnswer) : undefined,
            modelAnswer: q.modelAnswer ? String(q.modelAnswer) : undefined,
            markingCriteria: Array.isArray(q.markingCriteria) ? q.markingCriteria.map(String) : undefined,
            rubric: Array.isArray(q.rubric) ? q.rubric.map((r: Record<string, unknown>) => ({ criterion: String(r.criterion ?? ""), marks: Number(r.marks) || 5 })) : undefined,
          })).filter((q: ExamQuestion) => q.question)
        : mockQuestions(topic, examType);

      return NextResponse.json({ questions, mock: false });
    } catch (parseErr) {
      Sentry.captureException(parseErr);
      return NextResponse.json({ questions: mockQuestions(topic, examType), mock: true });
    }
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json({ error: "Failed to generate exam questions. Please try again." }, { status: 500 });
  }
}
