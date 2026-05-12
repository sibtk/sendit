import { createClient } from "@supabase/supabase-js";

// Use service role for rate limiting — bypasses RLS
function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return createClient(url, serviceKey);
}

const ANON_LIMIT = 1;      // per week — one free hit, then sign up
const FREE_LIMIT = 3;      // per week — enough to get hooked, then upgrade
const PRO_LIMIT = 13;      // per week (~50/month)
const DEALER_LIMIT = 250;  // per week (~1000/month) — power users, still 53% margin

export type UserTier = "anonymous" | "free" | "pro" | "dealer";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  tier: UserTier;
  resetAt: string; // ISO date of when limit resets (next Monday)
}

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

function getNextWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? 1 : 8); // Next Monday
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

/**
 * Check if a user/anonymous visitor can run an analysis.
 */
export async function checkRateLimit(
  userId: string | null,
  fingerprint: string | null,
  tier: UserTier
): Promise<RateLimitResult> {
  if (tier === "dealer") {
    return { allowed: true, remaining: DEALER_LIMIT, limit: DEALER_LIMIT, tier, resetAt: "" };
  }

  const limit = tier === "pro" ? PRO_LIMIT : tier === "free" ? FREE_LIMIT : ANON_LIMIT;
  const weekStart = getWeekStart();
  const supabase = createServiceClient();

  // Count analyses this week
  let query = supabase
    .from("usage_log")
    .select("id", { count: "exact", head: true })
    .gte("created_at", weekStart);

  if (userId) {
    query = query.eq("user_id", userId);
  } else if (fingerprint) {
    query = query.eq("fingerprint", fingerprint);
  } else {
    // No way to identify — block
    return { allowed: false, remaining: 0, limit, tier, resetAt: getNextWeekStart() };
  }

  const { count } = await query;
  const used = count || 0;
  const remaining = Math.max(0, limit - used);

  return {
    allowed: remaining > 0,
    remaining,
    limit,
    tier,
    resetAt: getNextWeekStart(),
  };
}

/**
 * Log a usage event after analysis completes.
 */
export async function logUsage(
  userId: string | null,
  fingerprint: string | null,
  analysisUrl: string
) {
  const supabase = createServiceClient();

  await supabase.from("usage_log").insert({
    user_id: userId || null,
    fingerprint: fingerprint || null,
    analysis_url: analysisUrl,
  });
}

/**
 * Get user tier from their profile.
 */
export async function getUserTier(userId: string): Promise<UserTier> {
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("user_profiles")
    .select("tier")
    .eq("id", userId)
    .maybeSingle();

  return (data?.tier as UserTier) || "free";
}
