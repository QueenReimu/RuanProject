-- =====================================
-- Games section content fields
-- Created 2026-04-06
-- =====================================

ALTER TABLE games ADD COLUMN IF NOT EXISTS banner TEXT NOT NULL DEFAULT '';
ALTER TABLE games ADD COLUMN IF NOT EXISTS tagline TEXT NOT NULL DEFAULT '';
ALTER TABLE games ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
ALTER TABLE games ADD COLUMN IF NOT EXISTS services TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Seed lightweight defaults for common existing rows if fields are still empty.
UPDATE games
SET
  banner = '/products/Genshin.jpg',
  tagline = 'Primo, explorasi, quest, rawat akun, benerin akun, aplikasi premium.',
  description = 'Layanan lengkap untuk kebutuhan harian maupun progres akun. Cocok untuk player yang ingin progres cepat namun tetap aman.',
  services = ARRAY['Primogem', 'Explorasi', 'Quest', 'Rawat Akun', 'Benerin Akun', 'Aplikasi Premium']
WHERE key = 'genshin'
  AND (
    banner = ''
    OR tagline = ''
    OR description = ''
    OR cardinality(services) = 0
  );

UPDATE games
SET
  banner = '/products/WutheringWaves.jpg',
  tagline = 'Astrite, exploration, quest, rawat akun, benerin akun.',
  description = 'Tim admin menangani order Wuthering Waves dengan alur yang jelas dan update berkala dari order awal hingga selesai.',
  services = ARRAY['Astrite', 'Explore', 'Quest', 'Rawat Akun', 'Benerin Akun', 'Build Character']
WHERE key = 'wuwa'
  AND (
    banner = ''
    OR tagline = ''
    OR description = ''
    OR cardinality(services) = 0
  );
