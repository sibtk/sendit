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
