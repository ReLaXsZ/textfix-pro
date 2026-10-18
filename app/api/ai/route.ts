import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type ActionType =
  | "summary"
  | "fix"
  | "expand"
  | "shorten"
  | "simplify"
  | "elevate";

const PROMPTS: Record<ActionType, (text: string) => string> = {
  summary: (text) =>
    `Summarize the following text concisely in the same language as the input:\n\n${text}`,
  fix: (text) =>
    `Fix any grammar, spelling, and styling errors in the following text. Keep the same language as the input:\n\n${text}`,
  expand: (text) =>
    `Expand, enrich, and improve the following text professionally with detailed content in the same language as the input:\n\n${text}`,
  shorten: (text) =>
    `Shorten and condense the following text while keeping the core meaning, in the same language as the input:\n\n${text}`,
  simplify: (text) =>
    `Rewrite the following text to make it extremely simple, clear, and easy to understand, in the same language as the input:\n\n${text}`,
  elevate: (text) =>
    `Elevate and rewrite the following text into an exquisite, highly professional, and sophisticated style, keeping the same language as the input:\n\n${text}`,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, action } = body as { text?: string; action?: ActionType };

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }
    if (!action || !PROMPTS[action]) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("Missing GEMINI_API_KEY in environment");
      return NextResponse.json(
        { error: "Server misconfigured" },
        { status: 500 }
      );
    }

    const prompt = PROMPTS[action](text);

    // Gemini 3.8 Flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "Unknown error");
      console.error("Gemini API error:", res.status, errText);
      return NextResponse.json(
        { error: `Gemini API returned ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const aiResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      return NextResponse.json(
        { error: "Empty response from Gemini" },
        { status: 502 }
      );
    }

    return NextResponse.json({ result: aiResponse.trim() });
  } catch (err) {
    console.error("AI route error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}