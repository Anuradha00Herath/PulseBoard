CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('viewer', 'editor', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  layout_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Per-dashboard access. The dashboard owner always has full CRUD (see owner_id
-- on dashboards); this table grants additional viewer/editor access to other
-- users for FR2/FR13 collaborative editing. No row = no access.
CREATE TABLE IF NOT EXISTS dashboard_collaborators (
  dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('viewer', 'editor')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (dashboard_id, user_id)
);

CREATE TABLE IF NOT EXISTS widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('line_chart', 'counter', 'bar_chart', 'table')),
  metric_query TEXT NOT NULL,
  position JSONB NOT NULL DEFAULT '{}'
);
