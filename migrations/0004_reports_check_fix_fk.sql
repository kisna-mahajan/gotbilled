-- Fix insurance_used CHECK constraint to include 'govt_scheme'
-- Disables FK checks so DROP TABLE reports succeeds despite surprise_items reference
PRAGMA foreign_keys=OFF;

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

INSERT INTO reports_new SELECT * FROM reports;

DROP TABLE reports;
ALTER TABLE reports_new RENAME TO reports;

CREATE INDEX idx_reports_city_procedure ON reports(city, procedure_type);
CREATE INDEX idx_reports_ip_hash ON reports(ip_hash);
CREATE INDEX idx_reports_created ON reports(created_at);
CREATE INDEX idx_reports_flagged ON reports(flagged);

PRAGMA foreign_keys=ON;
