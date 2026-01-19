import { NextResponse } from "next/server";

export const runtime = "nodejs";

const GEMINI_MODEL = "gemini-3-flash-preview";

const systemPrompt = `你是一个你画我猜的 AI。请根据用户的涂鸦返回一个简短名词或短语作为猜测。只输出答案文本，不要输出 JSON、标点解释或多余内容。`;

function buildPayload(imageBase64: string) {
  return {
    contents: [
      {
        role: "user",
        parts: [
          { text: systemPrompt },
          {
            inlineData: {
              mimeType: "image/png",
              data: imageBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 120,
    },
  };
}

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
}

function normalizeGuess(rawText: string) {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return "未识别";
  }

  const guessMatch = trimmed.match(/"guess"\s*:\s*"([^"]+)"/i);
  if (guessMatch?.[1]) {
    return guessMatch[1];
  }

  return trimmed.replace(/^[{\["'`]+|[}\]"'`]+$/g, "");
}

export async function POST(request: Request) {
  const body = await request.json();
  const image = body?.image as string | undefined;

  if (!image) {
    return NextResponse.json({ error: "Missing image" }, { status: 400 });
  }

  const imageBase64 = image.replace(/^data:image\/(png|jpeg);base64,/, "");
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildPayload(imageBase64)),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json({ error: errorText }, { status: 500 });
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const parsed = safeJsonParse(text);

  if (parsed) {
    return NextResponse.json({
      guess: parsed.guess ?? "未识别",
      confidence: Number(parsed.confidence ?? 0.4),
    });
  }

  return NextResponse.json({
    guess: normalizeGuess(text),
    confidence: 0.4,
  });
}
