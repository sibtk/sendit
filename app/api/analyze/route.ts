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
import { getRetailComps } from "@/lib/scraper-autotempest";
import { checkRateLimit, logUsage, getUserTier, UserTier } from "@/lib/rate-limit";
import { createServerClient } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { trackAnalysis } from "@/lib/analytics";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const analysisStart = Date.now();
    const body: AnalyzeRequest = await request.json();

    // --- Auth: get user from request header ---
    const supabase = createServerClient();
    const authHeader = request.headers.get("authorization");
    let userId: string | null = null;
    let tier: UserTier = "anonymous";

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    if (userId) {
      try { tier = await getUserTier(userId); } catch { tier = "free"; }
    }

    // Get or set fingerprint for anonymous users
    const cookieStore = await cookies();
    let fingerprint = cookieStore.get("sendit_fp")?.value || null;
    if (!fingerprint && !userId) {
      fingerprint = randomUUID();
    }

    // Check rate limit
    try {
      const limit = await checkRateLimit(userId, fingerprint, tier);
      if (!limit.allowed) {
        const message = userId
          ? `You've used all ${limit.limit} analyses this week. ${tier === "free" ? "Upgrade to Pro for unlimited." : "Resets " + new Date(limit.resetAt).toLocaleDateString()}`
          : `Free analysis used this week. Sign up for 3/week free.`;
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

    // Step 0: Check cache — if we already analyzed this URL recently, return cached result
    const skipCache = body.fresh === true;
    if (body.url && !skipCache) {
      try {
        const { data: cached } = await supabase
          .from("saved_analyses")
          .select("*")
          .eq("url", body.url.trim())
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (cached && cached.analysis_result) {
          // Check freshness — cache valid for 24 hours
          const age = Date.now() - new Date(cached.created_at).getTime();
          // Also check if the cached result has photos — old results before photo support should be re-analyzed
          const hasPhotos = cached.listing_data?.imageUrls?.length > 0;
          if (age < 24 * 60 * 60 * 1000 && hasPhotos) { // 24hr cache, must have photos
            // Return cached — no Claude call, no tokens, instant
            const cachedResult: FullAnalysis = {
              id: cached.id,
              listing: cached.listing_data,
              vinDecode: null,
              fees: { platform: cached.platform, bidAmount: 0, buyerPremium: 0, gateFee: 0, internetBidFee: 0, environmentalFee: 0, titleFee: 0, totalFees: 0, totalWithBid: 0 },
              shipping: null,
              analysis: cached.analysis_result,
              auctionComps: null,
              retailComps: null,
              repairProfile: cached.repair_profile || "budget_shop",
              userLocation: cached.user_location || "Houston, TX",
              createdAt: cached.created_at,
            };

            // Still log usage for rate limiting
            try { await logUsage(userId, fingerprint, body.url); } catch {}

            // Track cached hit
            trackAnalysis({
              userId, fingerprint,
              platform: cached.platform || "",
              vehicleYear: cached.listing_data?.listing?.year || 0,
              vehicleMake: cached.listing_data?.listing?.make || "",
              vehicleModel: cached.listing_data?.listing?.model || "",
              verdict: cached.analysis_result?.verdict || "",
              damageSeverity: cached.analysis_result?.damageAssessment?.severity || "unknown",
              repairEstimateLow: cached.analysis_result?.repairEstimate?.total?.low || 0,
              repairEstimateHigh: cached.analysis_result?.repairEstimate?.total?.high || 0,
              sellPriceLow: cached.analysis_result?.financials?.salePrice?.low || 0,
              sellPriceHigh: cached.analysis_result?.financials?.salePrice?.high || 0,
              profitLow: cached.analysis_result?.financials?.profit?.low || 0,
              profitHigh: cached.analysis_result?.financials?.profit?.high || 0,
              roiPct: cached.analysis_result?.financials?.roiPct || 0,
              photoCount: 0, compCountAuction: 0, compCountRetail: 0,
              hasAcv: false, sellPriceOverridden: false,
              partsCount: cached.analysis_result?.repairEstimate?.parts?.length || 0,
              laborHours: 0,
              analysisTimeMs: Date.now() - analysisStart,
              cached: true,
            });

            const response = NextResponse.json(cachedResult);
            if (fingerprint && !userId) {
              response.cookies.set("sendit_fp", fingerprint, {
                httpOnly: true, secure: process.env.NODE_ENV === "production",
                sameSite: "lax", maxAge: 60 * 60 * 24 * 365,
              });
            }
            return response;
          }
        }
      } catch {
        // Cache miss — continue with full analysis
      }
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
        try {
          listing = await scrapeIAA(parsed.lotNumber);
        } catch (e) {
          // If IAA fails and input was a raw stock number, try Copart as fallback
          const isRawNumber = /^\d{7,9}$/.test(body.url?.trim() || "");
          if (isRawNumber) {
            try {
              listing = await scrapeCopart(parsed.lotNumber);
            } catch {
              throw e; // Both failed, throw original IAA error
            }
          } else {
            throw e;
          }
        }
      }
    } else {
      return NextResponse.json(
        { error: "Paste mode not yet implemented. Please provide a URL." },
        { status: 400 }
      );
    }

    // Start comps searches IMMEDIATELY in parallel — don't await yet
    const compsPromise = getAuctionComps(listing.year, listing.make, listing.model)
      .catch((e) => { console.error("Auction comps failed:", e); return null; });
    const retailPromise = getRetailComps(listing.year, listing.make, listing.model, body.userZip || "77001")
      .catch((e) => { console.error("Retail comps failed:", e); return null; });

    // Steps 3-4: Run VIN decode + recalls in PARALLEL (saves 2-4 seconds)
    const make = listing.make;
    const model = listing.model;
    const year = listing.year;

    const [vinDecodeResult, recallsResult] = await Promise.allSettled([
      listing.vin && !listing.vinMasked ? decodeVin(listing.vin) : Promise.resolve(null),
      make && model && year ? getRecalls(make, model, year) : Promise.resolve([]),
    ]);

    let vinDecode: VinDecode | null = vinDecodeResult.status === "fulfilled" ? vinDecodeResult.value : null;
    const recalls = recallsResult.status === "fulfilled" ? recallsResult.value : [];

    // Enrich listing with VIN decode data
    if (vinDecode) {
      if (vinDecode.hp && !listing.hp) listing.hp = vinDecode.hp;
      if (vinDecode.trim && !listing.trim) listing.trim = vinDecode.trim;
      if (vinDecode.bodyClass && !listing.bodyStyle) listing.bodyStyle = vinDecode.bodyClass;
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

    // Step 7b: Wait for ALL comps — Claude needs both for accurate analysis
    // BidFax + AutoTempest were fired in parallel with VIN decode (step 3)
    // If BidFax is cached in DB, this is instant. If fresh scrape, up to 20s.
    let auctionComps = null;
    let retailComps = null;
    try {
      const [auctionResult, retailResult] = await Promise.allSettled([
        compsPromise,
        retailPromise,
      ]);
      auctionComps = auctionResult.status === "fulfilled" ? auctionResult.value : null;
      retailComps = retailResult.status === "fulfilled" ? retailResult.value : null;
    } catch (e) {
      console.error("Comps failed:", e);
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

    // Add retail comps to prompt
    if (retailComps && retailComps.count > 0) {
      const retailLines = retailComps.comps.slice(0, 6).map(c =>
        `$${c.price.toLocaleString()} | ${c.year} ${c.trim || ""} | ${c.mileage ? c.mileage.toLocaleString() + " mi" : "N/A"} | ${c.sellerType || "?"} | ${c.title || "?"} title | ${c.source || ""}`
      ).join("\n");

      const retailContext = `\nRETAIL MARKET COMPS (${retailComps.count} active listings from Cars.com, CarGurus, Craigslist):\n` +
        `Range: $${retailComps.priceRange.low.toLocaleString()} - $${retailComps.priceRange.high.toLocaleString()} | ` +
        `Median: $${retailComps.median.toLocaleString()} | Avg: $${retailComps.avg.toLocaleString()}\n` +
        retailLines + "\n" +
        `USE THESE for market value estimates. These are REAL asking prices from the retail market right now.`;
      damageNotes = damageNotes ? `${damageNotes}\n\n${retailContext}` : retailContext;
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

    let sellPriceOverridden = false;

    // Step 9: Server-side sell price calculation
    // Claude consistently undervalues cars. We compute sell price from real data.
    {
      const titleImpact = analysis.marketValue.titleImpactPct / 100; // e.g. 25 → 0.25
      const vehicleYear = listing.year || 0;
      const vehicleMileage = listing.mileage || 0;

      let cleanValue: number | null = null;

      // Method 1: ACV is the best single data point (insurance valued THIS exact car)
      const acv = listing.acv || 0;

      // Method 2: Retail comps — but adjust for year/mileage differences
      let adjustedCompMedian: number | null = null;
      if (retailComps && retailComps.count >= 3) {
        // Calculate average year and mileage of comps
        const compAvgYear = retailComps.comps.reduce((s, c) => s + c.year, 0) / retailComps.count;
        const compsWithMiles = retailComps.comps.filter(c => c.mileage && c.mileage > 0);
        const compAvgMiles = compsWithMiles.length > 0
          ? compsWithMiles.reduce((s, c) => s + (c.mileage || 0), 0) / compsWithMiles.length
          : 0;

        let adjustment = 0;

        // Year adjustment: ~$1,500-2,500/year for most cars
        const yearDiff = vehicleYear - compAvgYear;
        if (yearDiff !== 0) {
          const perYear = retailComps.median > 30000 ? 2500 : retailComps.median > 15000 ? 2000 : 1500;
          adjustment += yearDiff * perYear;
        }

        // Mileage adjustment: ~$0.05-0.10/mile
        if (compAvgMiles > 0 && vehicleMileage > 0) {
          const milesDiff = compAvgMiles - vehicleMileage; // positive = subject has fewer miles
          const perMile = retailComps.median > 30000 ? 0.10 : 0.07;
          adjustment += milesDiff * perMile;
        }

        adjustedCompMedian = retailComps.median + adjustment;
      }

      // Blend: ACV (40%) + adjusted comps (60%) when both available
      if (acv > 0 && adjustedCompMedian) {
        cleanValue = Math.round(acv * 0.4 + adjustedCompMedian * 0.6);
      } else if (acv > 0) {
        cleanValue = acv;
      } else if (adjustedCompMedian) {
        cleanValue = Math.round(adjustedCompMedian);
      }

      // Override Claude's sale price if we computed something
      if (cleanValue && cleanValue > 0) {
        const rebuilt = Math.round(cleanValue * (1 - titleImpact));
        // Sale price range: ±10% around rebuilt value
        const saleLow = Math.round(rebuilt * 0.9);
        const saleHigh = Math.round(rebuilt * 1.1);

        // Only override if our calculation is meaningfully different
        const claudeMid = (analysis.financials.salePrice.low + analysis.financials.salePrice.high) / 2;
        const ourMid = (saleLow + saleHigh) / 2;
        if (Math.abs(ourMid - claudeMid) > claudeMid * 0.15) {
          sellPriceOverridden = true;
          console.log(`Sell price override: Claude $${claudeMid.toLocaleString()} → Server $${ourMid.toLocaleString()} (ACV: $${acv.toLocaleString()}, adj comps: $${adjustedCompMedian?.toLocaleString() || "N/A"})`);
          analysis.financials.salePrice.low = saleLow;
          analysis.financials.salePrice.high = saleHigh;
          // Also fix market value to match
          analysis.marketValue.cleanRetail = { low: Math.round(cleanValue * 0.9), high: Math.round(cleanValue * 1.1) };
          analysis.marketValue.adjustedValue = { low: saleLow, high: saleHigh };
        }
      }
    }

    // Step 10: Validate and correct Claude's math
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
    // Detailing cost by vehicle tier
    const luxuryMakes = ["BMW", "MERCEDES-BENZ", "AUDI", "LEXUS", "PORSCHE", "MASERATI", "JAGUAR", "LAND ROVER", "FERRARI", "LAMBORGHINI", "MCLAREN", "BENTLEY", "ROLLS-ROYCE", "ASTON MARTIN", "LOTUS", "ALFA ROMEO", "RIVIAN", "TESLA"];
    const midMakes = ["DODGE", "GMC", "JEEP", "RAM", "GENESIS", "ACURA", "INFINITI", "VOLVO", "BUICK", "CHRYSLER", "LINCOLN", "CADILLAC", "MINI"];
    const makeUp = (listing.make || "").toUpperCase();
    const detailCost = luxuryMakes.includes(makeUp) ? 400
      : midMakes.includes(makeUp) ? 250
      : 200;
    a.financials.detailing = detailCost;

    // Rebuilt inspection — $150 if salvage/rebuilt title, $0 if clean
    const titleLower = (listing.titleStatus || "").toLowerCase() + " " + (listing.titleBrand || "").toLowerCase();
    const needsInspection = titleLower.includes("salvage") || titleLower.includes("rebuilt") || titleLower.includes("rebuildable");
    const inspectionCost = needsInspection ? 150 : 0;
    a.financials.rebuiltInspection = inspectionCost;
    const repLow = a.repairEstimate.total.low;
    const repHigh = a.repairEstimate.total.high;

    a.financials.auctionFees.amount = auctionFeeAmount;
    a.financials.auctionFees.feePct = purchase > 0
      ? Math.round((auctionFeeAmount / purchase) * 1000) / 10
      : 0;

    a.financials.repairs.low = repLow;
    a.financials.repairs.high = repHigh;

    a.financials.allIn.low = purchase + auctionFeeAmount + shipCost + repLow + detailCost + inspectionCost;
    a.financials.allIn.high = purchase + auctionFeeAmount + shipCost + repHigh + detailCost + inspectionCost;

    a.financials.profit.low = a.financials.salePrice.low - a.financials.allIn.high;
    a.financials.profit.high = a.financials.salePrice.high - a.financials.allIn.low;

    const midAllIn = (a.financials.allIn.low + a.financials.allIn.high) / 2;
    const midProfit = (a.financials.profit.low + a.financials.profit.high) / 2;
    a.financials.roiPct = midAllIn > 0 ? Math.round((midProfit / midAllIn) * 1000) / 10 : 0;
    a.financials.marginPct = a.financials.roiPct;

    // Fix scenarios if they exist
    if (a.financials.scenarios) {
      // Recalc scenario profits using our corrected numbers
      const bestAllIn = purchase + auctionFeeAmount + shipCost + repLow + detailCost + inspectionCost;
      const worstAllIn = purchase + auctionFeeAmount + shipCost + Math.round(repHigh * 1.3) + detailCost + inspectionCost;
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
      const fixedPerCar = auctionFeeAmount + shipCost + detailCost + inspectionCost;
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
      auctionComps: auctionComps?.comps.map(c => ({
        platform: c.platform,
        year: c.year,
        price: c.price,
        priceType: c.priceType,
        mileage: c.mileage,
        damage: c.damage,
        titleStatus: c.titleStatus,
        location: c.location,
        seller: (c as unknown as Record<string, string>).seller,
        saleDate: c.saleDate,
        url: c.url,
        image: c.image,
      })) || null,
      retailComps: retailComps?.comps.slice(0, 15).map(c => ({
        year: c.year,
        make: c.make,
        model: c.model,
        trim: c.trim,
        price: c.price,
        mileage: c.mileage,
        sellerType: c.sellerType,
        source: c.source,
        location: c.location,
        title: c.title,
        image: c.image,
        url: c.url || null,
      })) || null,
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

    // Save to DB (for caching + signed-in user history) — use service client to bypass RLS
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
    );
    try {
      await serviceClient.from("saved_analyses").insert({
        id: fullAnalysis.id,
        user_id: userId || null,
        platform: listing.platform,
        lot_number: listing.lotNumber,
        url: listing.url,
        listing_data: fullAnalysis, // store entire result so shared links have everything
        analysis_result: analysis,
        repair_profile: body.repairProfile || "budget_shop",
        user_location: body.userLocation || "Houston, TX",
      });
    } catch (e) {
      console.error("Failed to save analysis:", e);
    }

    // Track analytics
    trackAnalysis({
      userId,
      fingerprint,
      platform: listing.platform,
      vehicleYear: listing.year || 0,
      vehicleMake: listing.make || "",
      vehicleModel: listing.model || "",
      verdict: a.verdict,
      damageSeverity: a.damageAssessment?.severity || "unknown",
      repairEstimateLow: a.repairEstimate.total.low,
      repairEstimateHigh: a.repairEstimate.total.high,
      sellPriceLow: a.financials.salePrice.low,
      sellPriceHigh: a.financials.salePrice.high,
      profitLow: a.financials.profit.low,
      profitHigh: a.financials.profit.high,
      roiPct: a.financials.roiPct,
      photoCount: listing.imageUrls?.length || 0,
      compCountAuction: fullAnalysis.auctionComps?.length || 0,
      compCountRetail: fullAnalysis.retailComps?.length || 0,
      hasAcv: !!(listing.acv && listing.acv > 0),
      sellPriceOverridden,
      partsCount: a.repairEstimate.parts.length,
      laborHours: a.repairEstimate.laborHours || 0,
      analysisTimeMs: Date.now() - analysisStart,
      cached: false,
    });

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
