import { supabase } from "./supabase";

// ============================================
// Types
// ============================================

export interface VehicleListing {
  source: "ebay" | "craigslist" | "cargurus" | "cars_com";
  source_id: string;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  mileage: number | null;
  price: number;
  title_status: "clean" | "salvage" | "rebuilt" | "unknown";
  sold: boolean; // true = actual transaction, false = asking price
  sold_date: string | null;
  zip: string | null;
  state: string | null;
  listed_date: string | null;
}

export interface VehiclePriceData {
  year: number;
  make: string;
  model: string;
  trim: string | null;
  sample_count: number;
  median_price: number;
  avg_price: number;
  price_low: number; // 10th percentile
  price_high: number; // 90th percentile
  avg_mileage: number | null;
  avg_days_on_market: number | null;
  price_per_mile: number | null;
  last_updated: string;
  sources: string[];
}

// ============================================
// DB Operations
// ============================================

/**
 * Insert listings in bulk, skip duplicates by source + source_id
 */
export async function insertListings(listings: VehicleListing[]) {
  if (!supabaseUrl() || listings.length === 0) return;

  const rows = listings.map((l) => ({
    ...l,
    make: l.make.toUpperCase(),
    model: l.model.toUpperCase(),
    trim: l.trim?.toUpperCase() || null,
    scraped_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("vehicle_listings")
    .upsert(rows, { onConflict: "source,source_id", ignoreDuplicates: true });

  if (error) console.error("Failed to insert listings:", error.message);
}

/**
 * Get aggregated price data for a specific vehicle.
 * Returns cached aggregates if fresh (<7 days), otherwise null.
 */
export async function getPriceData(
  year: number,
  make: string,
  model: string,
  trim?: string | null
): Promise<VehiclePriceData | null> {
  if (!supabaseUrl()) return null;

  let query = supabase
    .from("vehicle_prices")
    .select("*")
    .eq("year", year)
    .eq("make", make.toUpperCase())
    .eq("model", model.toUpperCase());

  if (trim) {
    query = query.eq("trim", trim.toUpperCase());
  }

  const { data, error } = await query.maybeSingle();

  if (error || !data) return null;

  // Check freshness — stale after 7 days
  const age = Date.now() - new Date(data.last_updated).getTime();
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  if (age > SEVEN_DAYS) return null; // stale, needs refresh

  return data as VehiclePriceData;
}

/**
 * Recompute aggregated prices from raw listings.
 * Call this after inserting new listings.
 */
export async function recomputePrices(
  year: number,
  make: string,
  model: string,
  trim?: string | null
) {
  if (!supabaseUrl()) return;

  const makeUp = make.toUpperCase();
  const modelUp = model.toUpperCase();
  const trimUp = trim?.toUpperCase() || null;

  // Get all clean-title listings for this vehicle from last 90 days
  let query = supabase
    .from("vehicle_listings")
    .select("price, mileage, sold, listed_date, sold_date, source")
    .eq("year", year)
    .eq("make", makeUp)
    .eq("model", modelUp)
    .eq("title_status", "clean")
    .gte("scraped_at", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
    .order("price", { ascending: true });

  if (trimUp) {
    query = query.eq("trim", trimUp);
  }

  const { data: listings, error } = await query;

  if (error || !listings || listings.length < 3) return; // need at least 3 data points

  const prices = listings.map((l) => l.price).sort((a, b) => a - b);
  const mileages = listings.map((l) => l.mileage).filter((m): m is number => m !== null);
  const sources = [...new Set(listings.map((l) => l.source))];

  const median = prices[Math.floor(prices.length / 2)];
  const avg = Math.round(prices.reduce((s, p) => s + p, 0) / prices.length);
  const p10 = prices[Math.floor(prices.length * 0.1)];
  const p90 = prices[Math.floor(prices.length * 0.9)];
  const avgMileage = mileages.length > 0
    ? Math.round(mileages.reduce((s, m) => s + m, 0) / mileages.length)
    : null;

  // Price per mile (depreciation rate)
  const pricePerMile = avgMileage && avgMileage > 0
    ? Math.round((avg / avgMileage) * 100) / 100
    : null;

  const row = {
    year,
    make: makeUp,
    model: modelUp,
    trim: trimUp,
    sample_count: listings.length,
    median_price: median,
    avg_price: avg,
    price_low: p10,
    price_high: p90,
    avg_mileage: avgMileage,
    avg_days_on_market: null, // computed from listing dates later
    price_per_mile: pricePerMile,
    last_updated: new Date().toISOString(),
    sources,
  };

  await supabase
    .from("vehicle_prices")
    .upsert(row, { onConflict: "year,make,model,trim" });
}

/**
 * Queue a background scrape for a vehicle we don't have data for.
 * Stores the request so a cron job can pick it up later.
 */
export async function queueScrape(year: number, make: string, model: string, trim?: string | null) {
  if (!supabaseUrl()) return;

  await supabase.from("scrape_queue").upsert(
    {
      year,
      make: make.toUpperCase(),
      model: model.toUpperCase(),
      trim: trim?.toUpperCase() || null,
      status: "pending",
      requested_at: new Date().toISOString(),
    },
    { onConflict: "year,make,model,trim", ignoreDuplicates: true }
  );
}

// Helper to check if supabase is configured
function supabaseUrl(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
