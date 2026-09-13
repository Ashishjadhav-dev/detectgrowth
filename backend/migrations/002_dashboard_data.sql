CREATE TABLE IF NOT EXISTS dashboard_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  urgency TEXT NOT NULL DEFAULT 'Medium',
  due TEXT NOT NULL DEFAULT 'Today',
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS watchlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  delta TEXT NOT NULL DEFAULT '0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, company_id)
);

CREATE INDEX IF NOT EXISTS dashboard_insights_workspace_idx ON dashboard_insights(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS tasks_workspace_idx ON tasks(workspace_id, completed, created_at DESC);
CREATE INDEX IF NOT EXISTS activity_events_workspace_idx ON activity_events(workspace_id, created_at DESC);

INSERT INTO dashboard_insights (workspace_id, body)
SELECT w.id, seed.body FROM workspaces w
CROSS JOIN (VALUES
  ('Stripe raised $4.5B Series I two hours ago'),
  ('13 companies entered your ICP yesterday'),
  ('28 marketing roles opened across target accounts')
) AS seed(body)
WHERE w.slug = 'detectgrowth-local'
  AND NOT EXISTS (SELECT 1 FROM dashboard_insights WHERE workspace_id = w.id);

INSERT INTO tasks (workspace_id, label, urgency, due)
SELECT w.id, seed.label, seed.urgency, seed.due FROM workspaces w
CROSS JOIN (VALUES
  ('Follow up with Databricks', 'High', 'Today'),
  ('Review 15 new signals', 'Medium', 'Today'),
  ('Call Sarah at Notion', 'High', 'Tomorrow'),
  ('Prepare Acme Corp proposal', 'Medium', 'Tomorrow'),
  ('Connect with new leads', 'Low', 'May 30')
) AS seed(label, urgency, due)
WHERE w.slug = 'detectgrowth-local'
  AND NOT EXISTS (SELECT 1 FROM tasks WHERE workspace_id = w.id);

INSERT INTO activity_events (workspace_id, body)
SELECT w.id, seed.body FROM workspaces w
CROSS JOIN (VALUES
  ('You added 32 companies to AI Startup lists'),
  ('Sarah commented on Acme Corp'),
  ('You starred product-led growth signals'),
  ('Deal closed: NITRO - $120K')
) AS seed(body)
WHERE w.slug = 'detectgrowth-local'
  AND NOT EXISTS (SELECT 1 FROM activity_events WHERE workspace_id = w.id);
