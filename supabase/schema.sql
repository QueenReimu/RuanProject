-- =====================================================
-- SCHEMA: Ruan Joki Games V2
-- Jalankan script ini di Supabase SQL Editor
-- =====================================================

-- 1. GAMES table
CREATE TABLE IF NOT EXISTS games (
  id              SERIAL PRIMARY KEY,
  key             TEXT NOT NULL UNIQUE,
  label           TEXT NOT NULL,
  logo            TEXT,
  display_order   INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CATEGORIES table
CREATE TABLE IF NOT EXISTS categories (
  id              SERIAL PRIMARY KEY,
  game_id         INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  key             TEXT NOT NULL,
  label           TEXT NOT NULL,
  image           TEXT,
  display_order   INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, key)
);

-- 3. PRODUCTS table
CREATE TABLE IF NOT EXISTS products (
  id              SERIAL PRIMARY KEY,
  category_id     INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  price           TEXT NOT NULL,
  original_price  TEXT,
  discount        INTEGER DEFAULT 0,
  is_bestseller   BOOLEAN DEFAULT FALSE,
  is_hidden       BOOLEAN DEFAULT FALSE,
  image           TEXT,
  display_order   INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ADMINS (WhatsApp) table
CREATE TABLE IF NOT EXISTS admins (
  id              SERIAL PRIMARY KEY,
  key             TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  image           TEXT,
  wa_number       TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT '',
  description     TEXT NOT NULL DEFAULT '',
  is_active       BOOLEAN DEFAULT TRUE,
  display_order   INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 5. GACHA_IMAGES (Hero Carousel) table
CREATE TABLE IF NOT EXISTS gacha_images (
  id              SERIAL PRIMARY KEY,
  src             TEXT NOT NULL,
  alt             TEXT,
  is_hidden       BOOLEAN DEFAULT FALSE,
  display_order   INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SITE_SETTINGS table (untuk logo dll via admin panel)
CREATE TABLE IF NOT EXISTS site_settings (
  id              SERIAL PRIMARY KEY,
  key             TEXT NOT NULL UNIQUE,
  value           TEXT,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE games         ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE products      ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins        ENABLE ROW LEVEL SECURITY;
ALTER TABLE gacha_images  ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- PUBLIC READ (untuk frontend)
CREATE POLICY "public_read_games"         ON games         FOR SELECT USING (TRUE);
CREATE POLICY "public_read_categories"    ON categories    FOR SELECT USING (TRUE);
CREATE POLICY "public_read_products"      ON products      FOR SELECT USING (TRUE);
CREATE POLICY "public_read_admins"        ON admins        FOR SELECT USING (TRUE);
CREATE POLICY "public_read_gacha_images"  ON gacha_images  FOR SELECT USING (TRUE);
CREATE POLICY "public_read_site_settings" ON site_settings FOR SELECT USING (TRUE);

-- SERVICE ROLE (admin API - bypasses RLS automatically via service key)
-- Tidak perlu policy tambahan, service_role sudah bypass RLS by default
