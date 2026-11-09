CREATE TABLE IF NOT EXISTS job_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  workplace TEXT NOT NULL DEFAULT 'Unknown' CHECK (workplace IN ('Remote', 'Hybrid', 'On-site', 'Unknown')),
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  description TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL,
  posted_at TIMESTAMPTZ,
  department TEXT NOT NULL DEFAULT '',
  employment_type TEXT NOT NULL DEFAULT '',
  logo_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'hidden')),
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source, external_id)
);

CREATE INDEX IF NOT EXISTS job_listings_active_posted_idx ON job_listings(status, posted_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS job_listings_source_idx ON job_listings(source, status);
CREATE INDEX IF NOT EXISTS job_listings_search_idx ON job_listings USING gin (to_tsvector('simple', title || ' ' || company || ' ' || location || ' ' || department || ' ' || employment_type || ' ' || description));
