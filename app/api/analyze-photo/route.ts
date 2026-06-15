import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const { photoUrl, vehicleSummary } = await request.json();

    if (!photoUrl) {
      return NextResponse.json({ error: "No photo URL provided" }, { status: 400 });
    }

    // Download the photo
    const res = await fetch(photoUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Could not download photo" }, { status: 400 });
    }

    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const contentType = res.headers.get("content-type") || "image/jpeg";
    let mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif" = "image/jpeg";
    if (contentType.includes("png")) mediaType = "image/png";
    else if (contentType.includes("webp")) mediaType = "image/webp";

    const response = await client.messages.create({
      model: "claude-sonnet-4-6-20250620",
      max_tokens: 500,
      temperature: 0,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: base64 },
          },
          {
            type: "text",
            text: `Vehicle: ${vehicleSummary || "Unknown"}\n\nWhat damage or issues do you see in this photo? Be specific about parts affected and estimate repair cost impact (low-high range). Keep it to 2-3 sentences max. If no damage is visible, say so.`,
          },
        ],
      }],
    });

    const text = response.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") {
      return NextResponse.json({ error: "No response" }, { status: 500 });
    }

    return NextResponse.json({ finding: text.text.trim() });
  } catch (error) {
    console.error("Photo analysis failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}
