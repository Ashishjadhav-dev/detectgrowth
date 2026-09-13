CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'disabled')),
  email_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, name)
);

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS workspace_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id),
  title TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT,
  industry TEXT,
  location TEXT,
  employee_range TEXT,
  revenue_range TEXT,
  ownership_type TEXT,
  source TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS companies_workspace_idx ON companies(workspace_id);
CREATE INDEX IF NOT EXISTS companies_name_idx ON companies(workspace_id, name);
CREATE INDEX IF NOT EXISTS companies_domain_idx ON companies(workspace_id, domain);

CREATE TABLE IF NOT EXISTS people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  title TEXT,
  department TEXT,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  decision_score INTEGER CHECK (decision_score BETWEEN 0 AND 100),
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS people_workspace_idx ON people(workspace_id);
CREATE INDEX IF NOT EXISTS people_company_idx ON people(workspace_id, company_id);

CREATE TABLE IF NOT EXISTS signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  person_id UUID REFERENCES people(id) ON DELETE SET NULL,
  signal_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  impact TEXT NOT NULL DEFAULT 'medium' CHECK (impact IN ('high', 'medium', 'low')),
  confidence NUMERIC(5,2),
  source_type TEXT,
  source_url TEXT,
  detected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS signals_workspace_idx ON signals(workspace_id, detected_at DESC);

CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  pipeline_stage TEXT NOT NULL DEFAULT 'new',
  status TEXT NOT NULL DEFAULT 'open',
  score INTEGER CHECK (score BETWEEN 0 AND 100),
  priority TEXT NOT NULL DEFAULT 'medium',
  expected_value NUMERIC(14,2),
  next_action TEXT,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS opportunities_workspace_idx ON opportunities(workspace_id, status, score DESC);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO permissions (key, description) VALUES
  ('companies.read', 'Read companies'),
  ('companies.write', 'Create and edit companies'),
  ('people.read', 'Read people'),
  ('people.write', 'Create and edit people'),
  ('signals.read', 'Read signals'),
  ('opportunities.read', 'Read opportunities'),
  ('opportunities.write', 'Create and edit opportunities'),
  ('workspace.manage', 'Manage workspace members and settings')
ON CONFLICT (key) DO NOTHING;
