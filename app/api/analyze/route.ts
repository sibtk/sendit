import { NextRequest, NextResponse } from "next/server";
import { parseAuctionUrl } from "@/lib/platforms";
import { scrapeCopart } from "@/lib/scraper-copart";
import { scrapeIAA } from "@/lib/scraper-iaa";
import { decodeVin, getRecalls } from "@/lib/nhtsa";
import { calculateAuctionFees } from "@/lib/fees";
import { estimateShipping } from "@/lib/shipping";
import { analyzeVehicle } from "@/lib/claude";
import { AnalyzeRequest, FullAnalysis, VinDecode } from "@/lib/types";
import { getPriceData, queueScrape } from "@/lib/vehicle-db";
import { getAuctionComps } from "@/lib/auction-comps";
import { checkRateLimit, logUsage, getUserTier, UserTier } from "@/lib/rate-limit";
import { createServerClient } from "@/lib/auth";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();

    // --- Rate limiting ---
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || null;
    let tier: UserTier = "anonymous";

    if (userId) {
      try { tier = await getUserTier(userId); } catch { tier = "free"; }
    }

    // Get or set fingerprint for anonymous users
    const cookieStore = await cookies();
    let fingerprint = cookieStore.get("sendit_fp")?.value || null;
    if (!fingerprint && !userId) {
      fingerprint = randomUUID();
      // We'll set the cookie in the response
    }

    // Check rate limit
    try {
      const limit = await checkRateLimit(userId, fingerprint, tier);
      if (!limit.allowed) {
        const message = userId
          ? `You've used all ${limit.limit} analyses this week. ${tier === "free" ? "Upgrade to Pro for unlimited." : "Resets " + new Date(limit.resetAt).toLocaleDateString()}`
          : `Free analysis used this week. Sign up for 5/week free.`;
        return NextResponse.json(
          { error: message, rateLimited: true, tier, resetAt: limit.resetAt },
          { status: 429 }
        );
      }
    } catch (e) {
      // If rate limit check fails (no DB), let it through
      console.error("Rate limit check failed:", e);
    }

    if (!body.url && !body.pastedText) {
      return NextResponse.json(
        { error: "Please provide a URL or paste listing text" },
        { status: 400 }
      );
    }

    // Step 1: Parse URL and detect platform
    let parsed = body.url ? parseAuctionUrl(body.url) : null;

    if (!parsed && !body.pastedText) {
      return NextResponse.json(
        {
          error:
            "Could not detect platform from URL. Please use a Copart or IAA listing URL.",
        },
        { status: 400 }
      );
    }

    // Step 2: Scrape listing data
    let listing;
    if (parsed) {
      if (parsed.platform === "copart") {
        listing = await scrapeCopart(parsed.lotNumber);
      } else {
        listing = await scrapeIAA(parsed.lotNumber);
      }
    } else {
      // TODO: Parse from pasted text using Claude
      return NextResponse.json(
        { error: "Paste mode not yet implemented. Please provide a URL." },
        { status: 400 }
      );
    }

    // Step 3: Decode VIN (if available)
    let vinDecode: VinDecode | null = null;
    if (listing.vin && !listing.vinMasked) {
      try {
        vinDecode = await decodeVin(listing.vin);
        // Enrich listing with VIN decode data
        if (vinDecode.hp && !listing.hp) listing.hp = vinDecode.hp;
        if (vinDecode.trim && !listing.trim) listing.trim = vinDecode.trim;
        if (vinDecode.bodyClass && !listing.bodyStyle)
          listing.bodyStyle = vinDecode.bodyClass;
      } catch (e) {
        console.error("VIN decode failed:", e);
      }
    }

    // Step 4: Check recalls
    let recalls: Awaited<ReturnType<typeof getRecalls>> = [];
    const make = vinDecode?.make || listing.make;
    const model = vinDecode?.model || listing.model;
    const year = vinDecode?.year || listing.year;
    if (make && model && year) {
      try {
        recalls = await getRecalls(make, model, year);
      } catch (e) {
        console.error("Recalls check failed:", e);
      }
    }

    // Step 5: Calculate auction fees
    // Priority: user's max bid > user's current bid > listing's current bid > listing's BIN
    // ACV is NOT a purchase price — it's the insurance value of the car clean.
    // If we only have ACV, let Claude estimate a reasonable auction purchase price.
    let bidAmount =
      body.maxBid || body.currentBid || listing.currentBid || listing.buyItNow || 0;

    // If no bid info at all, tell Claude to estimate (don't use ACV as purchase price)
    const effectiveBid: number | null = bidAmount || null;
    const fees = calculateAuctionFees(listing.platform, bidAmount || 0);

    // Step 6: Estimate shipping
    let shipping: ReturnType<typeof estimateShipping> | null = null;
    try {
      shipping = estimateShipping(
        listing.branchCoordinates,
        listing.sellingBranch || `${listing.branchCity}, ${listing.branchState}`,
        body.userZip || "77001",
        body.userLocation || "Houston, TX"
      );
    } catch (e) {
      console.error("Shipping estimation failed:", e);
    }

    // Build extra prompt context for missing data
    let damageNotes = body.damageNotes || null;
    if (!effectiveBid) {
      const noBidNote =
        "NOTE: No bid amount was available from the listing. Estimate a reasonable bid based on the vehicle's condition, market value, and damage level.";
      damageNotes = damageNotes ? `${damageNotes}\n\n${noBidNote}` : noBidNote;
    }
    if (!shipping) {
      const noShipNote =
        "NOTE: Shipping cost could not be estimated. Use a reasonable estimate for the distance, or note it as an unknown cost.";
      damageNotes = damageNotes
        ? `${damageNotes}\n\n${noShipNote}`
        : noShipNote;
    }

    // Step 7: Check vehicle price database for real market data
    const vehicleMake = vinDecode?.make || listing.make;
    const vehicleModel = vinDecode?.model || listing.model;
    const vehicleYear = vinDecode?.year || listing.year;
    const vehicleTrim = vinDecode?.trim || listing.trim;

    let priceData = null;
    try {
      priceData = await getPriceData(vehicleYear, vehicleMake, vehicleModel, vehicleTrim);
      // Also try without trim if no results
      if (!priceData && vehicleTrim) {
        priceData = await getPriceData(vehicleYear, vehicleMake, vehicleModel);
      }
    } catch (e) {
      console.error("Price DB lookup failed:", e);
    }

    // If no data, queue a background scrape for next time
    if (!priceData) {
      queueScrape(vehicleYear, vehicleMake, vehicleModel, vehicleTrim).catch(() => {});
    }

    // Step 7b: Get auction comps (real sold/listed prices from IAA + Copart)
    let auctionComps = null;
    try {
      auctionComps = await getAuctionComps(vehicleYear, vehicleMake, vehicleModel);
    } catch (e) {
      console.error("Auction comp search failed:", e);
    }

    // Add auction comp data to prompt
    if (auctionComps && auctionComps.count > 0) {
      const compLines = auctionComps.comps.slice(0, 6).map(c =>
        `${c.platform.toUpperCase()} | $${c.price.toLocaleString()} (${c.priceType}) | ${c.mileage ? c.mileage.toLocaleString() + " mi" : "N/A mi"} | ${c.damage || "N/A"} | ${c.location || "N/A"}`
      ).join("\n");

      const compContext = `\nAUCTION COMPS (real ${auctionComps.count} similar listings from IAA/Copart):\n` +
        `Range: $${auctionComps.priceRange.low.toLocaleString()} - $${auctionComps.priceRange.high.toLocaleString()} | ` +
        `Median: $${auctionComps.median.toLocaleString()} | Avg: $${auctionComps.avg.toLocaleString()}\n` +
        compLines + "\n" +
        `NOTE: Price differences between comps are due to damage severity, title status, mileage, and location. Use these to estimate a realistic auction purchase price.`;
      damageNotes = damageNotes ? `${damageNotes}\n\n${compContext}` : compContext;
    }

    // Add price data to damage notes so Claude sees it
    if (priceData) {
      const priceContext = `\nMARKET DATA (from ${priceData.sample_count} real listings, updated ${new Date(priceData.last_updated).toLocaleDateString()}):\n` +
        `Median: $${priceData.median_price.toLocaleString()} | Range: $${priceData.price_low.toLocaleString()}-$${priceData.price_high.toLocaleString()}\n` +
        `Avg mileage: ${priceData.avg_mileage?.toLocaleString() || "N/A"} | Sources: ${priceData.sources.join(", ")}\n` +
        `USE THESE NUMBERS for market value. This is real data, not an estimate.`;
      damageNotes = damageNotes ? `${damageNotes}\n\n${priceContext}` : priceContext;
    }

    // Step 8: Analyze with Claude (the AI part)
    const analysis = await analyzeVehicle({
      listing,
      vinDecode,
      recalls,
      fees,
      shipping,
      repairProfile: body.repairProfile || "budget_shop",
      userBid: effectiveBid,
      userLocation: body.userLocation || "Houston, TX",
      damageNotes,
    });

    // Step 8: Recalculate fees if Claude estimated a purchase price different from our initial bid
    // This fixes the disconnect where fees are calc'd at $0 but Claude estimates $15K
    let finalFees = fees;
    if (analysis.financials.purchase > 0 && analysis.financials.purchase !== fees.bidAmount) {
      finalFees = calculateAuctionFees(listing.platform, analysis.financials.purchase);
      // Update Claude's analysis to use the correct fees
      analysis.financials.auctionFees.amount = finalFees.totalFees;
      analysis.financials.auctionFees.feePct = Math.round((finalFees.totalFees / analysis.financials.purchase) * 100 * 10) / 10;
      // Recalculate all-in with correct fees
      const repairMid = (analysis.financials.repairs.low + analysis.financials.repairs.high) / 2;
      const shippingCost = analysis.financials.shipping?.estimate || 0;
      const detailing = analysis.financials.detailing || 0;
      analysis.financials.allIn.low = analysis.financials.purchase + finalFees.totalFees + shippingCost + analysis.financials.repairs.low + detailing;
      analysis.financials.allIn.high = analysis.financials.purchase + finalFees.totalFees + shippingCost + analysis.financials.repairs.high + detailing;
      analysis.financials.profit.low = analysis.financials.salePrice.low - analysis.financials.allIn.high;
      analysis.financials.profit.high = analysis.financials.salePrice.high - analysis.financials.allIn.low;
      const expectedAllIn = (analysis.financials.allIn.low + analysis.financials.allIn.high) / 2;
      const expectedProfit = (analysis.financials.profit.low + analysis.financials.profit.high) / 2;
      analysis.financials.roiPct = Math.round((expectedProfit / expectedAllIn) * 100 * 10) / 10;
      analysis.financials.marginPct = analysis.financials.roiPct;
    }

    // Step 9: Validate and correct Claude's math
    // Claude frequently gets math wrong — we fix it deterministically
    const a = analysis;

    // Ensure repair total matches sum of parts + labor + paint
    const partsTotal = a.repairEstimate.parts.reduce((sum, p) => sum + p.costLow, 0);
    const partsTotalHigh = a.repairEstimate.parts.reduce((sum, p) => sum + p.costHigh, 0);
    const computedRepairLow = partsTotal + (a.repairEstimate.laborTotal?.low || 0) + (a.repairEstimate.paint?.low || 0);
    const computedRepairHigh = partsTotalHigh + (a.repairEstimate.laborTotal?.high || 0) + (a.repairEstimate.paint?.high || 0);
    if (Math.abs(computedRepairLow - a.repairEstimate.total.low) > 100) {
      a.repairEstimate.total.low = computedRepairLow;
    }
    if (Math.abs(computedRepairHigh - a.repairEstimate.total.high) > 100) {
      a.repairEstimate.total.high = computedRepairHigh;
    }

    // Recompute all financials from ground truth
    const purchase = a.financials.purchase;
    const auctionFeeAmount = finalFees.totalFees;
    const shipCost = a.financials.shipping?.estimate || 0;
    const detailCost = a.financials.detailing || 0;
    const repLow = a.repairEstimate.total.low;
    const repHigh = a.repairEstimate.total.high;

    a.financials.auctionFees.amount = auctionFeeAmount;
    a.financials.auctionFees.feePct = purchase > 0
      ? Math.round((auctionFeeAmount / purchase) * 1000) / 10
      : 0;

    a.financials.repairs.low = repLow;
    a.financials.repairs.high = repHigh;

    a.financials.allIn.low = purchase + auctionFeeAmount + shipCost + repLow + detailCost;
    a.financials.allIn.high = purchase + auctionFeeAmount + shipCost + repHigh + detailCost;

    a.financials.profit.low = a.financials.salePrice.low - a.financials.allIn.high;
    a.financials.profit.high = a.financials.salePrice.high - a.financials.allIn.low;

    const midAllIn = (a.financials.allIn.low + a.financials.allIn.high) / 2;
    const midProfit = (a.financials.profit.low + a.financials.profit.high) / 2;
    a.financials.roiPct = midAllIn > 0 ? Math.round((midProfit / midAllIn) * 1000) / 10 : 0;
    a.financials.marginPct = a.financials.roiPct;

    // Fix scenarios if they exist
    if (a.financials.scenarios) {
      // Recalc scenario profits using our corrected numbers
      const bestAllIn = purchase + auctionFeeAmount + shipCost + repLow + detailCost;
      const worstAllIn = purchase + auctionFeeAmount + shipCost + Math.round(repHigh * 1.3) + detailCost;
      const expectedAllIn = midAllIn;

      a.financials.scenarios.bestCase.allIn = bestAllIn;
      a.financials.scenarios.bestCase.profit = a.financials.salePrice.high - bestAllIn;
      a.financials.scenarios.bestCase.roi = bestAllIn > 0
        ? Math.round((a.financials.scenarios.bestCase.profit / bestAllIn) * 1000) / 10
        : 0;

      a.financials.scenarios.expected.allIn = Math.round(expectedAllIn);
      a.financials.scenarios.expected.profit = Math.round(midProfit);
      a.financials.scenarios.expected.roi = a.financials.roiPct;

      a.financials.scenarios.worstCase.allIn = worstAllIn;
      a.financials.scenarios.worstCase.profit = a.financials.salePrice.low - worstAllIn;
      a.financials.scenarios.worstCase.roi = worstAllIn > 0
        ? Math.round((a.financials.scenarios.worstCase.profit / worstAllIn) * 1000) / 10
        : 0;
    }

    // Fix bid ceilings — compute from our corrected values
    if (a.bidCeilings) {
      const fixedPerCar = auctionFeeAmount + shipCost + detailCost;
      const midRepair = (repLow + repHigh) / 2;
      const midSell = (a.financials.salePrice.low + a.financials.salePrice.high) / 2;
      // steal = 30%+ ROI → purchase where (sell - purchase - fees - repairs) / (purchase + fees + repairs) > 0.3
      // Solve: profit > 0.3 * allIn → sell - allIn > 0.3 * allIn → sell > 1.3 * allIn
      // allIn = purchase * (1 + feeRate) + fixedPerCar + midRepair
      const effFeeRate = purchase > 0 ? auctionFeeAmount / purchase : 0.08;
      a.bidCeilings.steal = Math.round((midSell / 1.3 - fixedPerCar - midRepair) / (1 + effFeeRate));
      a.bidCeilings.good = Math.round((midSell / 1.2 - fixedPerCar - midRepair) / (1 + effFeeRate));
      a.bidCeilings.fair = Math.round((midSell / 1.1 - fixedPerCar - midRepair) / (1 + effFeeRate));
      a.bidCeilings.walk = Math.round((midSell / 1.05 - fixedPerCar - midRepair) / (1 + effFeeRate));

      // Ensure ceilings are in order and non-negative
      a.bidCeilings.steal = Math.max(0, a.bidCeilings.steal);
      a.bidCeilings.good = Math.max(a.bidCeilings.steal, a.bidCeilings.good);
      a.bidCeilings.fair = Math.max(a.bidCeilings.good, a.bidCeilings.fair);
      a.bidCeilings.walk = Math.max(a.bidCeilings.fair, a.bidCeilings.walk);
    }

    // Recompute max bid recommendation
    const targetProfit = Math.max(2000, midAllIn * 0.15); // At least $2K or 15% ROI
    const effFeeRate2 = purchase > 0 ? auctionFeeAmount / purchase : 0.08;
    const midSell2 = (a.financials.salePrice.low + a.financials.salePrice.high) / 2;
    const midRepair2 = (repLow + repHigh) / 2;
    a.maxBidRecommendation = Math.round(
      (midSell2 - targetProfit - shipCost - detailCost - midRepair2) / (1 + effFeeRate2)
    );
    a.maxBidRecommendation = Math.max(0, a.maxBidRecommendation);

    // Verdict sanity check — override if math clearly says otherwise
    if (a.financials.scenarios) {
      const expProfit = a.financials.scenarios.expected.profit;
      const worstProfit = a.financials.scenarios.worstCase.profit;
      if (expProfit < 0 && a.verdict === "BUY") {
        a.verdict = "PASS";
      } else if (expProfit > 0 && worstProfit > 0 && a.verdict === "PASS") {
        a.verdict = "BUY";
      } else if (expProfit > 0 && worstProfit < -2000 && a.verdict === "BUY") {
        a.verdict = "RISKY";
      }
    }

    // Step 11: Build full analysis result
    const fullAnalysis: FullAnalysis = {
      id: randomUUID(),
      listing,
      vinDecode,
      fees: finalFees,
      shipping,
      analysis,
      repairProfile: body.repairProfile || "budget_shop",
      userLocation: body.userLocation || "Houston, TX",
      createdAt: new Date().toISOString(),
    };

    // Log usage for rate limiting
    try {
      await logUsage(userId, fingerprint, body.url || "");
    } catch (e) {
      console.error("Usage logging failed:", e);
    }

    // Save to DB for signed-in users
    if (userId) {
      try {
        await supabase.from("saved_analyses").insert({
          id: fullAnalysis.id,
          user_id: userId,
          platform: listing.platform,
          lot_number: listing.lotNumber,
          url: listing.url,
          listing_data: listing,
          analysis_result: analysis,
          repair_profile: body.repairProfile || "budget_shop",
          user_location: body.userLocation || "Houston, TX",
        });
      } catch (e) {
        console.error("Failed to save analysis:", e);
      }
    }

    // Set fingerprint cookie for anonymous users
    const response = NextResponse.json(fullAnalysis);
    if (fingerprint && !userId) {
      response.cookies.set("sendit_fp", fingerprint, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365, // 1 year
      });
    }
    return response;
  } catch (error) {
    console.error("Analysis failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Analysis failed",
      },
      { status: 500 }
    );
  }
}
