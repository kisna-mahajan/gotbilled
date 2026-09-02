# gotbilled.in — Full Project Brief

---

## ⚠️ PRE-BUILD DIRECTIVE — READ FIRST

**Do NOT start writing any code until the following planning phase is complete and explicitly approved.**

This brief contains technical architecture, schema, and agents — but those are implementation details. Before building, align with the user on the strategic layer that drives every implementation decision. The build must be form-follows-function: every field in the form exists because a specific view needs it, every view exists because it delivers a specific value to a specific viewer, and every KPI exists because it measures whether that value was delivered.

### Planning Phase Deliverables (must be completed and approved before any code)

**1. Viewer Value Map**
Define every type of person who will visit the site. For each, answer:
- Who are they? (patient planning a procedure, patient who just got a bill, journalist, insurance researcher, policy advocate, curious browser)
- What question are they trying to answer?
- What view/page answers that question?
- What makes them share it?
- What makes them come back?

Map each viewer type → their question → the view that answers it → the data fields required to power that view. Any field in the form that doesn't trace back to a viewer's question should be challenged or removed. Any viewer question that can't be answered by current form fields means the form is incomplete.

**2. View Definitions**
For every page/view the site will have, define:
- What it shows (specific data points, not vague descriptions)
- Why a viewer cares (what decision does this help them make, or what emotion does it trigger)
- What minimum data is needed before this view is useful (e.g., "needs ≥20 reports for this city+procedure to show meaningful averages")
- What it looks like at 100 reports vs. 10,000 vs. 100,000 (does the view scale or become noisy?)
- Screenshot-ability: can this view be screenshotted and shared on WhatsApp/Twitter and still make sense without context?

**3. Form-to-Analytics Traceability**
For every field in the submission form:
- Which view(s) does this field power?
- Is it required or optional? Why?
- What happens to analytics if 50% of users skip this field? Is the view still useful?
- Does this field add friction to the submission flow? Is the analytics value worth the drop-off risk?

Produce a traceability matrix:

| Form field | Required? | Powers which view(s) | Analytics value | Drop-off risk |
|---|---|---|---|---|
| Procedure type | Yes | Every view | Core dimension — without this, nothing works | Low (dropdown, one tap) |
| City | Yes | City pages, maps, comparisons | Core dimension | Low (dropdown) |
| Quoted amount | Yes | Surprise score, comparisons | THE core metric | Medium (requires recall) |
| Final amount | Yes | Surprise score, comparisons | THE core metric | Medium (requires recall) |
| Hospital tier | Yes | Tier comparisons | Key segmentation | Low (4 options) |
| Bed count | Optional | Tier granularity | Nice-to-have, not core | Low but adds form length |
| Insurance used | Optional | Insurance analysis | Segment: insured vs. uninsured bills | Low |
| Stay days | Optional | Cost-per-day analysis | Secondary metric | Low |
| Procedure year | Yes | Trend analysis, data freshness | Ensures data recency | Low (dropdown) |
| Surprise charges | Optional | Absurd feed (entertainment layer) | Viral content engine | Medium (free text, effort) |
| Experience rating | Optional | Sentiment overlay | Weak — star ratings are noise at scale | Low but adds form length |

Challenge every optional field: if <30% of users will fill it, and the view it powers isn't critical, remove it. A shorter form = higher completion rate = more data = better analytics for the views that matter.

**4. Viewer-Facing Data Points (What the public sees)**

This is the most critical design decision. Every number, chart, and stat shown to a viewer must pass three tests: (a) is it interesting enough to pause on? (b) is it useful for a decision? (c) is it shareable as a screenshot?

Define the exact data points for each public view. For each data point, specify what form fields power it, what the minimum sample size is before showing it, and what it looks like as a standalone screenshot.

**Homepage data points — what makes someone stay past 3 seconds:**

| Data point | What it shows | Why someone cares | Form fields needed | Min sample | Screenshot-worthy? |
|---|---|---|---|---|---|
| National surprise score | "Indians paid __% more than quoted this month" | Shock value, the single headline number | quoted_amount, final_amount | 100 total reports | Yes — THE viral number |
| Total reported | "₹__ crore in bill surprises reported so far" | Scale/credibility signal | final_amount - quoted_amount, summed | 50 reports | Yes |
| City leaderboard | Top 5 cities by average surprise % | "Is my city the worst?" triggers local sharing | city, quoted_amount, final_amount | 5 per city | Yes — people share their city's rank |
| Procedure spotlight | "Most expensive free procedure this week" or highest surprise % procedure | Curiosity, outrage | procedure_type, surprise_percentage | 10 for that procedure | Yes |
| Absurd charge of the day | Single most-upvoted surprise line item | Entertainment, "you won't believe this" | surprise_charges (free text) | 1 (curated) | Yes — most shareable element |
| Live counter | Reports submitted today (animated) | Social proof, momentum | created_at count | 0 (starts at zero) | No — only works live |

**City page data points — what a person from that city wants to see:**

| Data point | What it shows | Why someone cares | Min sample |
|---|---|---|---|
| City surprise score | Average surprise % for this city | "How bad is it here?" | 20 reports |
| Procedure breakdown | Each procedure's avg quoted vs. actual in this city | "What should I expect for my upcoming surgery?" | 5 per procedure |
| Tier comparison | Corporate chain vs. private vs. government avg costs | "Is a big hospital actually more expensive?" | 5 per tier |
| Cost range | Min-Max final bill for each procedure | "What's the best and worst case?" | 10 per procedure |
| Trend | Is the surprise gap getting worse or better over time? | "Are things improving?" | 50 reports over 6+ months |
| Recent reports feed | Latest 20 reports from this city | Browsing, validation, "I had the same experience" | 1 |

**Procedure page data points — what someone planning a surgery wants to see:**

| Data point | What it shows | Why someone cares | Min sample |
|---|---|---|---|
| National average cost | Avg quoted and avg final across all cities | "What does this typically cost in India?" | 30 reports |
| City comparison map/chart | Same procedure across cities — cheapest to most expensive | "Should I travel to another city for this?" | 5 per city shown |
| Surprise score by city | Which cities have the biggest gap for this procedure | "Where is the estimate most honest?" | 10 per city |
| Insurance impact | Avg final bill: insured vs. uninsured | "Does insurance actually help?" | 10 insured + 10 uninsured |
| Cost per day | Final bill / stay days | Normalizes for different stay lengths | stay_days field (optional — may not have enough data) |
| Common surprise charges | Most frequently reported surprise line items for this procedure | "What hidden charges should I watch for?" | 20 reports with surprise items |

**Absurd feed data points — the entertainment/viral layer:**

| Data point | What it shows | Why someone cares |
|---|---|---|
| Line item description + amount | "Ward air conditioning maintenance: ₹1,500" | Outrage, humor, disbelief |
| Upvote count | How many people found this absurd | Social validation |
| Procedure + city tag | Context: what procedure, which city | Makes it relatable |
| Category tags | Auto-categorized: "phantom charges", "inflated consumables", "duplicate billing", "vague fees" | Browsable by type of absurdity |

**The "Am I being overcharged?" calculator — decision tool:**
- User selects: procedure + city + hospital tier
- Shows: "Based on N reports, you should expect to pay ₹X-Y. If quoted ₹Z, that's [above/below/within] the typical range."
- This is the utility play — the reason someone bookmarks the site
- Needs: procedure_type, city, hospital_tier, quoted_amount, final_amount, sufficient data per combination

For each data point above, the planning phase must confirm:
- The form fields exist to power it
- The minimum sample size is achievable in the first 3 months for at least 5 cities
- If the data point requires an optional field (like stay_days or insurance_used), what happens if only 30% of users fill it — is the data point still showable?
- How it degrades gracefully: what shows when data is insufficient? Not an empty page — a CTA: "Only 3 reports for this procedure in your city. Help us get to 5."

**5. Internal KPIs (admin-only, not public-facing)**

These are for the team to monitor health. Separate from what viewers see.

**Platform health:**
- Daily submissions (target: growth toward 10K/day)
- Submission completion rate (% who start form and finish — target: >70%)
- Unique cities with ≥5 reports (geographic coverage)
- Submission completion rate (% who start form and finish — target: >70%)
- Uptime (target: 99.9%)

**Content quality:**
- Quarantine rate (% flagged by anomaly detection — target: <5%)
- Average fields filled per report (are optional fields being used?)
- Reports with surprise items attached (% — target: >40%, powers viral feed)
- Duplicate report rate (same IP, same procedure+city within a day — should be ~0%)

**Engagement:**
- Page views per visitor (target: >3)
- Return visitor rate within 30 days (target: >15%)
- Social card impressions per week
- Absurd feed engagement (upvotes per item, scroll depth)
- Organic search traffic growth
- Calculator usage rate (% of viewers who use the "Am I being overcharged?" tool)

**Impact:**
- Media mentions per month
- Citations by researchers, policy advocates
- Inbound from patient advocacy groups

**6. Analytics Architecture**
Before building views, define what analytics tooling captures the KPIs above:
- Which KPIs come from the database itself (submissions, completion rates, quarantine rates)?
- Which require frontend event tracking (page views, scroll depth, share clicks)?
- Which require external monitoring (search rankings, social impressions)?
- What's the admin dashboard MVP? (Just the numbers needed to make daily decisions: new submissions, flagged reports, quarantine rate, top cities)

### How This Phase Works

1. Cowork produces: Viewer Value Map, View Definitions, Viewer-Facing Data Points (with exact numbers/charts per page), Form-to-Analytics Traceability Matrix, Internal KPIs, and Analytics Architecture — as a single planning document.
2. Present it to the user for review. Do NOT proceed until explicit approval.
3. User may challenge: data points (are these the right things to show?), form fields (does this field earn its place?), views (is this page worth building?), or priorities (what ships in v1 vs. later).
4. Only after approval: begin implementation, starting with database schema (which now reflects only the approved form fields and the queries needed to power approved data points), then API, then frontend.

**The goal of this phase is to ensure every number a viewer sees traces back to a form field, every form field traces forward to a viewer-facing data point, and nothing exists in the form that doesn't serve a view the user has approved.**

---

## What is this?

An anonymous, crowdsourced platform where Indians share what they were actually billed for medical procedures. The core content format is **"quoted price vs. final bill"** — exposing the gap between what hospitals estimate and what patients actually pay.

No hospital names. Data aggregated by **city** and **hospital tier** (corporate chain / private standalone / government / trust hospital).

## Why it matters

- 53% of Indian patients don't receive fully itemized bills (LocalCircles study)
- 74% want the government to mandate a fixed billing format
- No competitor exists in India for crowdsourced medical cost transparency
- BIS recently introduced standardized billing guidelines — regulatory tailwind
- The "bill shock" experience is universal, emotional, and deeply shareable

## Core Concept

**The "promised vs. actual" format:**
- User reports: procedure, city, hospital tier, quoted estimate, final bill amount
- The gap percentage is the content: "Average bill surprise for C-section in Delhi: +47% over initial quote"
- Secondary content: absurd line items ("₹200 for a pair of gloves", "₹1500 for ward maintenance fee")

**No hospital names = near-zero legal risk.** You're publishing anonymous consumer expenditure data aggregated by geography. No defamation possible.

---

## Product Spec

### User Roles

1. **Contributor** — submits a bill report anonymously
2. **Viewer** — browses data by city, procedure, hospital tier
3. **Admin** — monitors submissions, flags anomalies, manages content

### Submission Flow (Contributor)

**Fully anonymous. No login, no email, no phone number, no identity.**

**Step 1: Bot Protection (invisible to user)**
- Cloudflare Turnstile (invisible challenge — runs automatically, zero user friction)
- Honeypot field (hidden form field — if filled, submission silently discarded)
- Timing check: if form submitted in <5 seconds after page load, reject (bot speed)
- Purpose: block automated submissions at zero cost

**Step 2: Report Form**
Fields:
- Procedure type (dropdown: C-section, Normal delivery, Appendectomy, Knee replacement, Cataract surgery, Angioplasty, Angiography, Hernia, Gallbladder removal, Bypass surgery, Dialysis session, Dental implant, Other with free text)
- City (searchable dropdown)
- State (auto-filled from city)
- Hospital tier (Corporate chain / Private standalone / Government / Trust/charitable)
- Approximate bed count (optional: <50, 50-200, 200-500, 500+)
- Insurance used? (Yes/No/Partial)
- Initial quote/estimate given by hospital (₹ amount)
- Final bill amount (₹ amount)
- Duration of stay (days)
- Year of procedure (dropdown, last 3 years only)
- "Surprise charges" — optional free text, one line per item (e.g., "₹200 gloves", "₹800 bio-medical waste fee")
- Overall experience rating (1-5 stars, optional)

**Step 3: Confirmation**
- Summary shown, user confirms
- Report goes live immediately (no moderation queue — speed matters for engagement)
- Anomaly detection runs async (see below)

### Browse/Explore Experience (Viewer)

**Homepage:**
- Hero stat: "Indians reported ₹____ crore in bill surprises this month"
- "Surprise Score" by city — top 5 cities with highest average bill gap
- "Latest reports" feed — scrollable, snackable
- "Absurd line items" carousel — the funny/outrageous charges
- Search bar: "What does [procedure] cost in [city]?"

**Procedure Page:**
- Selected procedure across all cities
- Average quoted vs. actual by city (bar chart)
- Average by hospital tier
- Surprise score distribution
- Recent reports for this procedure

**City Page:**
- Selected city across all procedures
- Which procedures have the biggest surprise gap
- Hospital tier comparison within that city
- Total reports from this city

**The Absurd Bill Feed:**
- Scrollable feed of individual line items people flagged
- Upvotable (no login needed, rate-limited by IP)
- "Most upvoted this week" section
- This is the entertainment/viral layer

### Screenshot-First Content Engine

Auto-generated shareable cards (image format):
- **Weekly city card:** "This week in Mumbai: Average C-section bill surprise: +52%. Based on 34 reports."
- **Procedure comparison card:** "Appendectomy across India: Cheapest city vs. most expensive city"
- **Absurd item of the week:** "Someone was charged ₹1,500 for 'ward air conditioning maintenance'"
- **Monthly report card:** "gotbilled.in Monthly: India's Medical Bill Reality Check"

These cards auto-post to Twitter/Instagram or are downloadable from the site.

---

## Technical Architecture

### Stack — Cloudflare-First (Optimized for Minimum Cost at Maximum Traffic)

- **Frontend:** Static HTML/JS/CSS on Cloudflare Pages (unlimited bandwidth, free)
- **Framework:** SvelteKit with Cloudflare adapter (smallest bundles, first-class CF support) OR plain static site + vanilla JS if simpler
- **Styling:** Tailwind CSS
- **Backend:** Cloudflare Workers (API layer)
- **Database:** Cloudflare D1 (serverless SQLite — free: 5GB, 5M reads/day, 100K writes/day; paid: $5/mo for 25GB, 50B reads/mo)
- **Bot protection:** Cloudflare Turnstile (free, invisible challenge)
- **Rate limiting:** Cloudflare rate limiting (IP-based, built-in, free tier available)
- **Identity verification:** None at launch. Fully anonymous. Add email/WhatsApp OTP later only if spam exceeds anomaly detection capacity.
- **Image generation for social cards:** GitHub Actions (free for public repos, 2,000 min/month) using Satori + Sharp
- **Scheduled jobs:** Cloudflare Workers Cron Triggers (included in $5/mo Workers paid plan)
- **Moderation/classification:** Cloudflare Workers AI (free: 10,000 neurons/day)
- **Analytics:** Plausible Community Edition (self-hosted, free) or Cloudflare Web Analytics (free)
- **Domain:** gotbilled.in (~₹700-900/year via INRegistry)

### Scale Target: 10,000 Entries/Day

**What 10K entries/day actually means:**
- 10K report rows + ~30K surprise_item rows = ~40K DB writes/day
- No identity verification overhead — every submission goes straight to validation + write
- Viewers are 10-50x contributors = 100K-500K page views/day
- 300K reports/month, 3.6M/year
- Storage: ~1.8GB/year of report data (each row ~500 bytes)
- Peak write load: average 7 writes/min, spikes to 50-100/min during viral moments

### Cost Projection (at 10K entries/day steady state)

| Component | Monthly cost |
|---|---|
| Cloudflare Workers ($5 plan) | ₹400 |
| Cloudflare D1 ($5 plan — 25GB, 50B reads) | ₹400 |
| Cloudflare KV ($5 plan — 10M reads, 1M writes) | ₹400 |
| Cloudflare R2 (free tier: 10GB, 10M reads) | ₹0 |
| Domain | ₹60 |
| GitHub Actions (free tier) | ₹0 |
| **Total** | **~₹1,300/month (~$15)** |

No identity verification = no per-submission cost. The entire platform runs for the price of a meal at 10K entries/day.

### Anonymous Anti-Fake Architecture (No Identity, Seven Layers Deep)

With no email/phone verification, anti-fake defense shifts entirely to behavioral, structural, and statistical layers. Each layer catches a different attack type. Combined, they handle everything short of a motivated, well-funded, manual attack (which has no incentive to target a medical cost aggregator).

**Layer 1 — Cloudflare Turnstile (every submission, ₹0)**
- Invisible bot detection. No user interaction required.
- Blocks all automated/scripted submissions.
- Catches: bots, scrapers, form-fill scripts, headless browsers.

**Layer 2 — Honeypot field (every submission, ₹0)**
- Hidden form field (CSS display:none), labeled attractively for bots (e.g., name="email" or name="phone").
- If filled → silently discard submission (don't show an error — bots shouldn't know they failed).
- Catches: dumb bots that fill every field.

**Layer 3 — Timing validation (every submission, ₹0)**
- Record timestamp when form page loads (stored in a signed token/hidden field).
- On submission, check: if time between page load and submit < 5 seconds → reject.
- If time > 30 minutes → require Turnstile re-validation (session may have been handed to a bot).
- Catches: scripted rapid submissions, automated form fills.

**Layer 4 — IP-based rate limiting (every submission, ₹0)**
- Max 5 submissions per IP per day.
- Max 15 submissions per IP per week.
- Implemented via Cloudflare rate limiting rules (free tier) or a KV counter per IP_hash.
- IP is hashed (SHA-256), never stored raw.
- Catches: single-source flooding, lazy spam.
- Limitation: VPN/proxy users share IPs (may block legitimate users) and determined attackers rotate IPs. Keep limits generous enough that normal users never hit them.

**Layer 5 — Structural validation (every submission, ₹0)**
- Quoted amount: ₹100 – ₹50,00,000 range. Outside = reject.
- Final amount: ₹100 – ₹50,00,000 range. Outside = reject.
- Final amount < quoted amount × 0.3: flag (unlikely to be billed 70% less than quoted).
- Surprise percentage > 500%: flag for review, don't reject (could be real — medical billing is wild).
- Stay days: 0–365 range. Outside = reject.
- Procedure year: must be within last 3 years. Outside = reject.
- Surprise charge descriptions: max 200 chars each, max 10 items per report.
- Catches: obviously fake/impossible data.

**Layer 6 — Duplicate/pattern detection (async, every 6 hours)**
- Exact duplicate: if two submissions have identical (procedure + city + quoted + final + stay_days), flag both.
- Near-duplicate text: if surprise_item descriptions match >80% across multiple reports, flag as copy-paste spam.
- Burst detection: if any city+procedure combo gets >10× its rolling 7-day daily average in a 6-hour window, quarantine the burst for manual review.
- Sequential patterns: if submissions arrive at perfectly regular intervals (e.g., exactly every 30 seconds), flag — humans are irregular.
- Catches: coordinated flooding, copy-paste campaigns, bot patterns that passed Turnstile.

**Layer 7 — Aggregation threshold (display rule)**
- Don't show any aggregate (average, surprise score, chart) for a city+procedure until ≥5 reports exist.
- Show "Limited data — N reports" badge for 5–15 reports.
- Show sample size on ALL aggregate displays.
- This is the final defense: even if fake data gets in, it can't distort public-facing stats until it outnumbers real reports. At ≥5 threshold, an attacker needs at least 3 coordinated fake reports (majority) to influence the average — and those 3 must pass all 6 layers above.
- Catches: the residual fakes that slip through everything else.

**When to add identity verification (escalation trigger):**
- Quarantine rate exceeds 10% for 2+ consecutive weeks
- OR a specific, identified spam campaign is detected that behavioral layers can't catch
- OR media/public credibility challenge specifically about data quality that aggregation thresholds can't address
- Then: add email OTP as an optional "verified contributor" badge (not a gate). Verified reports get weighted higher in aggregates. Unverified reports still accepted but weighted lower. This preserves anonymity for the majority while adding a credibility layer.
- Design the form with a future-proof slot for optional email/phone field so adding verification is a config toggle, not a rebuild.

### Caching Architecture (Critical for 100K-500K reads/day)

At 10K entries/day, you cannot serve every page view from D1. D1's free tier allows 5M reads/day which sounds like a lot, but a single page view can trigger 3-5 queries (aggregates + recent reports + surprise items + metadata). 500K page views × 4 queries = 2M reads/day on average, with viral spikes hitting 10M+.

**Solution: Cloudflare KV as read cache, D1 as source of truth.**

**What gets cached in KV:**

| Cache key pattern | TTL | Content |
|---|---|---|
| `home:hero` | 1 hour | Hero stat (total surprise amount), top 5 cities |
| `home:feed` | 5 min | Latest 50 reports (paginated) |
| `home:absurd` | 15 min | Top 50 absurd items by upvotes this week |
| `agg:{city}:{procedure}` | 1 hour | Aggregate stats for city+procedure page |
| `city:{city}` | 1 hour | City overview (all procedures) |
| `proc:{procedure}` | 1 hour | Procedure overview (all cities) |
| `feed:{city}:{procedure}:{page}` | 5 min | Paginated recent reports for a city+procedure |
| `absurd:top:{period}` | 15 min | Top absurd items (weekly, monthly, all-time) |
| `sitestats` | 1 hour | Total reports, total cities, total surprise amount |

**Cache invalidation strategy:**
- On new report submission: Worker increments a version counter in KV for affected city+procedure keys
- Read Workers check version before serving cached data; if stale, re-query D1 and update cache
- Simpler alternative: just let TTLs expire naturally. 1-hour staleness for aggregates is acceptable — users don't need real-time stats.
- Home feed (5-min TTL) gives near-real-time feel without hammering D1.

**Read path (every page view):**
1. Worker receives request for /cost/c-section/mumbai
2. Check KV for `agg:mumbai:c-section` → if fresh, serve immediately (0 D1 reads)
3. If stale/missing → query D1, write result to KV, serve to user
4. 95%+ of reads served from KV, D1 only hit on cache miss

**Write path (every submission):**
1. Validate + moderate in Worker (no DB hit)
2. Write to D1: INSERT report + INSERT surprise_items (1-4 writes)
3. Increment rate_limit counter in D1 (1 write)
4. Bump version counter in KV for affected cache keys (1 KV write)
5. Total: 3-6 D1 writes per submission

**At 10K entries/day:**
- D1 writes: ~40-60K/day (well within 100K free, definitely within paid tier)
- D1 reads: ~5-20K/day (only cache misses — <1% of page views)
- KV reads: ~400K-2M/day (serves 95%+ of traffic, paid tier handles 10M reads/day)
- KV writes: ~15-25K/day (cache updates + version bumps, paid tier handles 1M writes/day)

### D1 Write Concurrency Handling

D1 is SQLite-based with a single-writer model. At average 7 writes/minute this is fine. During viral spikes (50-100 writes/minute), sequential writes could cause queuing.

**Solution: Cloudflare Queue as write buffer.**
- Submissions don't write directly to D1
- Worker validates + moderates, then pushes to a Cloudflare Queue
- A separate consumer Worker pulls from the Queue and batch-writes to D1
- Batch INSERT: accumulate 10-50 reports, write in one transaction
- Queue provides natural backpressure — submissions are acknowledged immediately, writes happen async
- User sees confirmation instantly; report appears in feed within 1-2 minutes

**Cloudflare Queue pricing:** $0.40 per million operations. At 10K entries/day = 300K/month = ~₹10/month. Negligible.

**Schema optimization for write throughput:**
- Minimize indexes on reports table. Only index what's queried:
  - idx_reports_city_procedure (for aggregates)
  - idx_reports_created (for recent feed)
  - idx_reports_ip_hash (for rate limiting)
  - idx_reports_flagged (for admin)
- Drop the flagged index if admin queries are infrequent (scan is fine for small result sets)
- surprise_items: only index on report_id and upvotes. Don't over-index.

### Aggregate Computation Strategy

At 10K entries/day, daily aggregate refresh is too infrequent — data is 12 hours stale on average.

**Approach: Incremental aggregation, not full recompute.**

**On every new report (in the Queue consumer Worker):**
- After INSERT, run lightweight incremental update:
  ```sql
  INSERT INTO aggregates (city, procedure_type, hospital_tier, report_count, avg_quoted, avg_final, avg_surprise_pct, min_final, max_final, updated_at)
  VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, datetime('now'))
  ON CONFLICT(city, procedure_type, hospital_tier) DO UPDATE SET
    report_count = report_count + 1,
    avg_quoted = ((avg_quoted * (report_count - 1)) + ?) / report_count,
    avg_final = ((avg_final * (report_count - 1)) + ?) / report_count,
    avg_surprise_pct = ((avg_surprise_pct * (report_count - 1)) + ?) / report_count,
    min_final = MIN(min_final, ?),
    max_final = MAX(max_final, ?),
    updated_at = datetime('now');
  ```
- This is one write per report, not a full table scan
- Running averages are slightly less accurate than recomputing from scratch (floating point drift) but the difference is negligible at scale

**Full recompute: still run weekly (Cron Trigger, Sunday 3 AM IST)**
- Corrects any floating point drift in running averages
- Recomputes medians (can't do incrementally)
- Removes quarantined reports from aggregates
- This is the only time you do a full table scan

**Median calculation:**
- SQLite doesn't have a native MEDIAN function
- For weekly recompute: query all final_amounts per city+procedure, compute median in Worker code
- For real-time: skip median, show average. Median is a nice-to-have, not critical for the UX.

### Database Schema (Cloudflare D1 — SQLite)

Note: D1 is SQLite-based. No ENUMs — use TEXT with CHECK constraints. No UUID type — use TEXT with generated UUIDs.

```sql
CREATE TABLE reports (
  id TEXT PRIMARY KEY,  -- UUID generated in Worker
  ip_hash TEXT NOT NULL,  -- SHA-256 hash of submitter IP (for rate limiting only, never displayed)
  procedure_type TEXT NOT NULL,
  procedure_other TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  hospital_tier TEXT NOT NULL CHECK(hospital_tier IN ('corporate_chain', 'private_standalone', 'government', 'trust')),
  bed_count_range TEXT CHECK(bed_count_range IN ('under_50', '50_200', '200_500', 'over_500')),
  insurance_used TEXT NOT NULL CHECK(insurance_used IN ('yes', 'no', 'partial')),
  quoted_amount INTEGER NOT NULL,  -- in rupees
  final_amount INTEGER NOT NULL,   -- in rupees
  surprise_percentage REAL NOT NULL,  -- auto-calculated: ((final - quoted) / quoted) * 100
  stay_days INTEGER NOT NULL,
  procedure_year INTEGER NOT NULL,
  experience_rating INTEGER CHECK(experience_rating BETWEEN 1 AND 5),
  flagged INTEGER NOT NULL DEFAULT 0,  -- 0 = clean, 1 = flagged
  quarantined INTEGER NOT NULL DEFAULT 0,  -- 0 = visible, 1 = excluded from aggregates
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_reports_city_procedure ON reports(city, procedure_type);
CREATE INDEX idx_reports_ip_hash ON reports(ip_hash);  -- for rate limit checks
CREATE INDEX idx_reports_created ON reports(created_at);
CREATE INDEX idx_reports_flagged ON reports(flagged);

CREATE TABLE surprise_items (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL REFERENCES reports(id),
  description TEXT NOT NULL,  -- max 200 chars, enforced in Worker
  amount INTEGER,  -- nullable, some items don't have clear amounts
  upvotes INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_surprise_items_report ON surprise_items(report_id);
CREATE INDEX idx_surprise_items_upvotes ON surprise_items(upvotes DESC);

CREATE TABLE aggregates (
  city TEXT NOT NULL,
  procedure_type TEXT NOT NULL,
  hospital_tier TEXT NOT NULL,
  report_count INTEGER NOT NULL,
  avg_quoted REAL NOT NULL,
  avg_final REAL NOT NULL,
  avg_surprise_pct REAL NOT NULL,
  median_final REAL NOT NULL,
  min_final INTEGER NOT NULL,
  max_final INTEGER NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (city, procedure_type, hospital_tier)
);

-- No OTP sessions table (fully anonymous, no identity verification)
-- No rate_limits table (rate limiting handled via IP-based checks in Worker using KV counters or Cloudflare rate limiting rules)

CREATE TABLE upvote_tracking (
  item_id TEXT NOT NULL REFERENCES surprise_items(id),
  ip_hash TEXT NOT NULL,  -- hashed IP, never raw
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (item_id, ip_hash)
);

CREATE TABLE moderation_log (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL REFERENCES reports(id),
  field_name TEXT NOT NULL,  -- which field was redacted: 'description', 'procedure_other'
  original_text TEXT NOT NULL,  -- what was redacted (stored for admin review)
  redaction_reason TEXT NOT NULL,  -- 'hospital_name', 'doctor_name', 'pii', 'profanity'
  reviewed INTEGER NOT NULL DEFAULT 0,  -- 0 = pending, 1 = confirmed, 2 = false positive (restored)
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_moderation_pending ON moderation_log(reviewed) WHERE reviewed = 0;

-- Note: At 10K entries/day, keep indexes minimal on reports table.
-- Every index slows writes. Only index what's actively queried.
-- The 4 indexes on reports are sufficient. Do NOT add more without profiling.
```

**Storage projections at 10K entries/day:**
- reports: ~500 bytes/row × 300K/month = ~150MB/month, ~1.8GB/year
- surprise_items: ~200 bytes/row × 900K/month = ~180MB/month, ~2.1GB/year
- aggregates: tiny — ~50K rows max (cities × procedures × tiers)
- Total D1 usage after 1 year: ~4-5GB (well within 25GB paid tier)
- After 3 years: ~12-15GB → still within limits
- At year 5: consider archiving old reports to R2

### Anti-Fake / Anomaly Detection

**See "Anonymous Anti-Fake Architecture" section above for the full 7-layer defense.**

Summary of layers for quick reference:
1. Cloudflare Turnstile — blocks bots (invisible, free)
2. Honeypot field — catches dumb bots (free)
3. Timing validation — rejects <5 second submissions (free)
4. IP-based rate limiting — max 5/day, 15/week per IP (free)
5. Structural validation — amount ranges, logical checks (free)
6. Duplicate/pattern detection — async every 6 hours
7. Aggregation threshold — ≥5 reports before showing stats

**On submission validation (in Worker, synchronous):**
- Turnstile token verification
- Honeypot field check
- Timing check (form load to submit ≥5 seconds)
- IP rate limit check (via KV counter: ip_hash → daily/weekly count)
- Amount range: ₹100 – ₹50,00,000
- Final < quoted × 0.3: flag
- Surprise > 500%: flag for review
- Stay days: 0–365
- Procedure year: within last 3 years
- Surprise items: max 10, max 200 chars each

**Async anomaly detection (Cron Trigger, every 6 hours):**
- Z-score outliers (amounts >3 SD from city+procedure mean)
- Burst detection (>10× rolling 7-day daily average for any city+procedure)
- Duplicate text in surprise_items (>80% match across reports)
- Sequential timing patterns (perfectly regular intervals = bot)
- Quarantine flagged reports (excluded from aggregates, visible with "under review" badge)

**Display rules:**
- Don't show city+procedure aggregate until ≥5 reports exist
- Show "Limited data — N reports" badge for 5-15 reports
- Show sample size on ALL aggregate views — transparency is credibility
- Quarantined reports show with "under review" badge, excluded from stats

### Agents / Automation Layer (Redesigned for 10K entries/day)

**0. Queue Consumer Worker (always-on, event-driven)**
- THE critical path for all writes. No report hits D1 directly.
- Listens on Cloudflare Queue. Triggered by every new submission.
- Batch processes: accumulates up to 50 messages or 5 seconds (whichever comes first)
- Per batch:
  - Batch INSERT reports + surprise_items in single D1 transaction
  - Run incremental aggregate UPDATE per report (see Aggregate Computation Strategy)
  - Bump KV version counters for affected cache keys
  - Run inline moderation (keyword blocklist + regex) on free-text fields
  - Auto-redact hospital/doctor names, PII, profanity → replace with [redacted]
  - Log redactions to a separate moderation_log table
- If D1 write fails: message stays in Queue, retried automatically (Queue has built-in retry with backoff)
- Latency: user sees confirmation immediately. Report appears in feeds within 1-2 minutes.

**1. Content Generation Agent (GitHub Actions — twice weekly: Wednesday + Sunday 11 PM IST)**
- At 10K entries/day, weekly cards are stale. Twice-weekly gives fresher content.
- Queries D1 for top stories: biggest surprise scores, trending procedures, city comparisons
- Generates shareable image cards using Satori (JSX → SVG) + Sharp (SVG → PNG)
- Outputs per run: 3-4 cards (city spotlight, procedure comparison, absurd item highlight, trend card)
- Monthly summary card on 1st of each month
- Stores generated images in Cloudflare R2
- Posts to Twitter via API, Instagram via Meta Graph API
- Cards also served on /cards page for manual sharing/download

**2. Anomaly Detection Agent (Cron Trigger — every 6 hours: 2 AM, 8 AM, 2 PM, 8 PM IST)**
- At 10K entries/day, daily scans miss coordinated attacks. 6-hourly catches them faster.
- Scans reports created since last run (~2,500 reports per window)
- Computes z-scores against rolling 30-day baselines per city+procedure
- Flags:
  - Statistical outliers (amounts >3 SD from mean)
  - Duplicate text patterns in surprise_items (copy-paste spam)
  - Burst submissions (>10x hourly average for any city+procedure)
  - Same IP submitting >5 reports in 6 hours (unusual pattern, likely automated)
- Updates flagged/quarantined columns in D1
- Removes quarantined reports from aggregates (incremental subtract)
- Bumps KV cache versions for affected keys
- Sends summary to admin via Telegram bot (free) — only if flags found, no noise alerts

**3. Full Aggregate Recompute (Cron Trigger — weekly, Sunday 3 AM IST)**
- Corrects floating point drift from incremental running averages
- Recomputes medians (requires full column scan, can't do incrementally)
- Ensures quarantined reports are fully excluded
- Rebuilds the entire aggregates table from scratch
- At 300K reports/month, this takes ~30-60 seconds in D1 — acceptable for weekly
- After recompute: flush all `agg:*` keys in KV to force cache refresh

**4. Cleanup Agent (Cron Trigger — daily, 4 AM IST)**
- Deletes upvote_tracking rows older than 6 months
- Purges expired IP rate limit counters from KV (daily counters older than 2 days, weekly counters older than 2 weeks)
- Vacuums D1 database (SQLite VACUUM reclaims space from deleted rows)
- Checks D1 storage usage, alerts if approaching 80% of plan limit
- Checks KV key count, alerts if cache is bloating

**5. SEO Page Generator (GitHub Actions — twice weekly: Monday + Thursday 6 AM IST)**
- At 10K entries/day, new city+procedure combos cross the 5-report threshold frequently
- Queries aggregates table for city+procedure combos with ≥5 reports
- Generates/updates static landing pages: /cost/appendectomy/mumbai, /cost/c-section/delhi
- Each page: average cost, range, surprise score, hospital tier comparison, sample size, "share your experience" CTA
- Includes schema.org structured data (MedicalProcedure, MonetaryAmount)
- Generates updated sitemap.xml
- Deploys updated static pages to Cloudflare Pages via Wrangler CLI

**6. Moderation (inline in Queue Consumer, NOT a separate agent)**
- Moved from standalone agent into the Queue Consumer (Agent 0) for efficiency
- Runs on every report as part of the write pipeline — no separate pass needed
- Logic:
  - Hospital name blocklist: top 500 hospital/chain names stored in KV (faster than D1 lookup). Check all free-text fields.
  - Doctor name patterns: regex for "Dr.", "Doctor", common Indian doctor name patterns
  - PII: regex for phone numbers (10-digit Indian), email addresses, Aadhaar patterns (12-digit)
  - Profanity: keyword blocklist in KV
  - If any match: auto-redact → replace with [redacted], log to moderation_log table
  - NO Workers AI dependency for moderation — keyword + regex handles 99% of cases at zero cost. Workers AI free tier (10K neurons/day) is too limited for 10K entries/day.
  - Edge cases (unclear if PII or not) get flagged for manual admin review, not auto-redacted

**7. Health Check Agent (Cron Trigger — every 30 minutes)**
- Essential at 10K/day — you need to know immediately if something breaks
- Checks:
  - D1 connectivity: run `SELECT 1`
  - Queue depth: if messages backing up >1000, alert (Consumer may be failing)
  - KV read latency: if >500ms, alert
  - Last report timestamp: if no new reports for >2 hours during peak (8 AM - 11 PM IST), alert
  - Turnstile pass rate: if dropping below 80%, may indicate misconfiguration or overly aggressive blocking
- Alerts via Telegram bot. Escalates to email if no acknowledgment in 15 minutes.

### Infrastructure Scaling Thresholds

| Trigger | Action |
|---|---|
| D1 storage >20GB (of 25GB paid) | Archive reports older than 2 years to R2 as compressed JSON. Keep aggregates. |
| Queue depth >5000 consistently | Increase Consumer batch size to 100. If still backing up, deploy second Consumer Worker. |
| KV reads >8M/day (of 10M paid) | Increase cache TTLs (1hr → 2hr for aggregates). Consider upgrading plan. |
| D1 writes >80K/day (of 100K free or paid limit) | Move to D1 paid plan if not already. Optimize: batch inserts, reduce indexes. |
| Quarantine rate >10% for 2+ weeks | Tighten structural validation ranges. If still high, add email OTP as optional "verified contributor" tier (see escalation trigger in Anti-Fake Architecture). |
| Page load time >3 seconds on 3G | Audit: serve pre-rendered HTML from KV for top 50 pages. Reduce client-side JS. |

---

## Design Direction

### Brand Identity
- **Tone:** Empathetic but unflinching. Not angry, not clinical. "We're just showing you the numbers."
- **Visual feel:** Clean, data-forward, slightly editorial. Think ProPublica meets a modern Indian startup.
- **Colors:** Consider a medical/clinical palette subverted — not hospital blue/white but something with warmth. A muted teal or sage as primary, a warm coral or amber for the "surprise" accent (the gap/shock element).
- **Typography:** Modern, readable. Not playful (this is about people's money and health). Not corporate (this is not a hospital website).

### Key Design Moments
1. **The surprise score reveal** — when a viewer looks up a procedure+city, the gap between quoted and actual should feel visceral. Animated counter? Color-coded severity?
2. **The absurd items feed** — should feel like scrolling Twitter. Each item is a card with the charge description, amount, and an upvote button.
3. **The submission confirmation** — "Your report is live. You're helping 1.4 billion Indians make better decisions." Emotional payoff.
4. **Empty states** — "No data for [procedure] in [city] yet. Be the first to report." Clear call to action.

---

## Launch Plan

### Phase 0: Pre-launch Seeding (Week 1-2)
- Build the platform
- Manually seed with 30-50 reports from personal network, family, friends
- Ask: "What was your last hospital bill? What were you quoted vs. what you paid?"
- Target: enough data for 3-4 cities to look non-empty

### Phase 1: Soft Launch (Week 3)
- Post on r/india, r/bangalore, r/mumbai, r/delhi
- Post on Twitter with 2-3 pre-made comparison cards
- Share in health insurance WhatsApp communities
- Target: 200 reports in first week

### Phase 2: Media Push (Week 4-5)
- Pitch to health journalists, personal finance bloggers
- "India's first crowdsourced medical bill transparency platform"
- Release first "Monthly Medical Bill Reality Check" report
- Target: media coverage in 2-3 outlets

### Phase 3: Sustained Growth
- Weekly social cards on autopilot
- SEO pages ranking for "appendectomy cost in [city]" queries
- Partner with patient advocacy groups
- Consider: allow insurance companies to sponsor (non-invasive, clearly labeled)

---

## Monetization (Future, Not Now)

- **Health insurance comparison:** "Your procedure in your city costs X on average. Compare insurance plans that cover it."
- **Sponsored insights for insurers/TPAs:** anonymized, aggregated data licensing
- **Premium API access:** for health-tech startups building cost estimation tools
- **Never: hospital advertising.** The moment you take hospital money, you lose credibility.

---

## Legal Setup

- Register as a simple LLP or proprietorship
- Terms of service: "User-generated content, we are an intermediary"
- Privacy policy: "We do not collect email addresses, phone numbers, or any personally identifiable information. IP addresses are hashed for rate limiting and never stored in raw form. No personal health information is retained beyond what you voluntarily share in the submission form."
- Comply with IT Act Section 79 safe harbour: have a grievance officer, respond to takedown requests within 36 hours
- Content disclaimer: "Data is crowdsourced and self-reported. Not medical or financial advice. Not a substitute for consulting with your healthcare provider."
- No hospital names policy: auto-redact any hospital or doctor names from free-text fields

---

## Success Metrics

**Phase 1 — Cold Start (Month 1-2):** 500-1,000 reports, 5+ cities with ≥5 reports each, 2+ media mentions, all infra stable on free tiers
**Phase 2 — Traction (Month 3-4):** 5,000 reports, 15+ cities, 50K monthly page views, social cards generating 25K+ impressions/week, SEO pages starting to rank
**Phase 3 — Growth (Month 5-8):** 2,000-5,000 entries/day, 50+ cities, 500K monthly page views, move to paid Cloudflare tiers
**Phase 4 — Scale (Month 9-12):** 10,000 entries/day sustained, 100+ cities, 2M+ monthly page views, first monetization experiment, infra handles viral spikes without intervention
**Phase 5 — Maturity (Year 2):** 1M+ total reports, recognized as India's medical cost transparency reference, data licensing revenue, API access for health-tech startups

---

## Files This Project Should Produce

### Core Application
1. Product spec (this document, refined)
2. Database schema — D1 migration SQL files + storage projections
3. API design — Cloudflare Worker endpoints, request/response formats, error codes
4. Frontend codebase — SvelteKit with Cloudflare Pages adapter (or static HTML/JS)
5. API Worker — handles all HTTP routes: submission, browse, search, upvote, admin
6. Anti-fake implementation — Turnstile integration, honeypot field, timing validation, IP rate limiting (KV counters)

### Write Pipeline
7. Queue Producer — submission validation + Turnstile check + IP rate limit check → push to Queue
8. Queue Consumer Worker — batch D1 writes, incremental aggregates, inline moderation, KV cache invalidation
9. Moderation logic — hospital name blocklist (KV), PII regex patterns, profanity list, redaction + logging

### Caching Layer
10. KV cache schema — key patterns, TTLs, version-based invalidation logic
11. Cache warming script — pre-populate KV on first deploy for top city+procedure combos

### Agents (Cron Triggers + GitHub Actions)
12. Anomaly detection agent — Cron Trigger, every 6 hours
13. Full aggregate recompute — Cron Trigger, weekly
14. Cleanup agent — Cron Trigger, daily
15. Health check agent — Cron Trigger, every 30 minutes + Telegram bot integration
16. Content generation agent — GitHub Action, twice weekly + Satori card templates
17. SEO page generator — GitHub Action, twice weekly + page templates + sitemap generation

### Design & Frontend
18. Design system — colors, typography, components (Tailwind config)
19. Landing page design + implementation
20. Submission form UX + implementation (fully anonymous, no login)
21. Browse/explore UX + implementation (procedure pages, city pages, absurd feed, pagination)
22. Social card templates — Satori JSX templates for auto-generated cards
23. Admin dashboard — flagged reports, moderation queue, system health, Queue depth, quarantine rate

### Infrastructure
24. Cloudflare config — wrangler.toml with D1, KV, R2, Queue, Turnstile bindings + Cron schedules
25. Scaling runbook — thresholds, actions, and procedures for each scaling trigger (see Infrastructure Scaling Thresholds)
26. Monitoring setup — Telegram bot config, alert rules, escalation procedures
27. Load testing plan — simulate 10K writes/day + 500K reads/day, identify bottlenecks before launch

### Launch & Legal
28. Launch checklist — seeding plan, community posting templates, social card schedule
29. Legal documents — Terms of Service, Privacy Policy, Content Disclaimer
30. README — setup instructions, architecture overview, deployment guide, cost tracking
