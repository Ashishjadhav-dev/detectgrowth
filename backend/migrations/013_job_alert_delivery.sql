ALTER TABLE job_alerts
  ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS job_alerts_delivery_idx ON job_alerts(enabled, frequency, last_sent_at);
