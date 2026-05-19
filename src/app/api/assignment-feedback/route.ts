import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  // Require auth + Pro
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_pro")
    .eq("id", user.id)
    .single();
  if (!profile?.is_pro) {
    return NextResponse.json({ error: "Pro required." }, { status: 403 });
  }

  const { draftText, rubricNotes, title } = await req.json() as {
    draftText: string;
    rubricNotes?: string[];
    title?: string;
  };

  if (!draftText?.trim()) {
    return NextResponse.json({ error: "No draft text provided." }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI not configured." }, { status: 500 });
  }

  const anthropic = new Anthropic({ apiKey });

  const rubricSection = rubricNotes?.length
    ? `\nRubric / grading criteria:\n${rubricNotes.map((r, i) => `${i + 1}. ${r}`).join("\n")}`
    : "";

  const systemPrompt = `You are a rigorous but supportive academic writing coach. A student has shared a draft of their assignment and wants honest, actionable feedback before submitting.

Your job:
1. Identify 2-4 genuine STRENGTHS that are working well
2. Identify 2-4 specific AREAS TO IMPROVE (concrete, actionable — not vague like "be more detailed")
3. Give an honest overall impression in 1-2 sentences
4. If there's a rubric, comment on each criterion briefly

Be constructive but truthful. Don't just praise everything — students need real feedback to improve.

Respond ONLY with valid JSON in this exact format:
{
  "strengths": ["...", "...", "..."],
  "improvements": ["...", "...", "..."],
  "overallImpression": "...",
  "rubricComments": [{"criterion": "...", "comment": "..."}]
}`;

  const userMessage = [
    title ? `Assignment: ${title}` : "",
    rubricSection,
    "",
    "Student's draft:",
    "---",
    draftText.slice(0, 6000),
    "---",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 1200,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const raw =
      response.content[0]?.type === "text" ? response.content[0].text : "";

    // Parse JSON from response
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Could not parse feedback. Please try again." },
        { status: 500 }
      );
    }

    const feedback = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ feedback });
  } catch (err) {
    console.error("[assignment-feedback] error:", err);
    return NextResponse.json(
      { error: "Failed to generate feedback. Please try again." },
      { status: 500 }
    );
  }
}
