# gotbilled.in — Approved Decisions Log

**Date:** September 2, 2026
**Context:** Pre-build planning phase completed in Cowork session. All decisions below are approved and final.

---

## Planning Document

The full planning document is in `gotbilled-planning-document.md`. It contains all 6 pre-build deliverables:

1. Viewer Value Map (6 viewer types mapped to views and fields)
2. View Definitions (8 views with scaling behavior and minimum data thresholds)
3. Form-to-Analytics Traceability Matrix
4. Viewer-Facing Data Points (per-view, with graceful degradation rules)
5. Internal KPIs (platform health, content quality, engagement, impact)
6. Analytics Architecture (DB vs frontend vs external source mapping, admin dashboard MVP)

---

## Key Decisions

### D1: Remove bed_count_range field
- **Decision:** REMOVE from form entirely
- **Reason:** Adds a field without powering a critical view. Hospital tier already captures the main segmentation.

### D2: Remove experience_rating field
- **Decision:** REMOVE from form entirely
- **Reason:** Star ratings are noisy at scale (everything regresses to ~3.2). Surprise percentage itself IS the sentiment signal.

### D3: Promote insurance_used to required
- **Decision:** REQUIRED (was optional in original brief)
- **Reason:** 3 radio buttons (Yes/No/Partial), near-zero friction, powers the high-value "does insurance help?" analysis on Procedure Pages.

### D4: Admin dashboard — minimal MVP
- **Decision:** Ship a single-page MVP with 3 sections: Today's Numbers, Needs Attention, Coverage
- **Reason:** Expand based on real operational needs after first month of data. Avoid building dashboards nobody uses.

### D5: stay_days remains optional
- **Decision:** KEEP OPTIONAL
- **Reason:** Powers only cost-per-day view. Doesn't apply to outpatient procedures (dental implants, dialysis). Accept that cost-per-day may lack data for rare procedures.

---

## Revised Form Fields (Post-Decisions)

**Required (8 fields):**
- procedure_type (dropdown)
- city (searchable dropdown)
- state (auto-filled from city)
- hospital_tier (4 radio buttons)
- insurance_used (3 radio buttons: Yes/No/Partial) — promoted from optional
- quoted_amount (₹ number input)
- final_amount (₹ number input)
- procedure_year (dropdown, last 3 years)

**Optional (2 fields):**
- stay_days (number input)
- surprise_charges (free text, one line per item, max 10 items, max 200 chars each)

**Removed (2 fields):**
- bed_count_range — cut for form brevity
- experience_rating — cut as analytically weak

**Total user-facing fields:** 8 required + 2 optional = 10 (down from 12 in original brief)

---

## Build Approach

- **Planning phase:** Done in Cowork
- **Build phase:** Claude Code (Code tab in Claude desktop app)
- **Repo:** github.com/kisna-mahajan/gotbilled (public)
- **Local path:** C:\Users\mahaj\OneDrive\05 Code\00 Claude Projects\08 Got Billed
- **First implementation step:** D1 database schema per approved planning document
- **Stack:** Cloudflare-first (Workers, D1, KV, Pages, Queue, Turnstile)

---

## Schema Changes from Original Brief

The original brief's schema in the `Technical Architecture` section needs these updates before implementation:

1. Remove `bed_count_range` column from `reports` table
2. Remove `experience_rating` column from `reports` table
3. Change `insurance_used` from optional to NOT NULL
4. Remove `bed_count_range` CHECK constraint
5. Remove `experience_rating` CHECK constraint
6. Keep `stay_days` as nullable (optional)
