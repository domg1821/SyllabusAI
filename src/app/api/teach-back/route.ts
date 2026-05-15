import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";
import { limiters, checkRateLimit, tooManyRequests } from "@/lib/ratelimit";

export const maxDuration = 30;

function mockPrompt(topic: string): string {
  return `Explain "${topic}" as if you're teaching it to a 10-year-old who has never heard of it before. Cover what it is, how it works with a real-life example, and why it matters. Aim for 150–250 words — clear, simple, no jargon.`;
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
    courseContext = String(body.courseContext ?? "").slice(0, 800).trim();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!topic) return NextResponse.json({ error: "Topic is required." }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ prompt: mockPrompt(topic), mock: true });

  try {
    const client = new Anthropic({ apiKey });
    const contextClause = courseContext ? `\nCourse context: ${courseContext}` : "";

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 250,
      messages: [{
        role: "user",
        content: `Write a Feynman Technique teaching prompt for the topic: "${chapterName}"${contextClause}

Ask the student to explain the concept as if teaching a 10-year-old. Mention 2-3 specific aspects they should cover (the core mechanism, a real-world example, why it matters). Keep it to 2-3 sentences. Return ONLY the prompt text, nothing else.`,
      }],
    }, { timeout: 20_000 });

    const prompt = response.content[0].type === "text" ? response.content[0].text.trim() : mockPrompt(topic);
    return NextResponse.json({ prompt, mock: false });
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json({ prompt: mockPrompt(topic), mock: true });
  }
}
