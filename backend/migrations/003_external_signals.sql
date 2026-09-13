CREATE UNIQUE INDEX IF NOT EXISTS signals_workspace_source_url_idx
  ON signals(workspace_id, source_url)
  WHERE source_url IS NOT NULL;
