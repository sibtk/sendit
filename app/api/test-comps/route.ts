import { NextResponse } from "next/server";
import { getAuctionComps } from "@/lib/auction-comps";

export async function GET() {
  const scraperKey = process.env.SCRAPER_API_KEY;

  try {
    console.log("Test comps: SCRAPER_API_KEY exists:", !!scraperKey);
    console.log("Test comps: key starts with:", scraperKey?.substring(0, 6));

    const comps = await getAuctionComps(2014, "Honda", "Accord");

    return NextResponse.json({
      scraperKeyExists: !!scraperKey,
      compsFound: comps?.count || 0,
      comps: comps?.comps?.slice(0, 3) || [],
      error: null,
    });
  } catch (e) {
    return NextResponse.json({
      scraperKeyExists: !!scraperKey,
      compsFound: 0,
      comps: [],
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
