import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const { question, vehicleSummary, analysisContext } = await request.json();

    if (!question?.trim()) {
      return NextResponse.json({ error: "No question" }, { status: 400 });
    }

    const systemPrompt = `You are a car flip expert assistant for sendit scan. Answer questions concisely (2-4 sentences max) about repair costs, mechanical issues, market trends, parts, or anything related to this specific vehicle and flipping cars.

RULES:
- Only answer questions related to cars, auto repair, parts, flipping, auctions, or this specific vehicle.
- If someone asks about anything unrelated to cars (homework, personal advice, coding, etc.), respond: "I can only help with questions about this car and auto repair."
- Give specific dollar ranges when asked about costs.
- Be direct and practical.`;

    const userPrompt = `Vehicle: ${vehicleSummary || "Unknown"}
${analysisContext ? `\nAnalysis context: ${analysisContext}` : ""}

Question: ${question}`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-6-20250620",
      max_tokens: 300,
      temperature: 0,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = response.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") {
      return NextResponse.json({ error: "No response" }, { status: 500 });
    }

    return NextResponse.json({ answer: text.text.trim() });
  } catch (error) {
    console.error("Ask failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}
