-- gotbilled.in — Nuclear reset: drop all tables and recreate with correct schema
-- Applies all fixes from 0001-0004 in a single clean pass:
--   - reports: CHECK(insurance_used) includes 'govt_scheme'
--   - aggregates: includes max_surprise_pct, min_surprise_pct columns
--   - upvote_tracking: includes id column
--
-- WHY: Migration 0002 partially applied (aggregates ALTER succeeded, reports
-- recreation failed due to FK constraints). Migrations 0003/0004 also failed
-- because D1 enforces FK constraints server-side and PRAGMA foreign_keys=OFF
-- has no effect. Since the DB has no real user data, the safest path is to
-- drop everything in FK-safe order and recreate from scratch.
--
-- USAGE: Run via --command (--file uses D1 import API which returns auth error).
-- Split into 3 commands because --command has practical size limits:
--   Command 1: Drop all tables (this file, part 1)
--   Command 2: Create all tables + indexes (this file, part 2)
--   Command 3: Run seed.sql separately

-- =============================================================================
-- PART 1: DROP ALL TABLES IN FK-SAFE ORDER (children before parents)
-- =============================================================================
-- FK chain: upvote_tracking -> surprise_items -> reports
--           moderation_log -> reports
-- Drop children first, then parents.
DROP TABLE IF EXISTS upvote_tracking;
DROP TABLE IF EXISTS moderation_log;
DROP TABLE IF EXISTS surprise_items;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS reports_new;  -- cleanup from failed 0002/0003/0004 attempts
DROP TABLE IF EXISTS aggregates;

-- =============================================================================
-- PART 2: CREATE ALL TABLES WITH CORRECT SCHEMA
-- =============================================================================

-- REPORTS — one row per bill submission
CREATE TABLE reports (
  id TEXT PRIMARY KEY,
  ip_hash TEXT NOT NULL,
  procedure_type TEXT NOT NULL,
  procedure_other TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  hospital_tier TEXT NOT NULL CHECK(hospital_tier IN ('corporate_chain', 'private_standalone', 'government', 'trust')),
  insurance_used TEXT NOT NULL CHECK(insurance_used IN ('yes', 'no', 'partial', 'govt_scheme')),
  quoted_amount INTEGER NOT NULL CHECK(quoted_amount BETWEEN 100 AND 5000000),
  final_amount INTEGER NOT NULL CHECK(final_amount BETWEEN 100 AND 5000000),
  surprise_percentage REAL NOT NULL,
  stay_days INTEGER CHECK(stay_days BETWEEN 0 AND 365),
  procedure_year INTEGER NOT NULL,
  flagged INTEGER NOT NULL DEFAULT 0,
  quarantined INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_reports_city_procedure ON reports(city, procedure_type);
CREATE INDEX idx_reports_ip_hash ON reports(ip_hash);
CREATE INDEX idx_reports_created ON reports(created_at);
CREATE INDEX idx_reports_flagged ON reports(flagged);

-- SURPRISE ITEMS — individual line-item charges flagged by the submitter
CREATE TABLE surprise_items (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL REFERENCES reports(id),
  description TEXT NOT NULL,
  amount INTEGER,
  upvotes INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_surprise_items_report ON surprise_items(report_id);
CREATE INDEX idx_surprise_items_upvotes ON surprise_items(upvotes DESC);

-- AGGREGATES — pre-computed stats per city + procedure + tier
CREATE TABLE aggregates (
  city TEXT NOT NULL,
  procedure_type TEXT NOT NULL,
  hospital_tier TEXT NOT NULL,
  report_count INTEGER NOT NULL DEFAULT 0,
  avg_quoted REAL NOT NULL DEFAULT 0,
  avg_final REAL NOT NULL DEFAULT 0,
  avg_surprise_pct REAL NOT NULL DEFAULT 0,
  median_final REAL,
  min_final INTEGER,
  max_final INTEGER,
  max_surprise_pct REAL NOT NULL DEFAULT 0,
  min_surprise_pct REAL NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (city, procedure_type, hospital_tier)
);

-- UPVOTE TRACKING — prevents duplicate upvotes on surprise items (IP-based)
CREATE TABLE upvote_tracking (
  item_id TEXT NOT NULL REFERENCES surprise_items(id),
  ip_hash TEXT NOT NULL,
  id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (item_id, ip_hash)
);

-- MODERATION LOG — records auto-redactions for admin review
CREATE TABLE moderation_log (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL REFERENCES reports(id),
  field_name TEXT NOT NULL,
  original_text TEXT NOT NULL,
  redaction_reason TEXT NOT NULL CHECK(redaction_reason IN ('hospital_name', 'doctor_name', 'pii', 'profanity')),
  reviewed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_moderation_pending ON moderation_log(reviewed) WHERE reviewed = 0;
