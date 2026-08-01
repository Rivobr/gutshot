-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "nickname" TEXT;

-- Для существующих игроков берём имя из Telegram как стартовый никнейм.
UPDATE "User"
SET "nickname" = NULLIF(TRIM(CONCAT(COALESCE("firstName", ''), CASE WHEN "lastName" IS NULL OR "lastName" = '' THEN '' ELSE ' ' || "lastName" END)), '')
WHERE "nickname" IS NULL;
