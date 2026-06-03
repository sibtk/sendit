import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

export async function GET(request: NextRequest) {
  const sb = getSupabase();
  const params = request.nextUrl.searchParams;

  const page = parseInt(params.get("page") || "1");
  const status = params.get("status") || "all";
  const perPage = 20;
  const offset = (page - 1) * perPage;

  let query = sb
    .from("saved_analyses")
    .select("id, platform, url, listing_data, analysis_result, training_status, corrected_result, review_notes, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + perPage - 1);

  if (status !== "all") {
    query = query.eq("training_status", status);
  }

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Shape the response to include key info without sending the full JSONB
  const analyses = (data || []).map((row) => {
    const listing = row.listing_data?.listing || {};
    const analysis = row.analysis_result || row.listing_data?.analysis || {};
    const photos = listing.imageUrls?.slice(0, 4) || [];

    return {
      id: row.id,
      platform: row.platform,
      url: row.url,
      createdAt: row.created_at,
      trainingStatus: row.training_status || "pending",
      reviewNotes: row.review_notes,
      vehicle: {
        year: listing.year,
        make: listing.make,
        model: listing.model,
        mileage: listing.mileage,
      },
      photos,
      verdict: analysis.verdict,
      damageSeverity: analysis.damageAssessment?.severity,
      damageAreas: analysis.damageAssessment?.areas,
      repairEstimate: analysis.repairEstimate?.total,
      profit: analysis.financials?.profit,
      verdictSummary: analysis.verdictSummary,
      // Full data for expanded view
      fullAnalysis: row.corrected_result || row.analysis_result,
      listingData: row.listing_data,
    };
  });

  return NextResponse.json({
    analyses,
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / perPage),
  });
}

export async function PATCH(request: NextRequest) {
  const sb = getSupabase();
  const { id, training_status, corrected_result, review_notes } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (training_status) update.training_status = training_status;
  if (corrected_result) update.corrected_result = corrected_result;
  if (review_notes !== undefined) update.review_notes = review_notes;

  const { error } = await sb
    .from("saved_analyses")
    .update(update)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
