import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });
}

export async function POST(request: NextRequest) {
  try {
    const { analysisId, instruction } = await request.json();

    if (!analysisId || !instruction) {
      return NextResponse.json({ error: "Missing analysisId or instruction" }, { status: 400 });
    }

    const sb = getSupabase();
    const { data: row } = await sb
      .from("saved_analyses")
      .select("analysis_result, corrected_result")
      .eq("id", analysisId)
      .maybeSingle();

    if (!row) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }

    const currentResult = row.corrected_result || row.analysis_result;

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are correcting a salvage car analysis JSON. Apply the user's correction to the analysis and return the COMPLETE corrected JSON. Only change what the user specifies — keep everything else exactly the same. Return valid JSON only.",
        },
        {
          role: "user",
          content: `Correction: ${instruction}\n\nCurrent analysis JSON:\n${JSON.stringify(currentResult)}`,
        },
      ],
      temperature: 0,
    });

    const correctedText = completion.choices[0]?.message?.content;
    if (!correctedText) {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    const correctedResult = JSON.parse(correctedText);

    return NextResponse.json({
      corrected: correctedResult,
      tokensUsed: completion.usage?.total_tokens || 0,
    });
  } catch (error) {
    console.error("Correction error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Correction failed" },
      { status: 500 }
    );
  }
}
