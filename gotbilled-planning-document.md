# gotbilled.in — Pre-Build Planning Document

**Status:** Awaiting approval before any code is written
**Date:** September 2, 2026

---

## 1. Viewer Value Map

Every person who visits gotbilled.in falls into one of these types. Each type has a question, a view that answers it, and a reason to share or return.

### 1A. Patient Planning a Procedure

- **Who:** Someone facing an upcoming surgery or procedure in India. Anxious about cost, shopping across hospitals, or trying to set expectations.
- **Core question:** "What should I realistically expect to pay for [procedure] in [city]?"
- **Secondary question:** "Which hospital tier gives me the best cost-to-honesty ratio?"
- **View that answers it:** Procedure Page (national averages + city comparison), City Page (tier breakdown), "Am I Being Overcharged?" Calculator
- **What makes them share:** Finding out their quote is way above/below average — they'll screenshot the comparison and send it to family WhatsApp groups deciding on hospitals.
- **What makes them return:** Bookmarking the calculator before their next procedure, or coming back post-procedure to report their own bill.
- **Data fields required:** `procedure_type`, `city`, `hospital_tier`, `quoted_amount`, `final_amount`

### 1B. Patient Who Just Got a Bill

- **Who:** Someone who just received a hospital bill that was higher than expected. Feeling frustrated, possibly outraged, wanting validation.
- **Core question:** "Was I overcharged compared to others?" / "I want someone to know what happened to me."
- **View that answers it:** Submission Form (catharsis — the act of reporting), Confirmation Page (validation — "you're helping others"), Procedure Page (comparison — "yes, yours was above average")
- **What makes them share:** The submission confirmation card ("I just reported my bill on gotbilled.in"), or discovering their surprise % is extreme and screenshot-sharing it.
- **What makes them return:** Checking if their report appears, browsing to see if others had similar experiences, submitting for future procedures.
- **Data fields required:** All form fields — this person is the contributor.

### 1C. Curious Browser / General Public

- **Who:** Someone who saw a social media card, a news article, or a WhatsApp forward about medical billing in India. No immediate procedure planned.
- **Core question:** "How bad is medical billing in India really?"
- **View that answers it:** Homepage (hero stat, city leaderboard, absurd feed), Absurd Bill Feed (entertainment layer)
- **What makes them share:** The absurd charges ("₹1,500 for ward AC maintenance?!"), city leaderboard position ("Mumbai is #2 worst!"), or the national surprise score.
- **What makes them return:** The absurd feed (entertainment value — scrollable, upvotable), checking updated city rankings after a viral moment.
- **Data fields required:** `quoted_amount`, `final_amount`, `city`, `surprise_charges` (free text)

### 1D. Journalist / Media

- **Who:** Health beat reporter, personal finance blogger, data journalist. Looking for a story backed by crowdsourced data.
- **Core question:** "What's the data saying about medical costs in India that I can report on?"
- **View that answers it:** Homepage (headline stats), Procedure Page (cross-city comparisons), City Page (local angle), Monthly Report Cards (pre-packaged stories), Social Cards page (/cards — downloadable, attribution-ready graphics)
- **What makes them share:** They publish articles citing the data. The shareable cards are ready-made illustrations for their pieces.
- **What makes them return:** Monthly report cards, new data thresholds ("gotbilled.in now has 100K reports"), story leads from trending procedures.
- **Data fields required:** Aggregated data from all core fields; sample sizes visible for credibility.

### 1E. Policy Advocate / NGO / Researcher

- **Who:** Patient rights groups, health policy researchers, academics studying healthcare costs, BIS standardization advocates.
- **Core question:** "What does the crowdsourced evidence say about billing transparency in India?"
- **View that answers it:** Procedure Page (cross-city data), City Page (tier comparisons showing government vs. private gaps), all aggregate views with visible sample sizes.
- **What makes them share:** Citing specific statistics in policy papers, presentations, or advocacy campaigns.
- **What makes them return:** Updated data as the platform grows, new procedure/city coverage.
- **Data fields required:** All aggregate fields with sample sizes, trend data (`procedure_year`, `created_at`)

### 1F. Insurance / Health-Tech Professional

- **Who:** Insurance product designers, TPA analysts, health-tech startups building cost estimation tools.
- **Core question:** "What do real-world medical costs look like across India, and how does insurance affect the final bill?"
- **View that answers it:** Procedure Page (insurance impact analysis), City Page (tier comparisons), future: Premium API.
- **What makes them share:** Internal reports, product development insights. Not social sharing — professional utility.
- **What makes them return:** Ongoing data feeds, new procedure coverage, API access (future monetization).
- **Data fields required:** `insurance_used`, `hospital_tier`, `procedure_type`, `city`, `quoted_amount`, `final_amount`

### Viewer → View → Field Traceability Summary

| Viewer Type | Primary View(s) | Critical Fields |
|---|---|---|
| Planning patient | Procedure Page, Calculator | procedure_type, city, hospital_tier, quoted_amount, final_amount |
| Post-bill patient | Submission Form, Procedure Page | All fields (contributor) |
| Curious browser | Homepage, Absurd Feed | quoted_amount, final_amount, city, surprise_charges |
| Journalist | Homepage, Report Cards, Social Cards | All aggregates + sample sizes |
| Policy advocate | Procedure Page, City Page | All aggregates + procedure_year (trends) |
| Insurance/health-tech | Procedure Page (insurance view) | insurance_used, hospital_tier, procedure_type, city, amounts |

---

## 2. View Definitions

### 2A. Homepage

- **What it shows:** National surprise score (headline %), total surprise amount reported (₹ crore), top 5 cities by surprise %, procedure spotlight (highest surprise % this week), absurd charge of the day, live submission counter.
- **Why a viewer cares:** Shock value on first visit. "Indians paid 43% more than quoted this month" is the hook that stops the scroll. The city leaderboard triggers local identity ("Is my city the worst?"). The absurd charge is pure entertainment.
- **Minimum data before useful:** 100 total reports across at least 3 cities. Below this, the national surprise score is unreliable, and the city leaderboard has too few entries. Show a "Help us reach 100 reports" CTA before threshold.
- **At 100 reports:** Functional but sparse. Show top 3 cities instead of 5. Procedure spotlight may only have 1-2 eligible procedures.
- **At 10,000 reports:** Rich. Full city leaderboard, multiple procedure spotlights rotatable, robust national average.
- **At 100,000 reports:** Add trend lines ("surprise score this month vs. last month"), weekly/monthly toggles, regional breakdowns.
- **Screenshot-ability:** YES — the national surprise score + city leaderboard is designed to be a single screenshot. The absurd charge card is independently screenshottable.

### 2B. City Page (/city/{city-name})

- **What it shows:** City surprise score (avg surprise %), procedure breakdown (each procedure's avg quoted vs. actual), tier comparison (corporate vs. private vs. government), cost range (min-max final bill per procedure), trend over time, recent reports feed (latest 20).
- **Why a viewer cares:** "How bad is it in MY city?" is deeply personal. Tier comparison answers "should I go to a big hospital or a small one?" Procedure breakdown helps someone planning a specific surgery.
- **Minimum data:** 20 reports for the city to show the city page at all. 5 reports per procedure to show that procedure's breakdown. 5 per tier to show tier comparison. Below these: "Only N reports for [procedure] in [city]. Share yours to help others."
- **At 100 reports (for one city):** Good procedure breakdown for 3-5 common procedures. Tier comparison may be skewed if one tier dominates.
- **At 10,000 reports (for one city):** Full breakdown across all procedures. Reliable tier comparisons. Trend lines become meaningful.
- **At 100,000 reports (for one city):** Sub-city breakdowns possible (neighborhoods/zones), seasonal trends, insurance impact per procedure.
- **Screenshot-ability:** YES — the city surprise score headline + procedure breakdown table. "Mumbai: C-sections cost 52% more than quoted. Based on 147 reports."

### 2C. Procedure Page (/cost/{procedure}/{city?})

- **What it shows:** National average cost (quoted vs. actual), city comparison map/chart (cheapest to most expensive), surprise score by city, insurance impact (insured vs. uninsured), cost per day (if stay_days data sufficient), common surprise charge items for this procedure.
- **Why a viewer cares:** "What does this typically cost?" is the #1 question for someone planning surgery. City comparison answers "should I travel?" Insurance impact answers "does insurance actually help?"
- **Minimum data:** 30 reports nationally for the procedure. 5 per city to show that city in the comparison. 10 insured + 10 uninsured for insurance impact. 20 with surprise items to show common charges.
- **At 100 reports:** National average is reliable. City comparison covers 3-5 major cities. Insurance impact may be showable if the split is favorable.
- **At 10,000 reports:** All cities covered. Insurance impact robust. Cost-per-day analysis possible. Common surprise charges well-established.
- **At 100,000 reports:** Year-over-year trend charts. Tier + city cross-tabulation. Seasonal cost patterns.
- **Screenshot-ability:** YES — the city comparison bar chart is designed for screenshots. "Appendectomy: cheapest in Jaipur (₹45K), most expensive in Mumbai (₹1.8L). Based on 892 reports."

### 2D. Absurd Bill Feed (/absurd)

- **What it shows:** Scrollable feed of individual surprise line items, each with description, amount, upvote count, procedure + city tag, auto-assigned category tag (phantom charges, inflated consumables, duplicate billing, vague fees). Sections: "Most upvoted this week," "Latest," browsable by category.
- **Why a viewer cares:** Entertainment + outrage. This is the "can you believe this?" layer that drives social sharing. It's the Twitter-like experience that keeps casual browsers engaged.
- **Minimum data:** 1 curated item to launch. 20+ items to feel like a real feed. Category filters need 10+ per category.
- **At 100 items:** Functional feed. "Most upvoted" section has enough to surface genuinely absurd items. Categories may be sparse.
- **At 10,000 items:** Rich browsing experience. Category filters meaningful. Weekly/monthly "hall of fame" possible.
- **At 100,000 items:** Searchable. Pattern detection ("43% of absurd charges in Delhi are 'bio-medical waste fees'"). Regional absurdity comparisons.
- **Screenshot-ability:** YES — each individual item card is designed to be screenshot-shared. This is the most viral element.

### 2E. "Am I Being Overcharged?" Calculator (/calculator)

- **What it shows:** User selects procedure + city + hospital tier. System shows: "Based on N reports, you should expect to pay ₹X–Y. If quoted ₹Z, that's [above/below/within] the typical range." Visual indicator (green/yellow/red gauge).
- **Why a viewer cares:** This is the decision tool. The reason someone bookmarks the site. Answers "is my quote fair?" with data.
- **Minimum data:** 5 reports for the specific procedure + city + tier combo. Below: "Not enough data for this combination yet. Here's the national average for [procedure] instead."
- **At 100 reports total:** Calculator works for 5-10 most common procedure+city combos. Falls back to national/city averages for the rest.
- **At 10,000 reports:** Covers most procedure+city combinations. Tier-level granularity reliable.
- **At 100,000 reports:** Highly specific ranges. Could add confidence intervals, show percentiles ("your quote is in the 85th percentile").
- **Screenshot-ability:** YES — the result card ("Your C-section quote of ₹2.5L is 35% above average for Mumbai corporate hospitals. Based on 67 reports.") is designed for screenshot sharing and WhatsApp forwarding.

### 2F. Submission Form (/report)

- **What it shows:** Multi-field form, fully anonymous, no login. Steps: bot protection (invisible) → form fields → confirmation summary → submission.
- **Why a viewer cares:** Catharsis (telling their story), altruism (helping others), and curiosity (seeing how their bill compares — shown on confirmation).
- **Minimum data:** N/A — this is a write view, not a read view.
- **Screenshot-ability:** The confirmation card is screenshot-worthy: "Your C-section bill surprise: +47%. You're helping 1.4 billion Indians make better decisions."

### 2G. Social Cards Page (/cards)

- **What it shows:** Auto-generated image cards: weekly city spotlight, procedure comparison, absurd item of the week, monthly report. Downloadable in image format.
- **Why a viewer cares:** Journalists grab cards for articles. Social media users grab cards for posts. The platform does the visualization work for them.
- **Minimum data:** Same thresholds as the underlying views they illustrate.
- **Screenshot-ability:** YES — these ARE the screenshots. Designed for WhatsApp/Twitter sharing.

### 2H. Admin Dashboard (/admin — authenticated, not public)

- **What it shows:** Daily submissions count, flagged reports queue, quarantine rate, moderation log, queue depth, system health alerts, top cities/procedures by volume, submission completion rate.
- **Why a viewer cares:** Operational necessity. Admin needs to make daily decisions: are fakes getting through? Is the queue backing up? Which cities need seeding?
- **Minimum data:** 1 report. Dashboard is useful from day one.

---

## 3. Form-to-Analytics Traceability Matrix

### Required Fields

| # | Form Field | Required? | Powers Which View(s) | Analytics Value | Drop-off Risk | Verdict |
|---|---|---|---|---|---|---|
| 1 | Procedure type | Yes | Every view — core dimension | Without this, nothing works. Every aggregate, every page, every comparison. | Low — dropdown, one tap | KEEP |
| 2 | City | Yes | City pages, maps, procedure comparisons, calculator | Core geographic dimension. Powers city leaderboard, local pages, cross-city comparisons. | Low — searchable dropdown | KEEP |
| 3 | State | Auto-filled | City pages (regional grouping), future state-level views | Auto-derived from city. Zero user effort. Enables future regional analysis. | Zero — auto-filled | KEEP |
| 4 | Hospital tier | Yes | Tier comparisons on city + procedure pages, calculator | Key segmentation. Answers "is a big hospital more expensive?" | Low — 4 radio buttons | KEEP |
| 5 | Quoted amount (₹) | Yes | Surprise score (THE metric), every comparison, calculator | Half of the core metric. Without this, the platform has no thesis. | Medium — requires recall, numeric input | KEEP |
| 6 | Final amount (₹) | Yes | Surprise score, every comparison, calculator | Other half of the core metric. | Medium — requires recall, numeric input | KEEP |
| 7 | Procedure year | Yes | Trend analysis, data freshness filtering | Ensures data recency. Allows "is it getting better or worse?" Prevents stale data from distorting current averages. | Low — dropdown, 3 options | KEEP |

### Optional Fields — Challenged

| # | Form Field | Required? | Powers Which View(s) | Analytics Value | Drop-off Risk | If 50% skip it | Verdict |
|---|---|---|---|---|---|---|---|
| 8 | Insurance used | Optional | Procedure page (insurance impact) | Answers "does insurance help?" — a high-value question. Three options (Yes/No/Partial), very low effort. | Low — 3 radio buttons | Still useful. 50% of data = thousands of reports per bucket at scale. Insurance impact view still works. | **PROMOTE TO REQUIRED** — low friction, high value |
| 9 | Stay days | Optional | Cost-per-day analysis | Secondary metric. Normalizes for different stay lengths. Useful but not core. | Low — number input | Cost-per-day view becomes unreliable. But this view is a nice-to-have, not core. | KEEP OPTIONAL |
| 10 | Bed count range | Optional | Tier granularity within a tier | Nice-to-have. Adds granularity to tier comparisons (a 50-bed private hospital ≠ a 500-bed one). | Low — 4 radio buttons | Tier comparison still works at the tier level. Bed count adds nuance but isn't essential. | **REMOVE** — adds form length without powering a critical view. Tier already captures the main segmentation. |
| 11 | Surprise charges (free text) | Optional | Absurd Feed, common charges on Procedure Page | Powers the viral/entertainment layer AND the "what hidden charges to watch for" utility. Dual value. | Medium — free text requires effort | Absurd feed becomes thin. "Common charges" on Procedure Page may lack data. But the feed can survive on 30-40% fill rate. | KEEP OPTIONAL — but redesign UX to make it easier (structured prompts: "Any charges that surprised you? e.g., 'gloves ₹200'") |
| 12 | Experience rating (1-5) | Optional | Sentiment overlay on city/procedure pages | Weak. Star ratings are noisy, subjective, and don't correlate well with cost data. At scale, everything regresses to 3.2 stars. | Low — 5 taps | View is barely affected because the view itself is low-value. | **REMOVE** — adds form length, powers no critical view. Sentiment is better captured by the surprise % itself (a 60% surprise IS the sentiment). |

### Revised Form Fields (Post-Challenge)

**Required (7 fields):** procedure_type, city, state (auto), hospital_tier, quoted_amount, final_amount, procedure_year

**Promoted to Required (1 field):** insurance_used — low friction (3 radio buttons), high analytical value

**Kept Optional (2 fields):** stay_days, surprise_charges

**Removed (2 fields):** bed_count_range, experience_rating

**Total user-facing fields:** 8 required (including auto-filled state) + 2 optional = 10 fields. Down from 12. Shorter form → higher completion rate → more data → better analytics.

---

## 4. Viewer-Facing Data Points

### 4A. Homepage Data Points

| # | Data Point | What It Shows | Why Someone Cares | Form Fields Needed | Min Sample | Screenshot-Worthy? | Graceful Degradation |
|---|---|---|---|---|---|---|---|
| 1 | National surprise score | "Indians paid __% more than quoted this month" | Shock value — THE headline number | quoted_amount, final_amount | 100 total | YES — the viral number | Below 100: "Early data from N reports suggests __% surprise. Help us reach 100." |
| 2 | Total surprise amount | "₹__ crore in bill surprises reported so far" | Scale/credibility signal | final_amount − quoted_amount, summed | 50 | YES | Below 50: "₹__ lakh in surprises reported so far" (use lakh instead of crore for smaller numbers) |
| 3 | City leaderboard | Top 5 cities by average surprise % | "Is my city the worst?" — triggers local sharing | city, quoted_amount, final_amount | 5 per city, ≥3 cities qualifying | YES | Show top 3 instead of 5 if only 3 cities qualify. Below 3: don't show leaderboard. |
| 4 | Procedure spotlight | Highest surprise % procedure this week | Curiosity, outrage | procedure_type, surprise_percentage | 10 for that procedure | YES | Show "all time" instead of "this week" if insufficient weekly data |
| 5 | Absurd charge of the day | Single most-upvoted surprise line item | Entertainment, "you won't believe this" | surprise_charges | 1 (curated) | YES — most shareable | If no upvoted items: show most recent surprise charge |
| 6 | Live counter | Reports submitted today (animated) | Social proof, momentum | created_at count | 0 | NO — only works live | Always show, even at zero ("Be today's first reporter") |

### 4B. City Page Data Points

| # | Data Point | What It Shows | Min Sample | Graceful Degradation |
|---|---|---|---|---|
| 1 | City surprise score | Average surprise % for this city | 20 reports for this city | Below 20: "Limited data (N reports). Share yours to unlock city stats." |
| 2 | Procedure breakdown | Each procedure's avg quoted vs. actual | 5 per procedure in this city | Show only procedures with ≥5 reports. Others listed as "needs more data — N/5 reports." |
| 3 | Tier comparison | Corporate vs. private vs. government avg costs | 5 per tier in this city | Show only tiers with ≥5 reports. Others grayed out with count. |
| 4 | Cost range | Min–Max final bill per procedure | 10 per procedure in this city | Below 10: show range but with "Limited data" badge. Below 5: don't show range. |
| 5 | Trend | Surprise gap over time (getting worse or better?) | 50 reports over ≥6 months | Below threshold: don't show trend section. Replace with "Trend data available after 50+ reports over 6 months." |
| 6 | Recent reports feed | Latest 20 reports from this city | 1 | Always show. If <20 reports, show all available. |

### 4C. Procedure Page Data Points

| # | Data Point | What It Shows | Min Sample | Graceful Degradation |
|---|---|---|---|---|
| 1 | National average cost | Avg quoted and avg final across all cities | 30 reports nationally | Below 30: "Early data (N reports). National average may shift as more reports come in." Show with caveat. |
| 2 | City comparison | Same procedure across cities — cheapest to most expensive | 5 per city shown | Show only cities with ≥5 reports. Others not listed. |
| 3 | Surprise score by city | Which cities have the biggest gap | 10 per city | Show only cities with ≥10. Others not listed. |
| 4 | Insurance impact | Avg final bill: insured vs. uninsured | 10 insured + 10 uninsured | Below threshold: "Not enough data to compare insured vs. uninsured yet. N insured, M uninsured reports so far." |
| 5 | Cost per day | Final bill ÷ stay days | 20 reports with stay_days filled | Below threshold: don't show section (stay_days is optional, may never hit threshold for rare procedures). |
| 6 | Common surprise charges | Most frequently reported surprise line items | 20 reports with surprise items | Below threshold: don't show section. Above 5 but below 20: "Reported surprise charges (limited data):" with a list. |

### 4D. Absurd Feed Data Points

| # | Data Point | What It Shows |
|---|---|---|
| 1 | Line item description + amount | "Ward air conditioning maintenance: ₹1,500" |
| 2 | Upvote count | Social validation — how many found this absurd |
| 3 | Procedure + city tag | Context: what procedure, which city |
| 4 | Category tag | Auto-categorized: phantom charges, inflated consumables, duplicate billing, vague fees |

### 4E. Calculator Data Points

| Input | Output | Min Sample | Graceful Degradation |
|---|---|---|---|
| Procedure + City + Tier | "Based on N reports, expect ₹X–Y. Your quote of ₹Z is [above/below/within] range." + visual gauge | 5 for exact combo | Fallback chain: (1) try procedure+city (any tier) → (2) try procedure nationally → (3) "Not enough data for this combination. Be the first to report!" Each fallback clearly labeled. |

---

## 5. Internal KPIs (Admin-Only)

### Platform Health

| KPI | Source | Target | Alert Threshold |
|---|---|---|---|
| Daily submissions | DB: COUNT reports WHERE created_at = today | Growth toward 10K/day | <50% of 7-day rolling avg |
| Submission completion rate | Frontend event: form_start vs. form_submit | >70% | <50% |
| Unique cities with ≥5 reports | DB: aggregate query | 5+ by month 1, 50+ by month 6 | Plateau for >2 weeks |
| Uptime | Health check agent (every 30 min) | 99.9% | Any downtime >5 min |
| Queue depth | Cloudflare Queue metrics | <100 pending | >1,000 |
| D1 write latency (p95) | Health check agent | <200ms | >500ms |

### Content Quality

| KPI | Source | Target | Alert Threshold |
|---|---|---|---|
| Quarantine rate | DB: COUNT quarantined / COUNT total (rolling 7 days) | <5% | >10% for 2+ weeks (triggers identity verification escalation) |
| Avg fields filled per report | DB: count non-null optional fields per report | ≥8.5 of 10 | <7 (suggests form UX issues) |
| Reports with surprise items | DB: % of reports with ≥1 surprise_item | >40% | <20% (absurd feed starving) |
| Duplicate report rate | Anomaly agent: same IP, same procedure+city within 24h | ~0% | >1% |
| Auto-redaction rate | DB: moderation_log count / reports count | <3% | >10% (may indicate field design issues) |

### Engagement

| KPI | Source | Target |
|---|---|---|
| Page views per visitor | Frontend analytics (Plausible/CF Web Analytics) | >3 |
| Return visitor rate (30 days) | Frontend analytics | >15% |
| Social card impressions/week | Twitter/Instagram API metrics | >25K by month 3 |
| Absurd feed engagement | Frontend: upvotes per item, scroll depth | Avg 5+ upvotes on top-10 items |
| Organic search traffic | Frontend analytics + Google Search Console | >50% of total traffic by month 6 |
| Calculator usage rate | Frontend event: calculator_used / total visitors | >10% |

### Impact

| KPI | Source | Target |
|---|---|---|
| Media mentions/month | Manual tracking + Google Alerts | 2+ by month 2 |
| Researcher citations | Manual tracking | 1+ by month 6 |
| Inbound from advocacy groups | Email/contact form tracking | 1+ by month 4 |

---

## 6. Analytics Architecture

### 6A. KPIs from the Database (D1)

These require no frontend instrumentation — they're computed from the reports, surprise_items, aggregates, and moderation_log tables:

- Daily submissions → `SELECT COUNT(*) FROM reports WHERE created_at >= date('now', '-1 day')`
- Unique cities with ≥5 reports → `SELECT COUNT(*) FROM (SELECT city FROM reports GROUP BY city HAVING COUNT(*) >= 5)`
- Quarantine rate → `SELECT CAST(SUM(quarantined) AS REAL) / COUNT(*) FROM reports WHERE created_at >= date('now', '-7 days')`
- Avg fields filled → computed in Queue Consumer, stored as a stat
- Reports with surprise items → `SELECT COUNT(DISTINCT report_id) FROM surprise_items` / total reports
- Duplicate rate → anomaly agent output
- Auto-redaction rate → `SELECT COUNT(*) FROM moderation_log` / total reports

**Delivery:** Admin dashboard queries D1 directly (admin traffic is negligible — no caching needed). Refreshed on page load.

### 6B. KPIs from Frontend Event Tracking

These require client-side instrumentation. Recommended tool: **Cloudflare Web Analytics** (free, privacy-respecting, no cookies) for page-level metrics, supplemented by lightweight custom events sent to a Worker endpoint for specific interactions:

- Page views per visitor → Cloudflare Web Analytics (built-in)
- Return visitor rate → Cloudflare Web Analytics (built-in, approximate — no cookies, uses heuristics)
- Organic search traffic → Cloudflare Web Analytics + Google Search Console (free, requires DNS verification)
- Submission completion rate → Custom events: `form_start` (on form page load) and `form_submit` (on successful submission) → sent to a `/api/event` Worker → tallied in D1 or KV
- Calculator usage rate → Custom event: `calculator_used` → same `/api/event` Worker
- Absurd feed scroll depth → Custom event: `absurd_scroll_{25|50|75|100}` → same endpoint

**Custom event schema (kept minimal):**
```
POST /api/event
{ "type": "form_start" | "form_submit" | "calculator_used" | "absurd_scroll_75", "page": "/report" }
```
No PII. No cookies. No session IDs. Just event type + page. Stored as daily counters in KV (`event:{type}:{date}` → increment).

### 6C. KPIs from External Sources

These cannot be instrumented — they require manual tracking or third-party APIs:

- Social card impressions → Twitter Analytics API, Instagram Insights API (polled by Content Generation agent, stored in D1 metadata table)
- Media mentions → Google Alerts (manual), or a simple admin form to log mentions
- Researcher citations → Manual tracking in admin dashboard
- Advocacy group inbound → Contact form submissions (a simple form → D1 table)

### 6D. Admin Dashboard MVP

The admin dashboard for v1 needs exactly what's required to make daily operational decisions. Nothing more.

**MVP Admin Dashboard — Single Page:**

Section 1: Today's Numbers (auto-refresh every 5 min)
- Submissions today (with sparkline for last 7 days)
- Queue depth (current)
- Quarantine rate (7-day rolling)

Section 2: Needs Attention
- Flagged reports awaiting review (count + link to list)
- Moderation log: recent auto-redactions (last 24h, expandable)
- Health alerts (from health check agent, last 24h)

Section 3: Coverage
- Cities with ≥5 reports (count + list)
- Procedures with ≥30 national reports (count + list)
- Total reports (all time)

Section 4: NOT in MVP (deferred)
- Engagement metrics (page views, return rates) — use Cloudflare Web Analytics directly
- Social card performance — check Twitter/Instagram directly
- Media mentions — manual for now
- Historical trend charts — premature until enough data

**Authentication:** Admin dashboard protected by Cloudflare Access (free for up to 50 users). Single admin email initially.

---

## Appendix A: Form Field ↔ View Traceability (Complete Cross-Reference)

This table ensures nothing is orphaned — every field powers at least one view, and every view can trace its data back to form fields.

| Form Field | Homepage | City Page | Procedure Page | Absurd Feed | Calculator | Social Cards |
|---|---|---|---|---|---|---|
| procedure_type | Procedure spotlight | Procedure breakdown | ALL data points | Tag on items | Input | Procedure cards |
| city | City leaderboard | ALL data points | City comparison | Tag on items | Input | City cards |
| state (auto) | — | Regional grouping (future) | — | — | — | — |
| hospital_tier | — | Tier comparison | — | — | Input | — |
| insurance_used | — | — | Insurance impact | — | — | — |
| quoted_amount | Surprise score, total amount | Procedure breakdown, tier comparison | National avg, city comparison, surprise by city | — | Range calculation | All stat cards |
| final_amount | Surprise score, total amount | Procedure breakdown, tier comparison, cost range | National avg, city comparison, insurance impact, cost/day | — | Range calculation | All stat cards |
| stay_days | — | — | Cost per day | — | — | — |
| procedure_year | — | Trend | — | — | — | Trend cards |
| surprise_charges | Absurd charge of day | — | Common charges | ALL data points | — | Absurd item cards |

**Orphan check:**
- `state`: Only powers future regional views. Kept because it's auto-filled (zero friction) and will become valuable at scale.
- `stay_days`: Powers only cost-per-day. This view requires the optional field AND ≥20 reports with it filled. Risk: may never reach threshold for rare procedures. Kept because it's low friction (one number) and cost-per-day is genuinely useful when available.
- Every other field powers ≥2 views. No orphaned fields.

**Missing field check (can any viewer question NOT be answered?):**
- "Is it getting better or worse?" → answered by `procedure_year` + `created_at` (system-generated). ✓
- "What hidden charges should I watch for?" → answered by `surprise_charges`. ✓
- "Does insurance help?" → answered by `insurance_used`. ✓
- "What's the range?" → answered by `quoted_amount` + `final_amount` (min/max from aggregates). ✓
- No viewer question from Section 1 is unanswerable with the current field set. ✓

---

## Appendix B: Decisions for Your Review

The following are recommendations that diverge from or refine the original brief. Each needs your explicit approval or rejection:

1. **REMOVE bed_count_range** — Original brief has it optional. I recommend removing it entirely. It adds a field without powering a critical view. Hospital tier already captures the main segmentation. If you want it back, it should stay optional.

2. **REMOVE experience_rating** — Original brief has it optional. Star ratings are noisy and don't add analytical value that surprise % doesn't already capture. If you want sentiment data, consider a future "How did billing make you feel?" free-text field instead (but not in v1).

3. **PROMOTE insurance_used to required** — Original brief has it optional. It's 3 radio buttons (Yes/No/Partial), near-zero friction, and powers the "does insurance help?" analysis which is one of the most decision-relevant views. Recommend making it required.

4. **Admin dashboard scope** — I've defined an MVP that's deliberately minimal (3 sections, 1 page). The brief mentions more comprehensive admin views. Recommend shipping the MVP and expanding based on what you actually need after the first month of data.

5. **Cost-per-day view risk** — This view depends on the optional `stay_days` field. If <30% of users fill it, this view may never have enough data for most procedures. Accept the risk (it's zero-cost to keep the field), or promote `stay_days` to required (adds friction for outpatient procedures like dental implants or dialysis where "stay days" doesn't apply).

---

*This document must be approved before any code is written. Every form field traces forward to a viewer-facing data point. Every view traces back to form fields. Nothing exists in the design that doesn't serve a viewer the user has approved.*
