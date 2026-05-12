# SendIt — Backlog & Notes

## Launch Blockers (Tomorrow)
- [ ] Buy domain
- [ ] Point DNS to Vercel
- [ ] Stripe checkout ($49 flipper / $149 dealer)
- [ ] Re-enable rate limits (1 free, 50 paid, unlimited pro)
- [ ] Run analytics_events SQL migration (done)
- [ ] Run flips table columns SQL (auction_date, shipping_cost, repair_cost, estimated_shipping)

## Bugs Found Today (Fix Tomorrow)

### Comp year range too wide for newer cars
- 2025 Lexus IS pulling 2014-2016 comps — useless
- Generation system works for edge cases (2015 vs 2016 boundary) but for a 2025 car it should be tighter
- Fix: within same generation, cap comps to ±2 years of the actual vehicle year, not the full gen range
- A 2025 should pull 2023-2025, not 2014-2025 even if same gen

### Missed rear bumper damage
- 2025 Lexus IS 350 — entire rear bumper is missing, clearly visible in photos
- Claude only identified front end damage, completely missed the rear
- Bottom-right photo shows it clear as day
- This is the vision consistency issue again — need the structured photo prompting fix

## Vision Consistency Fixes (Post-Launch Priority)
Problem: Same car, same photos, different damage assessment each time.

### Lock photo order
- IAA labels photos: "Passenger Front", "Driver Front", "Driver Rear", "Passenger Rear", etc.
- Copart also has image type labels
- Always send in consistent order: front-right, front-left, rear-left, rear-right
- Skip odometer, key, VIN plate, engine bay — useless for damage

### 4 photos at higher res instead of 5
- Drop the 5th photo (usually key/odometer/engine — no damage info)
- Bump remaining 4 to 1280x960 or 1536x1152
- More pixels per panel = less ambiguity = more consistency

### Separate vision from estimation (two-step prompt)
- Step 1 (vision): "List every damaged panel/part you see" — no pricing, just identification
- Step 2 (text): "Given this damage list, estimate repair costs" — no photos, just math
- Isolates inconsistency to damage ID step only
- Pricing becomes deterministic given same damage list

### Interior 360 for airbag detection
- IAA provides interior 360 photo (sometimes shitty quality)
- Use as optional 5th photo ONLY for airbag deployment check
- "Are airbags deployed in this interior shot?" — specific question
- Deployed airbags = $2-4K, worth the extra tokens to catch

### Double-scan premium feature (future)
- Run Claude twice with different photo order
- Compare damage assessments — if they agree, high confidence
- If they disagree, flag discrepancy for user
- Could be a "Deep Scan" feature for pro tier

### User correction logging
- Wire up parts_added/parts_removed counts to analytics
- Log WHICH parts users add/remove (not just counts)
- Over time: "Claude over-estimates rear door damage 40% of the time"
- Feed calibration notes back into prompt

## Scraping Resilience
- Copart blocked direct API, using ScraperAPI fallback now
- IAA still works with direct fetch
- Long term: multiple scraping providers (Apify, ScrapingBee, Bright Data) as fallbacks
- Browser extension (v2) uses user's own authenticated session — no scraping needed
- User-submitted data becomes proprietary dataset over time

## Features — Next Up
- [ ] Stripe payments integration
- [ ] eBay Browse API (waiting on dev approval) — real parts prices
- [ ] Wire affiliate IDs into shop links (eBay EPN + PartsGeek CJ)
- [ ] Google OAuth (only email/password now)
- [ ] Admin analytics dashboard (after 50+ users)
- [ ] Copart auction date auto-populate in My Cars (data exists, just wire it)

## Features — V2
- [ ] Browser extension (uses user's authenticated IAA/Copart session)
- [ ] Current bid display for IAA (requires auth, extension solves this)
- [ ] Live bid updates on watched cars
- [ ] Flip tracker expense itemization
- [ ] Parts ordering/shipment tracking
- [ ] Facebook/Craigslist manual input mode
- [ ] "Deep Scan" double-analysis for pro users
- [ ] Proprietary profitability dataset from user flip outcomes
- [ ] Confidence score on every analysis (comp count, photo quality, data completeness)

## Marketing
- [ ] TikTok content (screen record analyses, react to verdicts)
- [ ] Facebook flip groups (post real analyses of current listings)
- [ ] YouTube creator outreach (Flying Wheels 503K, Bilal Flips 65K)
- [ ] Creator affiliate program (20% recurring, $10 off discount codes)
- [ ] SEO: fee calculator + shipping estimator pages (already built)
- [ ] Blog posts: "How much does it cost to buy from Copart" etc.
- [ ] Shareable analysis links = passive growth

## Pricing Strategy
- Launch: $49 flipper / $149 dealer
- Creator discount: $39 with code
- 6 months: bump new users to $69/$199, grandfather existing
- 12 months: bump new users to $99/$299, grandfather again
- Never raise on existing users

## Metrics to Watch
### Business
- Analyses/day, unique users/day, analyses per user
- Signup conversion (free → account), pro conversion (account → paying)
- Churn rate, MRR, cost per analysis, margin per user
- Affiliate clicks + revenue

### Product
- Platform split (IAA vs Copart), verdict distribution (BUY/PASS/RISKY)
- Most analyzed makes/models
- User edit rate (how often users change repair table)
- Parts added/removed (what Claude gets wrong)
- Watch → Won → Sold conversion rates
- Comp hit rate (% analyses with comps)
- Photo load rate, sell price override rate

### Accuracy (the gold mine)
- Estimated vs actual profit (after user completes flip)
- Repair estimate vs actual repair cost
- Sell price estimate vs actual sale price
- Verdict accuracy (did BUY calls profit, did PASS calls lose)
- Goal: "SendIt BUY verdicts profit X% of the time"

## Cost Structure
- Claude API: ~$0.05/analysis
- ScraperAPI: ~$0.01-0.02/analysis (Copart + BidFax if not cached)
- AutoTempest: free
- NHTSA: free
- Supabase: free tier to start
- Vercel: $20/mo
- ScraperAPI plan: $49/mo (100K credits)
- Total fixed: ~$70/mo, breakeven at 2 users
