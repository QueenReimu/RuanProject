-- =====================================
-- Admin Security + Analytics + Testimonials
-- Created 2026-04-06
-- =====================================

-- Visibility controls for existing master tables
ALTER TABLE games ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT FALSE;

-- Harden admin session rows
ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS user_agent_hash TEXT;
ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);

-- Login attempt rate-limit table (per IP)
CREATE TABLE IF NOT EXISTS admin_login_attempts (
  ip_address TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 0,
  blocked_until TIMESTAMPTZ,
  last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_blocked_until ON admin_login_attempts(blocked_until);

-- Testimonials images managed from dashboard
CREATE TABLE IF NOT EXISTS testimonials (
  id SERIAL PRIMARY KEY,
  src TEXT NOT NULL,
  alt TEXT NOT NULL DEFAULT '',
  caption TEXT NOT NULL DEFAULT '',
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site settings editable from dashboard
CREATE TABLE IF NOT EXISTS site_settings (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site visit tracking for daily/weekly/monthly statistics
CREATE TABLE IF NOT EXISTS site_visits (
  id BIGSERIAL PRIMARY KEY,
  visit_date DATE NOT NULL DEFAULT (timezone('utc', now())::date),
  visitor_hash TEXT NOT NULL,
  page_path TEXT NOT NULL DEFAULT '/',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(visit_date, visitor_hash, page_path)
);

CREATE INDEX IF NOT EXISTS idx_site_visits_visit_date ON site_visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_site_visits_page_path ON site_visits(page_path);

-- Ensure updated_at auto-updates where needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_testimonials_updated_at'
  ) THEN
    CREATE TRIGGER update_testimonials_updated_at
      BEFORE UPDATE ON testimonials
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_site_settings_updated_at'
  ) THEN
    CREATE TRIGGER update_site_settings_updated_at
      BEFORE UPDATE ON site_settings
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- RLS enable
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_login_attempts ENABLE ROW LEVEL SECURITY;

-- Public read testimonials for frontend
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'testimonials'
      AND policyname = 'Public read testimonials'
  ) THEN
    CREATE POLICY "Public read testimonials"
      ON testimonials
      FOR SELECT
      USING (TRUE);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'site_settings'
      AND policyname = 'Public read site_settings'
  ) THEN
    CREATE POLICY "Public read site_settings"
      ON site_settings
      FOR SELECT
      USING (TRUE);
  END IF;
END $$;
