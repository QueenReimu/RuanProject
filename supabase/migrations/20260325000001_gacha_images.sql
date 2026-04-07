-- =====================================
-- Gacha Carousel Images Table
-- Ruan Joki - Created 2026-03-25
-- =====================================

CREATE TABLE IF NOT EXISTS gacha_images (
  id SERIAL PRIMARY KEY,
  src TEXT NOT NULL,
  alt TEXT NOT NULL DEFAULT '',
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_gacha_images_updated_at BEFORE UPDATE ON gacha_images
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE gacha_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read gacha_images" ON gacha_images FOR SELECT USING (TRUE);

-- Seed default data from existing hardcoded images
INSERT INTO gacha_images (src, alt, display_order) VALUES
  ('/11.png', 'Genshin Impact', 1),
  ('/22.png', 'Wuthering Waves', 2);
