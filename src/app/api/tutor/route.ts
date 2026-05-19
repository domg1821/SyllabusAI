import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  // Require auth
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  // Require Pro
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_pro")
    .eq("id", user.id)
    .single();
  if (!profile?.is_pro) {
    return NextResponse.json({ error: "Pro required." }, { status: 403 });
  }

  const { messages, courseContext, courseName } = await req.json() as {
    messages: ChatMessage[];
    courseContext?: string;
    courseName?: string;
  };

  if (!messages?.length) {
    return NextResponse.json({ error: "No messages provided." }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI not configured." }, { status: 500 });
  }

  const anthropic = new Anthropic({ apiKey });

  const systemPrompt = [
    `You are an expert AI tutor helping a college student with their course${courseName ? ` "${courseName}"` : ""}.`,
    courseContext
      ? `Here is the course syllabus for context:\n\n---\n${courseContext.slice(0, 4000)}\n---`
      : "",
    "",
    "Your job:",
    "- Answer questions about the course material clearly and helpfully",
    "- Explain concepts from the syllabus in plain language",
    "- Help the student prepare for exams by highlighting likely test topics",
    "- Give study tips relevant to this specific course",
    "- Be encouraging but honest about what they need to focus on",
    "",
    "Be concise. Use bullet points and short paragraphs. Avoid long walls of text.",
    "If asked something completely unrelated to studying, gently redirect back to the course.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const text =
      response.content[0]?.type === "text" ? response.content[0].text : "";

    return NextResponse.json({ reply: text });
  } catch (err) {
    console.error("[tutor] error:", err);
    return NextResponse.json(
      { error: "Failed to get a response. Please try again." },
      { status: 500 }
    );
  }
}
