-- gotbilled.in — Mock seed data (30 reports)
-- Run: npx wrangler d1 execute gotbilled-db --remote --file=seed.sql

-- ============================================================================
-- GROUP 1: Delhi + Knee Replacement + Corporate Chain (6 reports)
-- ============================================================================
INSERT INTO reports (id, ip_hash, procedure_type, city, state, hospital_tier, insurance_used, quoted_amount, final_amount, surprise_percentage, stay_days, procedure_year, flagged, quarantined)
VALUES
  ('seed-del-knee-01', 'seed-hash-01', 'knee_replacement', 'delhi', 'Delhi', 'corporate_chain', 'yes', 350000, 485000, 38.57, 5, 2025, 0, 0),
  ('seed-del-knee-02', 'seed-hash-02', 'knee_replacement', 'delhi', 'Delhi', 'corporate_chain', 'partial', 320000, 450000, 40.63, 6, 2025, 0, 0),
  ('seed-del-knee-03', 'seed-hash-03', 'knee_replacement', 'delhi', 'Delhi', 'corporate_chain', 'yes', 380000, 510000, 34.21, 4, 2026, 0, 0),
  ('seed-del-knee-04', 'seed-hash-04', 'knee_replacement', 'delhi', 'Delhi', 'corporate_chain', 'no', 400000, 520000, 30.00, 5, 2025, 0, 0),
  ('seed-del-knee-05', 'seed-hash-05', 'knee_replacement', 'delhi', 'Delhi', 'corporate_chain', 'yes', 330000, 475000, 43.94, 7, 2025, 0, 0),
  ('seed-del-knee-06', 'seed-hash-06', 'knee_replacement', 'delhi', 'Delhi', 'corporate_chain', 'partial', 360000, 490000, 36.11, 5, 2026, 0, 0);

INSERT INTO surprise_items (id, report_id, description, amount) VALUES
  ('seed-si-01', 'seed-del-knee-01', 'Implant cost upgrade without consent', 85000),
  ('seed-si-02', 'seed-del-knee-01', 'ICU charges for routine post-op', 32000),
  ('seed-si-03', 'seed-del-knee-02', 'Physiotherapy sessions billed separately', 45000),
  ('seed-si-04', 'seed-del-knee-03', 'Imported implant vs domestic quoted', 95000),
  ('seed-si-05', 'seed-del-knee-05', 'Room upgrade without asking', 28000),
  ('seed-si-06', 'seed-del-knee-06', 'Post-surgery knee brace at 3x MRP', 15000);

-- ============================================================================
-- GROUP 2: Mumbai + C-Section + Corporate Chain (6 reports)
-- ============================================================================
INSERT INTO reports (id, ip_hash, procedure_type, city, state, hospital_tier, insurance_used, quoted_amount, final_amount, surprise_percentage, stay_days, procedure_year, flagged, quarantined)
VALUES
  ('seed-mum-csec-01', 'seed-hash-07', 'c_section', 'mumbai', 'Maharashtra', 'corporate_chain', 'partial', 180000, 295000, 63.89, 4, 2025, 0, 0),
  ('seed-mum-csec-02', 'seed-hash-08', 'c_section', 'mumbai', 'Maharashtra', 'corporate_chain', 'yes', 200000, 310000, 55.00, 3, 2025, 0, 0),
  ('seed-mum-csec-03', 'seed-hash-09', 'c_section', 'mumbai', 'Maharashtra', 'corporate_chain', 'no', 220000, 340000, 54.55, 4, 2026, 0, 0),
  ('seed-mum-csec-04', 'seed-hash-10', 'c_section', 'mumbai', 'Maharashtra', 'corporate_chain', 'yes', 190000, 280000, 47.37, 3, 2025, 0, 0),
  ('seed-mum-csec-05', 'seed-hash-11', 'c_section', 'mumbai', 'Maharashtra', 'corporate_chain', 'partial', 175000, 268000, 53.14, 5, 2025, 0, 0),
  ('seed-mum-csec-06', 'seed-hash-12', 'c_section', 'mumbai', 'Maharashtra', 'corporate_chain', 'yes', 210000, 325000, 54.76, 4, 2026, 0, 0);

INSERT INTO surprise_items (id, report_id, description, amount) VALUES
  ('seed-si-07', 'seed-mum-csec-01', 'NICU charges for healthy baby', 45000),
  ('seed-si-08', 'seed-mum-csec-01', 'Surgeon fee above package', 35000),
  ('seed-si-09', 'seed-mum-csec-02', 'Paediatrician visit to newborn billed daily', 24000),
  ('seed-si-10', 'seed-mum-csec-03', 'Epidural anesthesia not in package', 30000),
  ('seed-si-11', 'seed-mum-csec-04', 'Consumables kit charged separately', 18000),
  ('seed-si-12', 'seed-mum-csec-06', 'Post-delivery room upgrade forced', 22000);

-- ============================================================================
-- GROUP 3: Bengaluru + Angioplasty + Private (5 reports)
-- ============================================================================
INSERT INTO reports (id, ip_hash, procedure_type, city, state, hospital_tier, insurance_used, quoted_amount, final_amount, surprise_percentage, stay_days, procedure_year, flagged, quarantined)
VALUES
  ('seed-blr-angio-01', 'seed-hash-13', 'angioplasty_stent', 'bengaluru', 'Karnataka', 'private_standalone', 'yes', 250000, 380000, 52.00, 3, 2025, 0, 0),
  ('seed-blr-angio-02', 'seed-hash-14', 'angioplasty_stent', 'bengaluru', 'Karnataka', 'private_standalone', 'yes', 220000, 340000, 54.55, 2, 2025, 0, 0),
  ('seed-blr-angio-03', 'seed-hash-15', 'angioplasty_stent', 'bengaluru', 'Karnataka', 'private_standalone', 'partial', 280000, 395000, 41.07, 3, 2026, 0, 0),
  ('seed-blr-angio-04', 'seed-hash-16', 'angioplasty_stent', 'bengaluru', 'Karnataka', 'private_standalone', 'no', 240000, 365000, 52.08, 2, 2025, 0, 0),
  ('seed-blr-angio-05', 'seed-hash-17', 'angioplasty_stent', 'bengaluru', 'Karnataka', 'private_standalone', 'yes', 260000, 410000, 57.69, 4, 2025, 0, 0);

INSERT INTO surprise_items (id, report_id, description, amount) VALUES
  ('seed-si-13', 'seed-blr-angio-01', 'Imported stent vs domestic quoted', 95000),
  ('seed-si-14', 'seed-blr-angio-02', 'Catheterization lab charges', 42000),
  ('seed-si-15', 'seed-blr-angio-04', 'Blood thinner medicines for 6 months', 35000),
  ('seed-si-16', 'seed-blr-angio-05', 'Second stent placed without discussion', 110000);

-- ============================================================================
-- GROUP 4: Chennai + Cataract Surgery + Private (5 reports)
-- ============================================================================
INSERT INTO reports (id, ip_hash, procedure_type, city, state, hospital_tier, insurance_used, quoted_amount, final_amount, surprise_percentage, stay_days, procedure_year, flagged, quarantined)
VALUES
  ('seed-che-cat-01', 'seed-hash-18', 'cataract_surgery', 'chennai', 'Tamil Nadu', 'private_standalone', 'yes', 35000, 72000, 105.71, NULL, 2025, 0, 0),
  ('seed-che-cat-02', 'seed-hash-19', 'cataract_surgery', 'chennai', 'Tamil Nadu', 'private_standalone', 'no', 30000, 58000, 93.33, NULL, 2025, 0, 0),
  ('seed-che-cat-03', 'seed-hash-20', 'cataract_surgery', 'chennai', 'Tamil Nadu', 'private_standalone', 'partial', 40000, 68000, 70.00, NULL, 2026, 0, 0),
  ('seed-che-cat-04', 'seed-hash-21', 'cataract_surgery', 'chennai', 'Tamil Nadu', 'private_standalone', 'yes', 38000, 75000, 97.37, NULL, 2025, 0, 0),
  ('seed-che-cat-05', 'seed-hash-22', 'cataract_surgery', 'chennai', 'Tamil Nadu', 'private_standalone', 'no', 32000, 65000, 103.13, NULL, 2026, 0, 0);

INSERT INTO surprise_items (id, report_id, description, amount) VALUES
  ('seed-si-17', 'seed-che-cat-01', 'Premium lens upgrade not discussed', 28000),
  ('seed-si-18', 'seed-che-cat-02', 'Eye drops and medications for 3 months', 12000),
  ('seed-si-19', 'seed-che-cat-03', 'Surgeon convenience fee', 15000),
  ('seed-si-20', 'seed-che-cat-04', 'Special lens coating charged extra', 22000),
  ('seed-si-21', 'seed-che-cat-05', 'Laser-assisted surgery upgrade', 25000);

-- ============================================================================
-- GROUP 5: Hyderabad + MRI Scan + Corporate Chain (5 reports)
-- ============================================================================
INSERT INTO reports (id, ip_hash, procedure_type, city, state, hospital_tier, insurance_used, quoted_amount, final_amount, surprise_percentage, stay_days, procedure_year, flagged, quarantined)
VALUES
  ('seed-hyd-mri-01', 'seed-hash-23', 'mri_scan', 'hyderabad', 'Telangana', 'corporate_chain', 'no', 8000, 14500, 81.25, NULL, 2026, 0, 0),
  ('seed-hyd-mri-02', 'seed-hash-24', 'mri_scan', 'hyderabad', 'Telangana', 'corporate_chain', 'yes', 7000, 12000, 71.43, NULL, 2025, 0, 0),
  ('seed-hyd-mri-03', 'seed-hash-25', 'mri_scan', 'hyderabad', 'Telangana', 'corporate_chain', 'no', 9000, 16000, 77.78, NULL, 2026, 0, 0),
  ('seed-hyd-mri-04', 'seed-hash-26', 'mri_scan', 'hyderabad', 'Telangana', 'corporate_chain', 'partial', 8500, 13500, 58.82, NULL, 2025, 0, 0),
  ('seed-hyd-mri-05', 'seed-hash-27', 'mri_scan', 'hyderabad', 'Telangana', 'corporate_chain', 'no', 7500, 14000, 86.67, NULL, 2025, 0, 0);

INSERT INTO surprise_items (id, report_id, description, amount) VALUES
  ('seed-si-22', 'seed-hyd-mri-01', 'Contrast dye charged separately', 4500),
  ('seed-si-23', 'seed-hyd-mri-02', 'CD/report printing charges', 1500),
  ('seed-si-24', 'seed-hyd-mri-03', 'Radiologist interpretation fee', 3500),
  ('seed-si-25', 'seed-hyd-mri-05', 'Sedation charges for anxious patient', 2500);

-- ============================================================================
-- SCATTERED REPORTS (3 different combos — for feed variety, below threshold)
-- ============================================================================
INSERT INTO reports (id, ip_hash, procedure_type, city, state, hospital_tier, insurance_used, quoted_amount, final_amount, surprise_percentage, stay_days, procedure_year, flagged, quarantined)
VALUES
  ('seed-jpr-gall-01', 'seed-hash-28', 'gallbladder_removal', 'jaipur', 'Rajasthan', 'trust', 'no', 35000, 42000, 20.00, 3, 2025, 0, 0),
  ('seed-kol-root-01', 'seed-hash-29', 'root_canal', 'kolkata', 'West Bengal', 'private_standalone', 'no', 8000, 15000, 87.50, NULL, 2026, 0, 0),
  ('seed-lko-frac-01', 'seed-hash-30', 'fracture_fixation', 'lucknow', 'Uttar Pradesh', 'government', 'no', 15000, 22000, 46.67, 4, 2025, 0, 0);

INSERT INTO surprise_items (id, report_id, description, amount) VALUES
  ('seed-si-26', 'seed-kol-root-01', 'Crown billed as separate procedure', 5000),
  ('seed-si-27', 'seed-lko-frac-01', 'Titanium plate cost not in estimate', 8000);

-- ============================================================================
-- AGGREGATES — pre-computed for the 5 main groups
-- ============================================================================

-- Delhi + knee_replacement + corporate_chain (6 reports)
INSERT INTO aggregates (city, procedure_type, hospital_tier, report_count, avg_quoted, avg_final, avg_surprise_pct, max_surprise_pct, min_surprise_pct)
VALUES ('delhi', 'knee_replacement', 'corporate_chain', 6,
  356666.67, 488333.33, 37.24, 43.94, 30.00);

-- Mumbai + c_section + corporate_chain (6 reports)
INSERT INTO aggregates (city, procedure_type, hospital_tier, report_count, avg_quoted, avg_final, avg_surprise_pct, max_surprise_pct, min_surprise_pct)
VALUES ('mumbai', 'c_section', 'corporate_chain', 6,
  195833.33, 303000.00, 54.79, 63.89, 47.37);

-- Bengaluru + angioplasty_stent + private_standalone (5 reports)
INSERT INTO aggregates (city, procedure_type, hospital_tier, report_count, avg_quoted, avg_final, avg_surprise_pct, max_surprise_pct, min_surprise_pct)
VALUES ('bengaluru', 'angioplasty_stent', 'private_standalone', 5,
  250000.00, 378000.00, 51.48, 57.69, 41.07);

-- Chennai + cataract_surgery + private_standalone (5 reports)
INSERT INTO aggregates (city, procedure_type, hospital_tier, report_count, avg_quoted, avg_final, avg_surprise_pct, max_surprise_pct, min_surprise_pct)
VALUES ('chennai', 'cataract_surgery', 'private_standalone', 5,
  35000.00, 67600.00, 93.91, 105.71, 70.00);

-- Hyderabad + mri_scan + corporate_chain (5 reports)
INSERT INTO aggregates (city, procedure_type, hospital_tier, report_count, avg_quoted, avg_final, avg_surprise_pct, max_surprise_pct, min_surprise_pct)
VALUES ('hyderabad', 'mri_scan', 'corporate_chain', 5,
  8000.00, 14000.00, 75.19, 86.67, 58.82);

-- ============================================================================
-- Add some upvotes to make the absurd feed interesting
-- ============================================================================
UPDATE surprise_items SET upvotes = 47 WHERE id = 'seed-si-04';
UPDATE surprise_items SET upvotes = 38 WHERE id = 'seed-si-16';
UPDATE surprise_items SET upvotes = 31 WHERE id = 'seed-si-01';
UPDATE surprise_items SET upvotes = 28 WHERE id = 'seed-si-10';
UPDATE surprise_items SET upvotes = 24 WHERE id = 'seed-si-07';
UPDATE surprise_items SET upvotes = 19 WHERE id = 'seed-si-17';
UPDATE surprise_items SET upvotes = 15 WHERE id = 'seed-si-21';
UPDATE surprise_items SET upvotes = 12 WHERE id = 'seed-si-14';
UPDATE surprise_items SET upvotes = 9 WHERE id = 'seed-si-27';
UPDATE surprise_items SET upvotes = 7 WHERE id = 'seed-si-06';
UPDATE surprise_items SET upvotes = 5 WHERE id = 'seed-si-22';
UPDATE surprise_items SET upvotes = 3 WHERE id = 'seed-si-26';
