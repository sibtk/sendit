import { createBrowserClient } from "./auth";
import { Flip, FullAnalysis } from "./types";

function getClient() {
  return createBrowserClient();
}

export async function watchAnalysis(userId: string, analysis: FullAnalysis): Promise<Flip | null> {
  const sb = getClient();
  const { listing, analysis: a } = analysis;

  const { data, error } = await sb.from("flips").insert({
    user_id: userId,
    analysis_id: analysis.id,
    status: "watching",
    vehicle_year: listing.year,
    vehicle_make: listing.make,
    vehicle_model: listing.model,
    platform: listing.platform,
    lot_number: listing.lotNumber,
    listing_url: listing.url || null,
    thumbnail_url: listing.imageUrls?.[0] || null,
    estimated_repair_low: a.repairEstimate.total.low,
    estimated_repair_high: a.repairEstimate.total.high,
    estimated_value_low: a.financials.salePrice.low,
    estimated_value_high: a.financials.salePrice.high,
    auction_fees: a.financials.auctionFees.amount,
    estimated_shipping: a.financials.shipping?.estimate || 0,
    auction_date: listing.auctionDate || null,
  }).select().single();

  if (error) { console.error("Watch failed:", error); return null; }
  return data as Flip;
}

export async function getFlips(userId: string): Promise<Flip[]> {
  const sb = getClient();
  const { data, error } = await sb
    .from("flips")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) { console.error("Get flips failed:", error); return []; }
  return (data || []) as Flip[];
}

export async function getFlipByAnalysisId(userId: string, analysisId: string): Promise<Flip | null> {
  const sb = getClient();
  const { data } = await sb
    .from("flips")
    .select("*")
    .eq("user_id", userId)
    .eq("analysis_id", analysisId)
    .maybeSingle();

  return (data as Flip) || null;
}

export async function markWon(flipId: string, purchasePrice: number, auctionFees: number, shippingCost: number): Promise<boolean> {
  const sb = getClient();
  const { error } = await sb.from("flips").update({
    status: "won",
    purchase_price: purchasePrice,
    auction_fees: auctionFees,
    shipping_cost: shippingCost,
    won_at: new Date().toISOString(),
  }).eq("id", flipId);

  if (error) { console.error("Mark won failed:", error); return false; }
  return true;
}

export async function markSold(flipId: string, salePrice: number, saleChannel: string, repairCost: number, flip: Flip): Promise<boolean> {
  const sb = getClient();
  const totalCosts = (flip.purchase_price || 0) + (flip.auction_fees || 0) + (flip.shipping_cost || 0) + repairCost;
  const profit = salePrice - totalCosts;

  const { error } = await sb.from("flips").update({
    status: "sold",
    sale_price: salePrice,
    sale_channel: saleChannel,
    repair_cost: repairCost,
    actual_profit: profit,
    sold_at: new Date().toISOString(),
  }).eq("id", flipId);

  if (error) { console.error("Mark sold failed:", error); return false; }
  return true;
}

export async function setAuctionDate(flipId: string, date: string): Promise<boolean> {
  const sb = getClient();
  const { error } = await sb.from("flips").update({
    auction_date: date,
  }).eq("id", flipId);
  if (error) { console.error("Set auction date failed:", error); return false; }
  return true;
}

export async function undoWon(flipId: string): Promise<boolean> {
  const sb = getClient();
  const { error } = await sb.from("flips").update({
    status: "watching",
    purchase_price: null,
    auction_fees: null,
    shipping_cost: null,
    won_at: null,
  }).eq("id", flipId);
  if (error) { console.error("Undo won failed:", error); return false; }
  return true;
}

export async function undoSold(flipId: string): Promise<boolean> {
  const sb = getClient();
  const { error } = await sb.from("flips").update({
    status: "won",
    sale_price: null,
    sale_channel: null,
    repair_cost: null,
    actual_profit: null,
    sold_at: null,
  }).eq("id", flipId);
  if (error) { console.error("Undo sold failed:", error); return false; }
  return true;
}

export async function removeFlip(flipId: string): Promise<boolean> {
  const sb = getClient();
  const { error } = await sb.from("flips").delete().eq("id", flipId);
  if (error) { console.error("Remove flip failed:", error); return false; }
  return true;
}

export async function getFlipStats(userId: string) {
  const flips = await getFlips(userId);

  const watching = flips.filter(f => f.status === "watching");
  const won = flips.filter(f => f.status === "won");
  const sold = flips.filter(f => f.status === "sold");

  const totalInvested = won.reduce((s, f) => s + (f.purchase_price || 0) + (f.auction_fees || 0), 0);
  const totalProfit = sold.reduce((s, f) => s + (f.actual_profit || 0), 0);

  return {
    watchingCount: watching.length,
    wonCount: won.length,
    soldCount: sold.length,
    totalInvested,
    totalProfit,
  };
}
