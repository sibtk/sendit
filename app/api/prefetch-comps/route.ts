import { NextRequest, NextResponse } from "next/server";
import { getAuctionComps } from "@/lib/auction-comps";
import { getRetailComps } from "@/lib/scraper-autotempest";

/**
 * Pre-fetch comps for a make/model. Called when user pastes a URL
 * (before they click Analyze) so comps are cached by the time Claude runs.
 * Also used for pre-warming popular cars.
 *
 * If already cached, returns instantly with no API calls.
 */
export async function POST(request: NextRequest) {
  try {
    const { make, model, year, zip } = await request.json();

    if (!make || !model) {
      return NextResponse.json({ error: "Need make and model" }, { status: 400 });
    }

    // Fire both in parallel — they check cache internally before hitting APIs
    const [auction, retail] = await Promise.allSettled([
      getAuctionComps(year || 2020, make, model),
      getRetailComps(year || 2020, make, model, zip || "77001"),
    ]);

    return NextResponse.json({
      auctionComps: auction.status === "fulfilled" ? (auction.value?.count || 0) : 0,
      retailComps: retail.status === "fulfilled" ? (retail.value?.count || 0) : 0,
      cached: true,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
