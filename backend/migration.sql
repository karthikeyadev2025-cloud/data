-- ====================================================================
-- INeedLeads Migration: Add Saved Lists & Google Sheets Config
-- Run this in your Supabase SQL Editor to update your database.
-- This is safe to run on existing databases (will not overwrite data).
-- ====================================================================

-- 1. Add Google Sheets credentials column to platform_settings if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name='platform_settings' AND column_name='google_service_account_json'
  ) THEN
    ALTER TABLE platform_settings ADD COLUMN google_service_account_json TEXT;
  END IF;
END $$;

-- 2. Create lead_lists table (Saved Lists)
CREATE TABLE IF NOT EXISTS lead_lists (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  description TEXT,
  color       TEXT DEFAULT '#0EA5A4',
  count       INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Index for speed
CREATE INDEX IF NOT EXISTS idx_lists_tenant ON lead_lists(tenant_id, created_at DESC);

-- 3. Create lead_list_items junction table (saved contacts link)
CREATE TABLE IF NOT EXISTS lead_list_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id     UUID NOT NULL REFERENCES lead_lists(id) ON DELETE CASCADE,
  result_id   UUID NOT NULL REFERENCES search_results(id) ON DELETE CASCADE,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(list_id, result_id)
);

-- Indexes for joins
CREATE INDEX IF NOT EXISTS idx_list_items_list ON lead_list_items(list_id);
CREATE INDEX IF NOT EXISTS idx_list_items_result ON lead_list_items(result_id);

-- 4. Create trigger to keep updated_at current
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'lead_lists_updated_at'
  ) THEN
    CREATE TRIGGER lead_lists_updated_at
      BEFORE UPDATE ON lead_lists
      FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
  END IF;
END $$;
