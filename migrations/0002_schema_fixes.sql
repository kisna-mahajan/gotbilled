-- Fix 1: aggregates table missing max_surprise_pct / min_surprise_pct columns
-- Code reads/writes these but migration only created median_final, min_final, max_final
ALTER TABLE aggregates ADD COLUMN max_surprise_pct REAL NOT NULL DEFAULT 0;
ALTER TABLE aggregates ADD COLUMN min_surprise_pct REAL NOT NULL DEFAULT 0;

-- Fix 2: upvote_tracking missing 'id' column that submit.ts tries to INSERT
ALTER TABLE upvote_tracking ADD COLUMN id TEXT;

-- Fix 3: insurance_used CHECK constraint doesn't include 'govt_scheme'
-- SQLite doesn't support ALTER CHECK, so we recreate the table
-- Step 1: Create new table with correct CHECK
CREATE TABLE reports_new (
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

-- Step 2: Copy data
INSERT INTO reports_new SELECT * FROM reports;

-- Step 3: Drop old, rename new
DROP TABLE reports;
ALTER TABLE reports_new RENAME TO reports;

-- Step 4: Recreate indexes
CREATE INDEX idx_reports_city_procedure ON reports(city, procedure_type);
CREATE INDEX idx_reports_ip_hash ON reports(ip_hash);
CREATE INDEX idx_reports_created ON reports(created_at);
CREATE INDEX idx_reports_flagged ON reports(flagged);
