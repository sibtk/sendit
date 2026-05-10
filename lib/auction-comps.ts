/**
 * Get sold auction comps from BidFax via ScraperAPI.
 * BidFax has real final bid prices from both IAA and Copart auctions.
 */

export interface AuctionComp {
  platform: "iaa" | "copart";
  year: number;
  make: string;
  model: string;
  trim: string | null;
  mileage: number | null;
  price: number;
  priceType: "sold" | "buy_now" | "current_bid";
  damage: string | null;
  titleStatus: string | null;
  location: string | null;
  lotNumber: string;
  saleDate?: string;
  url?: string;
  image?: string;
}

export interface CompSummary {
  comps: AuctionComp[];
  count: number;
  priceRange: { low: number; high: number };
  median: number;
  avg: number;
}

export async function getAuctionComps(
  year: number,
  make: string,
  model: string
): Promise<CompSummary | null> {
  try {
    const { searchBidFaxSold } = await import("./scraper-bidfax");
    const comps = await searchBidFaxSold(make, model, year);

    if (comps.length === 0) return null;

    const prices = comps.map((c) => c.price).sort((a, b) => a - b);
    const median = prices[Math.floor(prices.length / 2)];
    const avg = Math.round(prices.reduce((s, p) => s + p, 0) / prices.length);

    return {
      comps,
      count: comps.length,
      priceRange: { low: prices[0], high: prices[prices.length - 1] },
      median,
      avg,
    };
  } catch (e) {
    console.error("Auction comps failed:", e);
    return null;
  }
}
