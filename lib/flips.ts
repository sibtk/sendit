import { createBrowserClient } from "./auth";
import { Flip, FullAnalysis } from "./types";

function trackFlipEvent(eventType: string, flip: Partial<Flip>, userId: string) {
  const sb = createBrowserClient();
  sb.from("analytics_events").insert({
    event_type: eventType,
    user_id: userId,
    platform: flip.platform,
    vehicle_year: flip.vehicle_year,
    vehicle_make: flip.vehicle_make,
    vehicle_model: flip.vehicle_model,
    actual_purchase: flip.purchase_price,
    actual_sale: flip.sale_price,
    actual_repair_cost: flip.repair_cost,
    actual_profit: flip.actual_profit,
  }).then(({ error }) => {
    if (error) console.error(`Analytics ${eventType} failed:`, error);
  });
}

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
  trackFlipEvent("watch", data as Flip, userId);
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
  const { error, data } = await sb.from("flips").update({
    status: "won",
    purchase_price: purchasePrice,
    auction_fees: auctionFees,
    shipping_cost: shippingCost,
    won_at: new Date().toISOString(),
  }).eq("id", flipId).select().single();

  if (error) { console.error("Mark won failed:", error); return false; }
  if (data) trackFlipEvent("won", data as Flip, data.user_id);
  return true;
}

export async function markSold(flipId: string, salePrice: number, saleChannel: string, repairCost: number, flip: Flip): Promise<boolean> {
  const sb = getClient();
  const totalCosts = (flip.purchase_price || 0) + (flip.auction_fees || 0) + (flip.shipping_cost || 0) + repairCost;
  const profit = salePrice - totalCosts;

  const { error, data } = await sb.from("flips").update({
    status: "sold",
    sale_price: salePrice,
    sale_channel: saleChannel,
    repair_cost: repairCost,
    actual_profit: profit,
    sold_at: new Date().toISOString(),
  }).eq("id", flipId).select().single();

  if (error) { console.error("Mark sold failed:", error); return false; }
  if (data) {
    const wonDate = data.won_at ? new Date(data.won_at) : null;
    const daysToSell = wonDate ? Math.floor((Date.now() - wonDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    trackFlipEvent("sold", { ...data as Flip, actual_profit: profit }, data.user_id);
    // Also log days to sell
    const sbTrack = getClient();
    sbTrack.from("analytics_events").update({ days_to_sell: daysToSell }).eq("event_type", "sold").eq("user_id", data.user_id).order("created_at", { ascending: false }).limit(1).then(() => {});
  }
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
