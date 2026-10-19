import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// --- RATE LIMITING (Защита от ботове) ---
// Пазим история в паметта на сървъра (нулира се при рестарт, което е напълно достатъчно)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const LIMIT = 15; // Максимум 15 заявки
const WINDOW_MS = 60 * 1000; // за 1 минута

const PROMPTS: Record<string, (text: string, custom?: string) => string> = {
  summary: (text) => `Summarize the following text concisely in the same language as the input:\n\n${text}`,
  fix: (text) => `Fix any grammar, spelling, and styling errors in the following text. Return ONLY the corrected text. Keep the same language as the input:\n\n${text}`,
  expand: (text) => `Expand, enrich, and improve the following text professionally with detailed content in the same language as the input:\n\n${text}`,
  shorten: (text) => `Shorten and condense the following text while keeping the core meaning, in the same language as the input:\n\n${text}`,
  simplify: (text) => `Rewrite the following text to make it extremely simple, clear, and easy to understand, in the same language as the input:\n\n${text}`,
  elevate: (text) => `Elevate and rewrite the following text into an exquisite, highly professional, and sophisticated style, keeping the same language as the input:\n\n${text}`,
  custom: (text, custom) => `Follow this instruction: "${custom}". Apply it to the following text and respond in the same language as the text:\n\n${text}`,
  fix_explain: (text) => `Fix any grammar, spelling, and styling errors in the following text. Then, explain what you changed and why (keep it brief). Keep the same language as the input:\n\n${text}`,
  detect_fix: (text) => `Analyze the following text specifically for grammatical mistakes (like passive voice, wrong agreement, etc.). Fix ONLY those mistakes and leave the rest of the text untouched. Return the corrected text. Keep the same language as the input:\n\n${text}`,
  meta_desc: (text) => `Generate 3 different SEO-friendly meta descriptions (max 160 characters each) for the following text. Provide them as a numbered list in the same language as the input:\n\n${text}`,
  compare: (text, custom) => `Compare these two texts. Text 1: "${text}". Text 2: "${custom}". Explain the main differences in tone, structure, and content in the same language as the texts.`,
  translate_smart: (text, custom) => `Translate the following text into ${custom}, keeping the original tone, idioms, and professional context intact:\n\n${text}`,
  reading_level: (text) => `Analyze the following text and tell me the reading level (e.g., "Suitable for 12-year-olds", "Academic level") and why. Keep it brief and in the same language as the text:\n\n${text}`,
  generate: (text, custom) => `Write a text about: "${text}". Use the following tone/style: "${custom}". Make it well-structured and ready to use.`,
};

export async function POST(req: NextRequest) {
  try {
    // 1. Проверка за Rate Limit
    const ip = req.headers.get("x-forwarded-for") || "unknown-ip";
    const now = Date.now();
    const rateData = rateLimitMap.get(ip);

    if (rateData) {
      if (now - rateData.lastReset > WINDOW_MS) {
        // Ако е минала 1 минута, нулираме брояча
        rateLimitMap.set(ip, { count: 1, lastReset: now });
      } else {
        // Ако не е минала минута, увеличаваме брояча
        if (rateData.count >= LIMIT) {
          return NextResponse.json({ error: "Too many requests. Please wait a minute." }, { status: 429 });
        }
        rateData.count++;
      }
    } else {
      // Първа заявка от това IP
      rateLimitMap.set(ip, { count: 1, lastReset: now });
    }

    // 2. Изпълнение на AI заявката
    const body = await req.json();
    const { text, action, customInstruction } = body;

    if (!PROMPTS[action]) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const prompt = PROMPTS[action](text || "", customInstruction);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Gemini API error` }, { status: 502 });
    }

    const data = await res.json();
    const aiResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) return NextResponse.json({ error: "Empty response" }, { status: 502 });
    
    return NextResponse.json({ result: aiResponse.trim() });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}