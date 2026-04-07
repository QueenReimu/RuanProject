CREATE TABLE IF NOT EXISTS gacha_images (
  id SERIAL PRIMARY KEY,
  src TEXT NOT NULL,
  alt TEXT NOT NULL DEFAULT '',
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE gacha_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read gacha_images" ON gacha_images;
CREATE POLICY "Public read gacha_images" ON gacha_images FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Service role all gacha_images" ON gacha_images;
CREATE POLICY "Service role all gacha_images" ON gacha_images USING (auth.role() = 'service_role');

SELECT 'gacha_images table ready' as result;
