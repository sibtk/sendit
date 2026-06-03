import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

const SYSTEM_PROMPT = `You are a salvage car auction analyst. Given vehicle listing data and damage information, provide a comprehensive analysis including: damage assessment with severity and structural risk, itemized repair estimate with parts and labor, market value with comps, financial breakdown with profit scenarios, verdict (BUY/PASS/RISKY), and bid ceiling recommendations. Return structured JSON.`;

export async function GET() {
  const sb = getSupabase();

  const { data, error } = await sb
    .from("saved_analyses")
    .select("listing_data, analysis_result, corrected_result, training_status")
    .in("training_status", ["approved", "corrected"]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: "No approved training data yet" }, { status: 404 });
  }

  const lines = data.map((row) => {
    const listing = row.listing_data?.listing || {};
    const analysis = row.listing_data?.analysis || {};
    const damageDescription = analysis.damageAssessment?.details || "No damage description available";

    // Build the user message from listing data (what the model will receive)
    const userContent = JSON.stringify({
      vehicle: {
        year: listing.year,
        make: listing.make,
        model: listing.model,
        trim: listing.trim,
        engine: listing.engine,
        mileage: listing.mileage,
        drivetrain: listing.drivetrain,
        exteriorColor: listing.exteriorColor,
      },
      auction: {
        platform: listing.platform,
        currentBid: listing.currentBid,
        titleBrand: listing.titleBrand,
        primaryDamage: listing.primaryDamage,
        secondaryDamage: listing.secondaryDamage,
        startCode: listing.startCode,
        sellerType: listing.sellerType,
        location: `${listing.branchCity}, ${listing.branchState}`,
      },
      damageDescription,
      photoCount: listing.imageUrls?.length || 0,
    });

    // The ideal output — corrected if available, otherwise original
    const output = row.corrected_result || row.analysis_result;

    return JSON.stringify({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
        { role: "assistant", content: JSON.stringify(output) },
      ],
    });
  });

  const jsonl = lines.join("\n");

  return new NextResponse(jsonl, {
    headers: {
      "Content-Type": "application/jsonl",
      "Content-Disposition": `attachment; filename="training-data-${new Date().toISOString().split("T")[0]}.jsonl"`,
    },
  });
}
