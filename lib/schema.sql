-- Run this in your Supabase SQL editor
-- =============================================
-- AUTH & USER TABLES
-- =============================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  zip text DEFAULT '77001',
  city text DEFAULT 'Houston',
  state text DEFAULT 'TX',
  repair_profile text DEFAULT 'budget_shop',
  custom_labor_rate int,
  parts_preference text DEFAULT 'aftermarket',
  sell_channel text DEFAULT 'private',
  has_dealer_license boolean DEFAULT false,
  iaa_volume_discount boolean DEFAULT false,
  can_do_rebuilt_inspection boolean DEFAULT false,
  max_investment int,
  min_profit int,
  tier text DEFAULT 'free',
  stripe_customer_id text,
  stripe_subscription_id text,
  onboarded boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Saved analyses (server-side for signed-in users)
CREATE TABLE IF NOT EXISTS saved_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text,
  lot_number text,
  url text,
  listing_data jsonb,
  analysis_result jsonb,
  repair_profile text,
  user_location text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_analyses_user ON saved_analyses(user_id, created_at DESC);

-- Usage tracking for rate limiting
CREATE TABLE IF NOT EXISTS usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  fingerprint text,
  analysis_url text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_usage_user ON usage_log(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_usage_fingerprint ON usage_log(fingerprint, created_at);

-- RLS policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_log ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- Users can read/insert their own analyses
CREATE POLICY "Users can view own analyses" ON saved_analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own analyses" ON saved_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own analyses" ON saved_analyses FOR DELETE USING (auth.uid() = user_id);

-- Usage log: service role inserts, users can read their own
CREATE POLICY "Users can view own usage" ON usage_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can insert usage" ON usage_log FOR INSERT WITH CHECK (true);

-- =============================================
-- VEHICLE PRICE DATABASE
-- =============================================

-- Run this in your Supabase SQL editor to set up the vehicle price database

-- Raw listings scraped from various sources
CREATE TABLE IF NOT EXISTS vehicle_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,           -- 'ebay' | 'craigslist' | 'cargurus' | 'cars_com'
  source_id text NOT NULL,        -- original listing ID for dedup
  year int NOT NULL,
  make text NOT NULL,             -- uppercase: 'TOYOTA'
  model text NOT NULL,            -- uppercase: 'CAMRY'
  trim text,                      -- uppercase: 'SE' | 'XLE' | null
  mileage int,
  price int NOT NULL,
  title_status text DEFAULT 'clean',  -- clean | salvage | rebuilt | unknown
  sold boolean DEFAULT false,     -- true = completed sale, false = asking price
  sold_date date,
  zip text,
  state text,
  listed_date date,
  scraped_at timestamptz DEFAULT now(),
  UNIQUE(source, source_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_listings_vehicle ON vehicle_listings(year, make, model);
CREATE INDEX IF NOT EXISTS idx_listings_scraped ON vehicle_listings(scraped_at);

-- Pre-computed price aggregates per vehicle
CREATE TABLE IF NOT EXISTS vehicle_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year int NOT NULL,
  make text NOT NULL,
  model text NOT NULL,
  trim text,
  sample_count int DEFAULT 0,
  median_price int,
  avg_price int,
  price_low int,                  -- 10th percentile
  price_high int,                 -- 90th percentile
  avg_mileage int,
  avg_days_on_market int,
  price_per_mile numeric(10,2),
  last_updated timestamptz DEFAULT now(),
  sources text[],                 -- ['ebay', 'craigslist']
  UNIQUE(year, make, model, trim)
);

CREATE INDEX IF NOT EXISTS idx_prices_vehicle ON vehicle_prices(year, make, model);

-- Cached comps — persists across Vercel deploys, shared between users
CREATE TABLE IF NOT EXISTS cached_comps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  make text NOT NULL,
  model text NOT NULL,
  comp_type text NOT NULL,        -- 'auction' | 'retail'
  comps jsonb NOT NULL,           -- array of comp objects
  created_at timestamptz DEFAULT now(),
  UNIQUE(make, model, comp_type)
);

CREATE INDEX IF NOT EXISTS idx_cached_comps ON cached_comps(make, model, comp_type);

-- Anyone can read cached comps (no auth needed)
ALTER TABLE cached_comps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read cached comps" ON cached_comps FOR SELECT USING (true);
CREATE POLICY "Anyone can insert cached comps" ON cached_comps FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update cached comps" ON cached_comps FOR UPDATE USING (true);

-- Scrape queue — vehicles we need data for but don't have yet
CREATE TABLE IF NOT EXISTS scrape_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year int NOT NULL,
  make text NOT NULL,
  model text NOT NULL,
  trim text,
  status text DEFAULT 'pending',  -- pending | processing | done | failed
  requested_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(year, make, model, trim)
);

-- =============================================
-- FLIP TRACKER
-- =============================================

CREATE TABLE IF NOT EXISTS flips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_id text,  -- matches FullAnalysis.id (not FK — analyses may be in localStorage only)
  status text NOT NULL DEFAULT 'watching',  -- 'watching' | 'won' | 'sold'

  -- Vehicle info (denormalized for fast dashboard display)
  vehicle_year int,
  vehicle_make text,
  vehicle_model text,
  platform text,
  lot_number text,
  listing_url text,
  thumbnail_url text,

  -- Estimates from analysis (snapshot at time of watch)
  estimated_repair_low int,
  estimated_repair_high int,
  estimated_value_low int,
  estimated_value_high int,
  auction_fees int,

  -- User-entered actuals
  purchase_price int,
  sale_price int,
  sale_channel text,  -- 'private' | 'dealer' | 'auction' | 'other'
  actual_profit int,

  created_at timestamptz DEFAULT now(),
  won_at timestamptz,
  sold_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_flips_user ON flips(user_id, status, created_at DESC);

-- =============================================
-- ANALYTICS
-- =============================================

CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  fingerprint text,
  event_type text NOT NULL,  -- 'analysis' | 'watch' | 'won' | 'sold' | 'signup' | 'part_click' | 'part_add' | 'part_remove'

  -- Analysis metrics
  platform text,             -- 'iaa' | 'copart'
  vehicle_year int,
  vehicle_make text,
  vehicle_model text,
  verdict text,              -- 'BUY' | 'PASS' | 'RISKY'
  damage_severity text,      -- 'minor' | 'moderate' | 'severe'
  repair_estimate_low int,
  repair_estimate_high int,
  sell_price_low int,
  sell_price_high int,
  profit_low int,
  profit_high int,
  roi_pct numeric,
  photo_count int,
  comp_count_auction int,
  comp_count_retail int,
  has_acv boolean,
  sell_price_overridden boolean,  -- did server-side override Claude's sell price
  parts_count int,
  labor_hours numeric,

  -- User edit tracking
  parts_added int DEFAULT 0,
  parts_removed int DEFAULT 0,
  labor_edited boolean DEFAULT false,

  -- Flip outcome (filled when sold)
  actual_purchase int,
  actual_sale int,
  actual_repair_cost int,
  actual_profit int,
  days_to_sell int,

  -- Part click tracking
  part_name text,
  shop_target text,          -- 'ebay' | 'partsgeek' | 'oem'

  -- Meta
  analysis_time_ms int,      -- how long the analysis took
  cached boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_user ON analytics_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_platform ON analytics_events(platform, created_at DESC);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage analytics" ON analytics_events FOR ALL USING (true);

ALTER TABLE flips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own flips" ON flips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own flips" ON flips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own flips" ON flips FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own flips" ON flips FOR DELETE USING (auth.uid() = user_id);
