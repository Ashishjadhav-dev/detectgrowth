-- Persistent state used by the Vercel/Next.js API routes during the migration
-- from local .data storage to Neon PostgreSQL.
CREATE TABLE IF NOT EXISTS next_app_state (
  id TEXT PRIMARY KEY,
  state JSONB NOT NULL DEFAULT '{"accounts":[],"sessions":{},"workspaces":{}}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO next_app_state (id)
VALUES ('default')
ON CONFLICT (id) DO NOTHING;
