import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 30;

const VALID_MEDIA_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

export async function POST(req: NextRequest) {
  let image: string;
  let mediaType: string;

  try {
    const body = await req.json();
    image = body.image;
    mediaType = body.mediaType;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!image || !mediaType) {
    return NextResponse.json({ error: "Missing image or mediaType." }, { status: 400 });
  }

  if (!VALID_MEDIA_TYPES.has(mediaType)) {
    return NextResponse.json(
      { error: "Unsupported image type. Use PNG, JPG, or WebP." },
      { status: 400 }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        text: "[Demo mode] ANTHROPIC_API_KEY is not set. In production, the text from your image would appear here.",
        mock: true,
      }
    );
  }

  try {
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
                media_type: mediaType as
                  | "image/png"
                  | "image/jpeg"
                  | "image/webp"
                  | "image/gif",
                data: image,
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

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ text, mock: false });
  } catch (err) {
    console.error("[extract-text] Claude API error:", err);
    return NextResponse.json(
      { error: "Failed to extract text from image. Please try again." },
      { status: 500 }
    );
  }
}
