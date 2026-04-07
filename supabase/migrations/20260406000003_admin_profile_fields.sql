-- =====================================
-- Admin profile fields for Team section
-- Created 2026-04-06
-- =====================================

ALTER TABLE admins
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT '';

ALTER TABLE admins
  ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
