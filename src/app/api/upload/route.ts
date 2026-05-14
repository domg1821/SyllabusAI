import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { limiters, checkRateLimit, tooManyRequests } from "@/lib/ratelimit";

export const maxDuration = 30;
export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

async function extractPdf(buffer: ArrayBuffer): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // Disable worker — not available in Node.js/Edge environment
  pdfjs.GlobalWorkerOptions.workerSrc = "";

  const doc = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
  }).promise;

  const parts: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    parts.push(pageText);
  }
  return parts.join("\n\n");
}

async function extractDocx(buffer: ArrayBuffer): Promise<string> {
  const mammoth = await import("mammoth");
  const nodeBuffer = Buffer.from(new Uint8Array(buffer));
  const result = await mammoth.extractRawText({ buffer: nodeBuffer });
  return result.value;
}

async function extractImage(bytes: Uint8Array, mediaType: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return "[Demo mode] ANTHROPIC_API_KEY is not set. In production, the text from your image would appear here.";
  }

  const base64 = Buffer.from(bytes).toString("base64");
  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType as "image/png" | "image/jpeg" | "image/webp",
              data: base64,
            },
          },
          {
            type: "text",
            text: "Extract all text from this image exactly as written. Preserve the original structure, headings, lists, and formatting as much as possible using plain text. Return only the extracted text — no commentary, no explanation, no markdown formatting beyond what was in the original image.",
          },
        ],
      },
    ],
  });

  return response.content[0].type === "text" ? response.content[0].text : "";
}

export async function POST(req: NextRequest) {
  // Rate limit authenticated users at 30 requests/hour
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const check = await checkRateLimit(limiters.upload, `user:${user.id}`);
    if (check.blocked) return tooManyRequests(check.reset, "hour");
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 10 MB." },
      { status: 413 }
    );
  }

  const type = file.type;
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  try {
    let text = "";

    if (type === "application/pdf") {
      text = await extractPdf(buffer);
    } else if (
      type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      type === "application/msword" ||
      file.name.endsWith(".docx") ||
      file.name.endsWith(".doc")
    ) {
      text = await extractDocx(buffer);
    } else if (IMAGE_TYPES.has(type)) {
      text = await extractImage(bytes, type);
    } else if (type === "text/plain" || file.name.endsWith(".txt")) {
      text = new TextDecoder().decode(bytes);
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a PDF, DOCX, image (PNG/JPG/WebP), or TXT file." },
        { status: 415 }
      );
    }

    text = text.trim();
    if (!text) {
      return NextResponse.json(
        { error: "No text could be extracted from this file. Please try a different file or paste the text directly." },
        { status: 422 }
      );
    }

    return NextResponse.json({ text });
  } catch (err) {
    console.error("[upload] extraction error:", err);
    return NextResponse.json(
      { error: "Failed to extract text from the file. Please try again or paste the text directly." },
      { status: 500 }
    );
  }
}
