/**
 * Fetch recently sold / active auction comps for a vehicle from IAA and Copart.
 * Used to give real auction price data instead of Claude guessing purchase price.
 */

export interface AuctionComp {
  platform: "iaa" | "copart";
  year: number;
  make: string;
  model: string;
  trim: string | null;
  mileage: number | null;
  price: number; // sold price or current bid/BIN
  priceType: "sold" | "buy_now" | "current_bid";
  damage: string | null;
  titleStatus: string | null;
  location: string | null;
  lotNumber: string;
}

export interface CompSummary {
  comps: AuctionComp[];
  count: number;
  priceRange: { low: number; high: number };
  median: number;
  avg: number;
}

/**
 * Search IAA for comparable vehicles.
 * Uses the public search page which returns structured data.
 */
async function searchIAAComps(
  year: number,
  make: string,
  model: string
): Promise<AuctionComp[]> {
  try {
    const query = `${year} ${make} ${model}`;
    const url = `https://www.iaai.com/Search?Keyword=${encodeURIComponent(query)}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });

    if (!res.ok) return [];
    const html = await res.text();

    const comps: AuctionComp[] = [];

    // IAA embeds search results as JSON in the page
    // Look for vehicle data patterns
    const stockPattern = /stockNumber['":\s]+(\d{7,9})/gi;
    const pricePattern = /buyNow[Pp]rice['":\s]+(\d+)/gi;
    const bidPattern = /currentBid['":\s]+(\d+)/gi;

    // Try to extract structured listing data from the page
    // IAA puts listing cards with data attributes
    const listingBlocks = html.split(/data-stock-number/gi);

    for (let i = 1; i < listingBlocks.length && comps.length < 10; i++) {
      const block = listingBlocks[i];

      const stockMatch = block.match(/["']?(\d{7,9})["']?/);
      const lot = stockMatch?.[1] || "";

      // Extract price — try buy now first, then current bid
      let price = 0;
      let priceType: "buy_now" | "current_bid" | "sold" = "buy_now";

      const binMatch = block.match(/\$\s*([\d,]+)/);
      if (binMatch) {
        price = parseInt(binMatch[1].replace(/,/g, ""));
      }

      // Extract mileage
      const milesMatch = block.match(/([\d,]+)\s*mi/i);
      const mileage = milesMatch ? parseInt(milesMatch[1].replace(/,/g, "")) : null;

      // Extract damage
      const damageMatch = block.match(/(?:damage|loss)[^:]*:\s*([^<"]+)/i);
      const damage = damageMatch?.[1]?.trim() || null;

      // Extract location
      const locMatch = block.match(/(?:branch|location)[^:]*:\s*([^<"]+)/i);
      const location = locMatch?.[1]?.trim() || null;

      if (price > 0 && lot) {
        comps.push({
          platform: "iaa",
          year,
          make: make.toUpperCase(),
          model: model.toUpperCase(),
          trim: null,
          mileage,
          price,
          priceType,
          damage,
          titleStatus: null,
          location,
          lotNumber: lot,
        });
      }
    }

    return comps;
  } catch (e) {
    console.error("IAA comp search failed:", e);
    return [];
  }
}

/**
 * Search Copart for comparable vehicles using their public API.
 */
async function searchCopartComps(
  year: number,
  make: string,
  model: string
): Promise<AuctionComp[]> {
  try {
    // Copart's public search endpoint
    const url = `https://www.copart.com/public/data/lotdetails/solr/search?query=${year}+${make}+${model}&rows=10`;

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });

    if (!res.ok) return [];

    const data = await res.json();
    const lots = data?.data?.results?.content || data?.data?.lots || [];

    return lots
      .filter((lot: Record<string, unknown>) => lot && (lot.htsmn || lot.bin))
      .slice(0, 10)
      .map((lot: Record<string, unknown>) => ({
        platform: "copart" as const,
        year: (lot.lcy as number) || year,
        make: ((lot.mkn as string) || make).toUpperCase(),
        model: ((lot.mmon as string) || model).toUpperCase(),
        trim: null,
        mileage: (lot.orr as number) || null,
        price: (lot.bin as number) || parseFloat(String(lot.htsmn || 0)) || 0,
        priceType: lot.bin ? ("buy_now" as const) : ("current_bid" as const),
        damage: (lot.dmg as string) || null,
        titleStatus: (lot.sdf as string) || null,
        location: (lot.ynm as string) || null,
        lotNumber: String(lot.ln || lot.lotNumberStr || ""),
      }))
      .filter((c: AuctionComp) => c.price > 0);
  } catch (e) {
    console.error("Copart comp search failed:", e);
    return [];
  }
}

/**
 * Get auction comps from both IAA and Copart, summarize them.
 */
export async function getAuctionComps(
  year: number,
  make: string,
  model: string
): Promise<CompSummary | null> {
  // Search both in parallel
  const [iaaComps, copartComps] = await Promise.all([
    searchIAAComps(year, make, model),
    searchCopartComps(year, make, model),
  ]);

  const allComps = [...iaaComps, ...copartComps];

  if (allComps.length === 0) return null;

  const prices = allComps.map((c) => c.price).sort((a, b) => a - b);
  const median = prices[Math.floor(prices.length / 2)];
  const avg = Math.round(prices.reduce((s, p) => s + p, 0) / prices.length);

  return {
    comps: allComps,
    count: allComps.length,
    priceRange: { low: prices[0], high: prices[prices.length - 1] },
    median,
    avg,
  };
}
