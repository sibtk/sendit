# sendit scan — Backlog

## Before Launch
- [ ] Vision testing (15-20 cars, document accuracy)
- [ ] PartsGeek model slugs (BMW, Lexus, Silverado broken — need correct slugs)
- [ ] Mobile layout check on pricing, flips, terms, privacy pages
- [ ] Test Stripe webhook end-to-end on production

## Post-Launch Priority
- [ ] PartsGeek CJ affiliate links (applied, pending approval)
- [ ] Google OAuth
- [ ] Admin analytics dashboard (after 50+ users)
- [ ] Confidence score per analysis (comp count, photo quality, data completeness)
- [ ] Verdict badge with price context — "BUY at $15K" not just "BUY"
- [ ] eBay Browse API (rejected twice — try again later or skip)

## Vision Roadmap
- [ ] Two-step prompt — separate damage ID from pricing, isolates inconsistency
- [ ] Interior 360 photo for airbag detection — IAA has it, catches $2-4K misses
- [ ] User correction feedback loop — track what users add/remove, calibrate prompt
- [ ] Deep Scan premium — run analysis twice, compare, flag discrepancies

## V2 Features
### Browser Extension
- Uses user's own authenticated IAA/Copart session
- No scraping needed — full VIN, current bid, auction date, everything
- One-click analyze from the listing page itself
- Solves scraping fragility permanently

### Live Auction Data
- Current bid display for IAA (requires auth, extension solves this)
- Live bid updates on watched cars
- Email/push alerts when watched car auction is approaching
- Weekly digest — "you analyzed 8 cars this week, 3 were BUY"

### Flip Tracker Pro
- Expense itemization (parts receipts, labor, towing, title fees)
- Parts ordering + shipment tracking
- Per-user math on shared links (re-calc with viewer's repair profile)
- Proprietary profitability dataset from completed flips

### New Inputs
- Facebook Marketplace / Craigslist manual input mode
- Manheim support (wholesale dealer auctions)
- Vehicle browsing on site (like AutoEstimatePro's 776K listings)
- Manual VIN entry for full decode when auction masks it

### Growth
- Shareable analysis links (built, every link is a marketing asset)
- TikTok content (screen record analyses, react to verdicts)
- Facebook flip groups (post real analyses of current listings)
- YouTube creator outreach (Flying Wheels 503K, Bilal Flips 65K)
- Creator affiliate program (20% recurring, discount codes)
- SEO pages (fee calculator, shipping estimator — already built)
- Blog content ("How much does it cost to buy from Copart" etc.)

## Pricing Strategy
- Launch: $49 pro / $149 dealer
- Creator discount: $39 with code
- 6 months: bump new to $69/$199, grandfather existing
- 12 months: bump new to $99/$299, grandfather again
- Never raise on existing users

## Scraping Resilience
- Copart: ScraperAPI fallback with render=true (working)
- IAA: direct fetch (working)
- BidFax: ScraperAPI with 7-day DB cache (working)
- Long term: multiple scraping providers as fallbacks
- End game: browser extension + user-submitted data

## Cost Structure
- Claude API: ~$0.05/analysis
- ScraperAPI: ~$0.01-0.02/analysis (Copart + BidFax if not cached)
- AutoTempest, NHTSA: free
- Fixed: ~$70/mo (Vercel $20 + ScraperAPI $49)
- Breakeven at 2 paying users
