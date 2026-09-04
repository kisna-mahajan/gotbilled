-- Add 'velocity' to moderation_log.redaction_reason CHECK constraint
-- Needed because submit.ts velocity flagging uses this value
PRAGMA foreign_keys=OFF;

CREATE TABLE moderation_log_new (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL REFERENCES reports(id),
  field_name TEXT NOT NULL,
  original_text TEXT NOT NULL,
  redaction_reason TEXT NOT NULL CHECK(redaction_reason IN ('hospital_name', 'doctor_name', 'pii', 'profanity', 'velocity')),
  reviewed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO moderation_log_new SELECT * FROM moderation_log;

DROP TABLE moderation_log;
ALTER TABLE moderation_log_new RENAME TO moderation_log;

CREATE INDEX idx_moderation_pending ON moderation_log(reviewed) WHERE reviewed = 0;

PRAGMA foreign_keys=ON;
