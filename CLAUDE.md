# gotbilled.in — Project Documentation

## What This Is

An anonymous, crowdsourced platform where Indians share what they were actually billed for medical procedures. The core content format is **"quoted price vs. final bill"** — exposing the gap between what hospitals estimate and what patients actually pay.

No hospital names. Data aggregated by city and hospital tier. Fully anonymous — no login, no email, no phone.

## Tech Stack

- **Frontend:** SvelteKit + Tailwind CSS on Cloudflare Pages (free, unlimited bandwidth)
- **Backend:** Cloudflare Workers (API layer, $5/mo paid plan)
- **Database:** Cloudflare D1 (serverless SQLite, $5/mo paid plan)
- **Cache:** Cloudflare KV ($5/mo paid plan, serves 95% of reads)
- **Write buffer:** Cloudflare Queue (~₹10/mo, buffers writes for batch D1 inserts)
- **Image storage:** Cloudflare R2 (free tier, for social cards)
- **Bot protection:** Cloudflare Turnstile (free, invisible)
- **Social cards:** GitHub Actions (free) with Satori + Sharp
- **Domain:** gotbilled.in

**Total monthly cost at 10K entries/day: ~₹1,300 (~$15)**

## Approved Specs

Two documents define the product:

- `gotbilled-project-brief.md` — Full technical architecture, schema design, anti-fake layers, caching strategy, agents, scaling thresholds
- `gotbilled-planning-document.md` — Viewer value map, view definitions, form field traceability, data points per view, internal KPIs, analytics architecture

### Key Decisions from Planning Phase

1. **REMOVED** `bed_count_range` field — adds form length without powering a critical view
2. **REMOVED** `experience_rating` field — star ratings are noisy; surprise % IS the sentiment
3. **PROMOTED** `insurance_used` to required — low friction (3 radio buttons), high analytical value
4. **Form fields:** 8 required (procedure_type, city, state[auto], hospital_tier, insurance_used, quoted_amount, final_amount, procedure_year) + 2 optional (stay_days, surprise_charges)

## Cloudflare Account

- **D1 Database:** `gotbilled-db` (ID: `4189a828-2dbe-47ee-bf2a-d82210ec6f26`)
- **Schema deployed:** Yes — all 5 tables and 7 indexes created on remote D1
- **KV namespace:** `CACHE` (ID: `ce40d4a2eb984d9d8efe68ac6b8c414f`) — created, wired into Worker
- **Queue:** `gotbilled-submissions` — created, wired as producer + consumer in Worker
- **Worker URL:** `https://gotbilled.gotbilled.workers.dev` — deployed and live
- **Workers subdomain:** `gotbilled.workers.dev`
- Turnstile site key: Not yet configured
- R2 bucket: Not yet created

## Database Schema

File: `migrations/0001_initial_schema.sql` (deployed to remote D1)

### Tables

| Table | Purpose | Rows at 10K/day |
|---|---|---|
| `reports` | One row per bill submission | ~300K/month |
| `surprise_items` | Individual line-item charges flagged by submitter | ~900K/month |
| `aggregates` | Pre-computed stats per city+procedure+tier (composite PK) | ~50K max |
| `upvote_tracking` | IP-hash-based dedup for upvotes | grows with engagement |
| `moderation_log` | Audit trail for auto-redactions | ~3% of reports |

### Indexes (kept minimal for write throughput)

- `idx_reports_city_procedure` — powers all aggregate queries
- `idx_reports_ip_hash` — rate limit lookups
- `idx_reports_created` — recent feed, time-based queries
- `idx_reports_flagged` — admin flagged reports queue
- `idx_surprise_items_report` — join to parent report
- `idx_surprise_items_upvotes` — absurd feed ranking
- `idx_moderation_pending` — partial index on unreviewed moderation items

## Project Structure

```
gotbilled/
├── CLAUDE.md                          ← this file (project context for AI sessions)
├── gotbilled-project-brief.md         ← full product spec
├── gotbilled-planning-document.md     ← approved planning document
├── wrangler.toml                      ← Cloudflare Worker config with D1 binding
├── package.json                       ← npm scripts (dev, deploy, db:migrate)
├── tsconfig.json                      ← TypeScript config (ES2022, strict)
├── migrations/
│   └── 0001_initial_schema.sql        ← D1 schema (deployed)
├── src/                               ← API Worker (Cloudflare Workers)
│   ├── worker.ts                      ← API entry point (URL routing, CORS, Queue consumer)
│   ├── types.ts                       ← TypeScript interfaces (Env, ReportInput, QueueMessage, row types)
│   ├── data.ts                        ← Constants (procedure types, cities, hospital tiers, limits)
│   ├── validation.ts                  ← validateReport() — honeypot, timing, field checks, structural flagging
│   ├── submit.ts                      ← handleSubmit() + handleUpvote() + processQueueBatch()
│   └── read.ts                        ← Read endpoints with KV caching
└── frontend/                          ← SvelteKit app (Cloudflare Pages)
    ├── package.json                   ← Frontend dependencies
    ├── svelte.config.js               ← SvelteKit config with Cloudflare Pages adapter
    ├── tailwind.config.js             ← Tailwind CSS config
    └── src/
        ├── app.html                   ← HTML shell
        ├── app.css                    ← Tailwind directives
        ├── lib/api.ts                 ← API client (calls Worker endpoints)
        └── routes/
            ├── +layout.svelte         ← Global layout (nav, footer)
            ├── +page.svelte           ← Homepage (stats, leaderboard, absurd charge)
            └── submit/+page.svelte    ← 3-step submission form
```

## Build Progress

### Completed

- [x] Project brief written and approved
- [x] Planning document written and approved (viewer value map, view definitions, form traceability, KPIs, analytics architecture)
- [x] Cloudflare account created
- [x] Domain purchased (gotbilled.in)
- [x] D1 database created (`gotbilled-db`)
- [x] Database schema designed and deployed to remote D1 (5 tables, 7 indexes)
- [x] `wrangler.toml` configured with D1 binding
- [x] Architecture diagram created (see artifact)
- [x] Project scaffolding (package.json, tsconfig.json, .gitignore)
- [x] API Worker — submission endpoint with validation gauntlet (honeypot, timing, IP rate limit, structural flagging, D1 batch writes, incremental aggregate updates)
- [x] API Worker — read endpoints (stats, city page, procedure page, absurd feed, calculator, recent feed, cities list, procedures list)
- [x] API Worker — upvote endpoint with IP-hash dedup
- [x] KV cache wired into all read endpoints (TTLs: 1h aggregates, 15min absurd, 5min feeds)
- [x] Queue wired for submission buffering (producer + consumer with per-message ack/retry)
- [x] Worker deployed to `https://gotbilled.gotbilled.workers.dev`
- [x] Frontend scaffolding — SvelteKit + Tailwind CSS + Cloudflare Pages adapter
- [x] Homepage — hero stats, city leaderboard, top absurd charge, how-it-works
- [x] Submission form — 3-step form (procedure/location, amounts, surprise charges + submit)

### Next Up

### Future (not started)

- [ ] Cron Triggers — anomaly detection, aggregate recompute, cleanup, health check
- [ ] Content generation — social card templates (Satori), GitHub Actions workflow
- [ ] SEO page generator — static landing pages for city+procedure combos
- [ ] Admin dashboard — flagged reports, moderation queue, system health
- [ ] Turnstile integration
- [ ] R2 bucket for image storage
- [ ] Telegram bot for admin alerts

## Architecture Quick Reference

**Write path:** User → Turnstile → API Worker (validate) → Queue → Consumer Worker (batch write) → D1 + KV invalidation. User gets confirmation immediately; report appears in feeds within 1–2 minutes.

**Read path:** User → Cloudflare Pages (static assets) + API Worker → KV Cache (95% hit) → D1 (5% miss). Cache TTLs: 1h aggregates, 5min feeds, 15min absurd items.

**Anti-fake layers (7):** Turnstile → honeypot → timing check → IP rate limit → structural validation → async anomaly detection → aggregation threshold (≥5 reports before showing stats).

**Two real bottlenecks:**
1. D1 single-writer model — managed by Queue buffering, works up to ~50K entries/day
2. Weekly aggregate recompute time — linear in row count, needs chunking past ~1M rows

## User Context

- The project owner is a **vibe coder** — no web development or hosting background
- Explain technical concepts in plain language when communicating
- All code decisions should prioritize simplicity and clarity
- The Cloudflare ecosystem was chosen specifically for low cost and operational simplicity
