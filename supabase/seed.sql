-- =====================================
-- Seed Data for Ruan Joki Admin Dashboard
-- =====================================

-- Games
INSERT INTO games (key, label, logo, display_order) VALUES
  ('genshin', 'Genshin Impact', '/products/Genshin.jpg', 1),
  ('wuwa', 'Wuthering Waves', '/products/WutheringWaves.jpg', 2)
ON CONFLICT (key) DO NOTHING;

-- Categories (wuwa)
INSERT INTO categories (game_id, key, label, image, display_order)
SELECT g.id, 'astrite', 'Astrite', '/products/Asterite.png', 1
FROM games g WHERE g.key = 'wuwa'
ON CONFLICT (game_id, key) DO NOTHING;

INSERT INTO categories (game_id, key, label, image, display_order)
SELECT g.id, 'explore', 'Explore', '/pricelist/wuwa-explor (1).webp', 2
FROM games g WHERE g.key = 'wuwa'
ON CONFLICT (game_id, key) DO NOTHING;

INSERT INTO categories (game_id, key, label, image, display_order)
SELECT g.id, 'quest', 'Quest', '/pricelist/wuwa-quest.webp', 3
FROM games g WHERE g.key = 'wuwa'
ON CONFLICT (game_id, key) DO NOTHING;

INSERT INTO categories (game_id, key, label, image, display_order)
SELECT g.id, 'rawat-akun', 'Rawat Akun', '/pricelist/wuwa-rawatakun.webp', 4
FROM games g WHERE g.key = 'wuwa'
ON CONFLICT (game_id, key) DO NOTHING;

INSERT INTO categories (game_id, key, label, image, display_order)
SELECT g.id, 'benerin-akun', 'Benerin Akun', '/pricelist/wuwa-benerinakun.webp', 5
FROM games g WHERE g.key = 'wuwa'
ON CONFLICT (game_id, key) DO NOTHING;

-- Categories (genshin)
INSERT INTO categories (game_id, key, label, image, display_order)
SELECT g.id, 'primo', 'Primogem', '/products/Primogem.png', 1
FROM games g WHERE g.key = 'genshin'
ON CONFLICT (game_id, key) DO NOTHING;

-- Products: WuWa - Astrite
INSERT INTO products (category_id, title, description, price, original_price, discount, is_bestseller, image, display_order)
SELECT c.id, '1000 Astrite', 'Pilihan hemat untuk top-up ringan dan kebutuhan awal.', 'Rp13.000', 'Rp20.000', 35, FALSE, '/pricelist/wuwa-1k.jpeg', 1
FROM categories c JOIN games g ON c.game_id = g.id WHERE g.key = 'wuwa' AND c.key = 'astrite';

INSERT INTO products (category_id, title, description, price, original_price, discount, is_bestseller, image, display_order)
SELECT c.id, '1600 Astrite', 'Cocok untuk daily pull dan progres bertahap.', 'Rp20.000', 'Rp30.000', 33, FALSE, '/pricelist/wuwa-1_6k.jpeg', 2
FROM categories c JOIN games g ON c.game_id = g.id WHERE g.key = 'wuwa' AND c.key = 'astrite';

INSERT INTO products (category_id, title, description, price, original_price, discount, is_bestseller, image, display_order)
SELECT c.id, '3200 Astrite', 'Ideal untuk persiapan banner atau event terbatas.', 'Rp40.000', 'Rp60.000', 33, FALSE, '/pricelist/wuwa-3_2k.jpeg', 3
FROM categories c JOIN games g ON c.game_id = g.id WHERE g.key = 'wuwa' AND c.key = 'astrite';

INSERT INTO products (category_id, title, description, price, original_price, discount, is_bestseller, image, display_order)
SELECT c.id, '4800 Astrite', 'Lebih fleksibel untuk pull karakter atau senjata.', 'Rp55.000', 'Rp75.000', 27, FALSE, '/pricelist/wuwa-4_8k.jpeg', 4
FROM categories c JOIN games g ON c.game_id = g.id WHERE g.key = 'wuwa' AND c.key = 'astrite';

INSERT INTO products (category_id, title, description, price, original_price, discount, is_bestseller, image, display_order)
SELECT c.id, '6400 Astrite', 'Rekomendasi untuk pemain aktif yang serius push akun.', 'Rp75.000', 'Rp110.000', 32, FALSE, '/pricelist/wuwa-6_4k.jpeg', 5
FROM categories c JOIN games g ON c.game_id = g.id WHERE g.key = 'wuwa' AND c.key = 'astrite';

INSERT INTO products (category_id, title, description, price, original_price, discount, is_bestseller, image, display_order)
SELECT c.id, '8000 Astrite', 'Value besar untuk event besar dan banner favorit.', 'Rp95.000', 'Rp140.000', 32, FALSE, '/pricelist/wuwa-8k.jpeg', 6
FROM categories c JOIN games g ON c.game_id = g.id WHERE g.key = 'wuwa' AND c.key = 'astrite';

INSERT INTO products (category_id, title, description, price, original_price, discount, is_bestseller, image, display_order)
SELECT c.id, '10000 Astrite', 'Paket paling besar untuk kebutuhan top-up banyak.', 'Rp110.000', 'Rp160.000', 31, TRUE, '/pricelist/wuwa-10k.jpeg', 7
FROM categories c JOIN games g ON c.game_id = g.id WHERE g.key = 'wuwa' AND c.key = 'astrite';

-- Products: WuWa - Explore
INSERT INTO products (category_id, title, description, price, original_price, discount, is_bestseller, image, display_order)
SELECT c.id, 'HUANGLONG', 'Eksplorasi lengkap wilayah Huanglong 100% dengan semua chest dan puzzle.', 'Rp200.000', 'Rp280.000', 29, FALSE, '/pricelist/wuwa-huanglong.webp', 1
FROM categories c JOIN games g ON c.game_id = g.id WHERE g.key = 'wuwa' AND c.key = 'explore';

INSERT INTO products (category_id, title, description, price, original_price, discount, is_bestseller, image, display_order)
SELECT c.id, 'Black Shores', 'Eksplorasi lengkap wilayah blackshores 100% dengan semua chest dan puzzle.', 'Rp30.000', 'Rp45.000', 33, FALSE, '/pricelist/wuwa-blackshores.png', 2
FROM categories c JOIN games g ON c.game_id = g.id WHERE g.key = 'wuwa' AND c.key = 'explore';

INSERT INTO products (category_id, title, description, price, original_price, discount, is_bestseller, image, display_order)
SELECT c.id, 'Rinascita', 'Eksplorasi lengkap wilayah Rinascita 100% dengan semua chest dan puzzle.', 'Rp230.000', 'Rp320.000', 28, FALSE, '/pricelist/wuwa-rinascita.webp', 3
FROM categories c JOIN games g ON c.game_id = g.id WHERE g.key = 'wuwa' AND c.key = 'explore';

INSERT INTO products (category_id, title, description, price, original_price, discount, is_bestseller, image, display_order)
SELECT c.id, 'Lahai Roi', 'Eksplorasi lengkap wilayah Lahai Roi 100% note: Jika ingin 100% maka char harus mumpuni buat void strom.', 'Rp140.000', 'Rp200.000', 30, FALSE, '/pricelist/wuwa-lahairoi.webp', 4
FROM categories c JOIN games g ON c.game_id = g.id WHERE g.key = 'wuwa' AND c.key = 'explore';

INSERT INTO products (category_id, title, description, price, original_price, discount, is_bestseller, image, display_order)
SELECT c.id, 'Paket Explore All Area', '100% eksplorasi semua area di Wuthering Waves DENGAN DISKON GEDE.', 'Rp500.000', 'Rp750.000', 33, FALSE, '/pricelist/buling.png', 5
FROM categories c JOIN games g ON c.game_id = g.id WHERE g.key = 'wuwa' AND c.key = 'explore';

-- Products: WuWa - Quest
INSERT INTO products (category_id, title, description, price, original_price, discount, is_bestseller, image, display_order)
SELECT c.id, 'Story Quest', 'Selesaikan Story Quest untuk membuka map baru / malas story.', 'Rp10.000', 'Rp15.000', 33, FALSE, '/pricelist/story-quest.webp', 1
FROM categories c JOIN games g ON c.game_id = g.id WHERE g.key = 'wuwa' AND c.key = 'quest';

INSERT INTO products (category_id, title, description, price, original_price, discount, is_bestseller, image, display_order)
SELECT c.id, 'Companion Quest', 'Selesaikan Companion Quest untuk membereskan quest characters.', 'Rp8.000', 'Rp12.000', 33, FALSE, '/pricelist/companion-quest-wuwa.webp', 2
FROM categories c JOIN games g ON c.game_id = g.id WHERE g.key = 'wuwa' AND c.key = 'quest';

-- Products: WuWa - Rawat Akun
INSERT INTO products (category_id, title, description, price, original_price, discount, is_bestseller, image, display_order)
SELECT c.id, 'Daily', 'Daily commission dan aktivitas harian untuk akun tetap aktif.', 'Rp2.000', 'Rp3.500', 43, FALSE, '/pricelist/buling.png', 1
FROM categories c JOIN games g ON c.game_id = g.id WHERE g.key = 'wuwa' AND c.key = 'rawat-akun';

INSERT INTO products (category_id, title, description, price, original_price, discount, is_bestseller, image, display_order)
SELECT c.id, 'Weekly', 'Maintenance mingguan termasuk weekly boss dan aktivitas rutin.', 'Rp14.000', 'Rp20.000', 30, FALSE, '/pricelist/buling.png', 2
FROM categories c JOIN games g ON c.game_id = g.id WHERE g.key = 'wuwa' AND c.key = 'rawat-akun';

INSERT INTO products (category_id, title, description, price, original_price, discount, is_bestseller, image, display_order)
SELECT c.id, 'Monthly', 'Perawatan bulanan lengkap untuk menjaga akun optimal.', 'Rp60.000', 'Rp85.000', 29, FALSE, '/pricelist/buling.png', 3
FROM categories c JOIN games g ON c.game_id = g.id WHERE g.key = 'wuwa' AND c.key = 'rawat-akun';

INSERT INTO products (category_id, title, description, price, original_price, discount, is_bestseller, image, display_order)
SELECT c.id, '1 Patch', 'Full Perawatan selama 1 patch update game.', 'Rp80.000', 'Rp115.000', 30, FALSE, '/pricelist/buling.png', 4
FROM categories c JOIN games g ON c.game_id = g.id WHERE g.key = 'wuwa' AND c.key = 'rawat-akun';

-- Products: WuWa - Benerin Akun
INSERT INTO products (category_id, title, description, price, original_price, discount, is_bestseller, image, display_order)
SELECT c.id, 'Paket Build Character', 'mulai dari echo, level characters, level weapon, level up skill dll note: jika data bank kurang dari 25 dan level belum mumpun buat max level maka upgrade menyesuaikan level', 'Rp60.000', 'Rp90.000', 33, FALSE, '/pricelist/buling.png', 1
FROM categories c JOIN games g ON c.game_id = g.id WHERE g.key = 'wuwa' AND c.key = 'benerin-akun';

INSERT INTO products (category_id, title, description, price, original_price, discount, is_bestseller, image, display_order)
SELECT c.id, 'Paket Explore All Area', '100% eksplorasi semua area di Wuthering Waves DENGAN DISKON YANG GEDE.', 'Rp500.000', 'Rp750.000', 33, FALSE, '/pricelist/buling.png', 2
FROM categories c JOIN games g ON c.game_id = g.id WHERE g.key = 'wuwa' AND c.key = 'benerin-akun';

-- Products: Genshin - Primogem
INSERT INTO products (category_id, title, description, price, original_price, discount, is_bestseller, image, display_order)
SELECT c.id, '1000 Primogem', 'Top-up ringan untuk kebutuhan cepat.', 'Rp15.000', 'Rp20.000', 25, FALSE, '/pricelist/genshin-1k.jpeg', 1
FROM categories c JOIN games g ON c.game_id = g.id WHERE g.key = 'genshin' AND c.key = 'primo';

INSERT INTO products (category_id, title, description, price, original_price, discount, is_bestseller, image, display_order)
SELECT c.id, '1600 Primogem', 'Pas untuk daily wish dan simpanan awal.', 'Rp25.000', 'Rp30.000', 17, FALSE, '/pricelist/genshin-1_6k.jpeg', 2
FROM categories c JOIN games g ON c.game_id = g.id WHERE g.key = 'genshin' AND c.key = 'primo';

INSERT INTO products (category_id, title, description, price, original_price, discount, is_bestseller, image, display_order)
SELECT c.id, '3200 Primogem', 'Persiapan banner karakter favorit.', 'Rp50.000', 'Rp55.000', 9, FALSE, '/pricelist/genshin-3_2k.jpeg', 3
FROM categories c JOIN games g ON c.game_id = g.id WHERE g.key = 'genshin' AND c.key = 'primo';

INSERT INTO products (category_id, title, description, price, original_price, discount, is_bestseller, image, display_order)
SELECT c.id, '4800 Primogem', 'Lebih leluasa untuk pull karakter atau senjata.', 'Rp55.000', 'Rp65.000', 7, FALSE, '/pricelist/genshin-4_8k.jpeg', 4
FROM categories c JOIN games g ON c.game_id = g.id WHERE g.key = 'genshin' AND c.key = 'primo';

INSERT INTO products (category_id, title, description, price, original_price, discount, is_bestseller, image, display_order)
SELECT c.id, '6400 Primogem', 'Cocok untuk pemain aktif dan event besar.', 'Rp75.000', '90.000', 5, FALSE, '/pricelist/genshin-6_4k.jpeg', 5
FROM categories c JOIN games g ON c.game_id = g.id WHERE g.key = 'genshin' AND c.key = 'primo';

INSERT INTO products (category_id, title, description, price, original_price, discount, is_bestseller, image, display_order)
SELECT c.id, '8000 Primogem', 'Value tinggi untuk banner limited.', 'Rp100.000', 'Rp120.000', 4, FALSE, '/pricelist/genshin-8k.jpeg', 6
FROM categories c JOIN games g ON c.game_id = g.id WHERE g.key = 'genshin' AND c.key = 'primo';

INSERT INTO products (category_id, title, description, price, original_price, discount, is_bestseller, image, display_order)
SELECT c.id, '10000 Primogem', 'Paket paling besar untuk kebutuhan top-up banyak.', 'Rp140.000', 'Rp160.000', 6, TRUE, '/pricelist/genshin-10k.jpeg', 7
FROM categories c JOIN games g ON c.game_id = g.id WHERE g.key = 'genshin' AND c.key = 'primo';

-- Admin WhatsApp data
INSERT INTO admins (key, name, image, wa_number, is_active, display_order) VALUES
  ('admin1', 'Admin 1', '/pricelist/admin1.jpeg', '6283857809571', TRUE, 1),
  ('admin2', 'Admin 2', '/pricelist/admin2.jpeg', '6283144264995', TRUE, 2)
ON CONFLICT (key) DO NOTHING;
