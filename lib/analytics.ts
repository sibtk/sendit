/**
 * Analytics event logging.
 * All events go to analytics_events table via service role (bypasses RLS).
 * Never blocks the main flow — all calls are fire-and-forget.
 */

import { createClient } from "@supabase/supabase-js";

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return createClient(url, key);
}

interface AnalysisEvent {
  userId?: string | null;
  fingerprint?: string | null;
  platform: string;
  vehicleYear: number;
  vehicleMake: string;
  vehicleModel: string;
  verdict: string;
  damageSeverity: string;
  repairEstimateLow: number;
  repairEstimateHigh: number;
  sellPriceLow: number;
  sellPriceHigh: number;
  profitLow: number;
  profitHigh: number;
  roiPct: number;
  photoCount: number;
  compCountAuction: number;
  compCountRetail: number;
  hasAcv: boolean;
  sellPriceOverridden: boolean;
  partsCount: number;
  laborHours: number;
  analysisTimeMs: number;
  cached: boolean;
}

export function trackAnalysis(event: AnalysisEvent) {
  const sb = getClient();
  sb.from("analytics_events").insert({
    event_type: "analysis",
    user_id: event.userId || null,
    fingerprint: event.fingerprint || null,
    platform: event.platform,
    vehicle_year: event.vehicleYear,
    vehicle_make: event.vehicleMake,
    vehicle_model: event.vehicleModel,
    verdict: event.verdict,
    damage_severity: event.damageSeverity,
    repair_estimate_low: event.repairEstimateLow,
    repair_estimate_high: event.repairEstimateHigh,
    sell_price_low: event.sellPriceLow,
    sell_price_high: event.sellPriceHigh,
    profit_low: event.profitLow,
    profit_high: event.profitHigh,
    roi_pct: event.roiPct,
    photo_count: event.photoCount,
    comp_count_auction: event.compCountAuction,
    comp_count_retail: event.compCountRetail,
    has_acv: event.hasAcv,
    sell_price_overridden: event.sellPriceOverridden,
    parts_count: event.partsCount,
    labor_hours: event.laborHours,
    analysis_time_ms: event.analysisTimeMs,
    cached: event.cached,
  }).then(({ error }) => {
    if (error) console.error("Analytics track failed:", error);
  });
}

export function trackEvent(
  eventType: string,
  data: Record<string, unknown> = {},
  userId?: string | null,
  fingerprint?: string | null
) {
  const sb = getClient();
  sb.from("analytics_events").insert({
    event_type: eventType,
    user_id: userId || null,
    fingerprint: fingerprint || null,
    ...data,
  }).then(({ error }) => {
    if (error) console.error(`Analytics ${eventType} failed:`, error);
  });
}

// Convenience helpers
export function trackSignup(userId: string) {
  trackEvent("signup", {}, userId);
}

export function trackWatch(userId: string, platform: string, make: string, model: string, year: number) {
  trackEvent("watch", { platform, vehicle_make: make, vehicle_model: model, vehicle_year: year }, userId);
}

export function trackWon(userId: string, platform: string, make: string, model: string, purchasePrice: number) {
  trackEvent("won", { platform, vehicle_make: make, vehicle_model: model, actual_purchase: purchasePrice }, userId);
}

export function trackSold(userId: string, data: {
  platform: string;
  make: string;
  model: string;
  purchasePrice: number;
  salePrice: number;
  repairCost: number;
  profit: number;
  daysToSell: number;
}) {
  trackEvent("sold", {
    platform: data.platform,
    vehicle_make: data.make,
    vehicle_model: data.model,
    actual_purchase: data.purchasePrice,
    actual_sale: data.salePrice,
    actual_repair_cost: data.repairCost,
    actual_profit: data.profit,
    days_to_sell: data.daysToSell,
  }, userId);
}

export function trackPartClick(partName: string, shopTarget: string, userId?: string | null) {
  trackEvent("part_click", { part_name: partName, shop_target: shopTarget }, userId);
}
