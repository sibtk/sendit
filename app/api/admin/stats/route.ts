import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

export async function GET() {
  const sb = getSupabase();

  const [users, scansTotal, scansDaily, userScans, topVehicles, verdicts, platforms, trainingProgress] =
    await Promise.all([
      // User counts by tier
      sb.from("user_profiles").select("id, tier, created_at, referred_by, referral_date, stripe_customer_id"),
      // Total scans
      sb.from("usage_log").select("id", { count: "exact", head: true }),
      // Scans per day (last 30 days)
      sb.from("usage_log").select("created_at").order("created_at", { ascending: false }).limit(500),
      // Per-user scan activity
      sb.from("analytics_events").select("user_id, fingerprint, vehicle_year, vehicle_make, vehicle_model, verdict, platform, created_at").order("created_at", { ascending: false }).limit(500),
      // Top vehicles
      sb
        .from("analytics_events")
        .select("vehicle_make, vehicle_model, vehicle_year")
        .not("vehicle_make", "is", null)
        .limit(500),
      // Verdict distribution
      sb
        .from("analytics_events")
        .select("verdict")
        .not("verdict", "is", null)
        .limit(500),
      // Platform split
      sb
        .from("analytics_events")
        .select("platform")
        .not("platform", "is", null)
        .limit(500),
      // Training progress
      sb.from("saved_analyses").select("training_status"),
    ]);

  // Calculate user stats — exclude admin account from MRR
  const ADMIN_ID = "85896c4a-55a9-4758-a53c-83aa14dd20cf";
  const userList = users.data || [];
  const tierCounts = { free: 0, pro: 0, dealer: 0 };
  const paidCounts = { pro: 0, dealer: 0 };
  for (const u of userList) {
    const t = u.tier as keyof typeof tierCounts;
    if (t in tierCounts) tierCounts[t]++;
    if (u.id !== ADMIN_ID && (t === "pro" || t === "dealer")) {
      paidCounts[t]++;
    }
  }
  const mrr = paidCounts.pro * 30 + paidCounts.dealer * 120;

  // Calculate verdict distribution
  const verdictCounts: Record<string, number> = {};
  for (const v of verdicts.data || []) {
    verdictCounts[v.verdict] = (verdictCounts[v.verdict] || 0) + 1;
  }

  // Calculate platform split
  const platformCounts: Record<string, number> = {};
  for (const p of platforms.data || []) {
    platformCounts[p.platform] = (platformCounts[p.platform] || 0) + 1;
  }

  // Calculate top vehicles
  const vehicleCounts: Record<string, number> = {};
  for (const v of topVehicles.data || []) {
    const key = `${v.vehicle_year} ${v.vehicle_make} ${v.vehicle_model}`;
    vehicleCounts[key] = (vehicleCounts[key] || 0) + 1;
  }
  const topVehicleList = Object.entries(vehicleCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  // Training progress
  const trainingCounts = { pending: 0, approved: 0, corrected: 0, trashed: 0 };
  for (const t of trainingProgress.data || []) {
    const s = (t.training_status || "pending") as keyof typeof trainingCounts;
    if (s in trainingCounts) trainingCounts[s]++;
  }

  // Build user activity — group scans by user
  const userEmails: Record<string, string> = {};
  const userTiers: Record<string, string> = {};
  for (const u of userList) {
    userEmails[u.id] = u.stripe_customer_id ? `user-${u.id.slice(0, 8)}` : `user-${u.id.slice(0, 8)}`;
    userTiers[u.id] = u.tier;
  }

  // Fetch emails from auth (via user_profiles doesn't have email, need to map)
  const { data: authUsers } = await sb.auth.admin.listUsers();
  if (authUsers?.users) {
    for (const au of authUsers.users) {
      if (au.email) userEmails[au.id] = au.email;
    }
  }

  const userActivity: Record<string, { email: string; tier: string; scans: number; lastScan: string; vehicles: string[] }> = {};
  const anonActivity: Record<string, { scans: number; lastScan: string; vehicles: string[] }> = {};

  for (const scan of userScans.data || []) {
    const vehicle = `${scan.vehicle_year || ""} ${scan.vehicle_make || ""} ${scan.vehicle_model || ""}`.trim();
    if (scan.user_id) {
      if (!userActivity[scan.user_id]) {
        userActivity[scan.user_id] = {
          email: userEmails[scan.user_id] || `user-${scan.user_id.slice(0, 8)}`,
          tier: userTiers[scan.user_id] || "free",
          scans: 0,
          lastScan: scan.created_at,
          vehicles: [],
        };
      }
      userActivity[scan.user_id].scans++;
      if (vehicle && userActivity[scan.user_id].vehicles.length < 5) {
        userActivity[scan.user_id].vehicles.push(vehicle);
      }
    } else if (scan.fingerprint) {
      if (!anonActivity[scan.fingerprint]) {
        anonActivity[scan.fingerprint] = { scans: 0, lastScan: scan.created_at, vehicles: [] };
      }
      anonActivity[scan.fingerprint].scans++;
      if (vehicle && anonActivity[scan.fingerprint].vehicles.length < 3) {
        anonActivity[scan.fingerprint].vehicles.push(vehicle);
      }
    }
  }

  const userActivityList = Object.entries(userActivity)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.scans - a.scans);

  return NextResponse.json({
    users: {
      total: userList.length,
      ...tierCounts,
      mrr,
    },
    scans: {
      total: scansTotal.count || 0,
    },
    verdicts: verdictCounts,
    platforms: platformCounts,
    topVehicles: topVehicleList,
    training: trainingCounts,
    userActivity: userActivityList,
    anonScans: Object.keys(anonActivity).length,
  });
}
