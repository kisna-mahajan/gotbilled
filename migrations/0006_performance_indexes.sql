-- Performance indexes for explore/calculator queries at scale.
-- The overview and calculator endpoints filter on procedure_type, hospital_tier,
-- and insurance_used — columns not covered by the existing (city, procedure_type) index.
-- These indexes keep those queries fast at millions of rows.

-- Covers: procedure-only filters, procedure+tier combinations
CREATE INDEX IF NOT EXISTS idx_reports_procedure_tier ON reports(procedure_type, hospital_tier);

-- Covers: tier-only filters
CREATE INDEX IF NOT EXISTS idx_reports_hospital_tier ON reports(hospital_tier);

-- Covers: insurance breakdowns (GROUP BY insurance_used with WHERE on other cols)
CREATE INDEX IF NOT EXISTS idx_reports_insurance ON reports(insurance_used);
