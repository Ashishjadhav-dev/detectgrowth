CREATE TABLE IF NOT EXISTS workspace_preferences (
  workspace_id UUID PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT '',
  goal TEXT NOT NULL DEFAULT '',
  signal_types JSONB NOT NULL DEFAULT '[]'::jsonb,
  onboarded BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
