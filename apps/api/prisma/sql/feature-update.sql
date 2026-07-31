-- GUTSHOT Poker Club — Feature Update
--
-- Идемпотентный скрипт для БД, созданной до появления постоянных QR-кодов,
-- истории событий, достижений и настраиваемого XP.
--
-- Для чистой базы этот файл не нужен: достаточно `pnpm --filter @gutshot/api prisma:migrate`.
-- Для уже работающей базы примените скрипт, а затем выполните
-- `prisma migrate resolve` или `prisma db pull`, чтобы состояния совпали.
--
-- Скрипт можно безопасно запускать повторно.

BEGIN;

-- ---------------------------------------------------------------
-- 1. Новые значения существующего enum XPReason
-- ---------------------------------------------------------------
ALTER TYPE "XPReason" ADD VALUE IF NOT EXISTS 'ATTENDANCE';
ALTER TYPE "XPReason" ADD VALUE IF NOT EXISTS 'ELIMINATION';
ALTER TYPE "XPReason" ADD VALUE IF NOT EXISTS 'RE_ENTRY';
ALTER TYPE "XPReason" ADD VALUE IF NOT EXISTS 'BOUNTY';
ALTER TYPE "XPReason" ADD VALUE IF NOT EXISTS 'ACHIEVEMENT';

COMMIT;

BEGIN;

-- ---------------------------------------------------------------
-- 2. Новые enum
-- ---------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PlayerEventType') THEN
    CREATE TYPE "PlayerEventType" AS ENUM (
      'TOURNAMENT_REGISTRATION',
      'TOURNAMENT_CANCELLED',
      'ARRIVED',
      'ELIMINATED',
      'RE_ENTRY',
      'BOUNTY',
      'FOUR_OF_A_KIND',
      'STRAIGHT_FLUSH',
      'ROYAL_FLUSH',
      'XP_CHANGE',
      'LEVEL_UP',
      'TOURNAMENT_RESULT',
      'ACHIEVEMENT_UNLOCKED'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AchievementCode') THEN
    CREATE TYPE "AchievementCode" AS ENUM ('FOUR_OF_A_KIND', 'STRAIGHT_FLUSH', 'ROYAL_FLUSH');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'XpSettingKey') THEN
    CREATE TYPE "XpSettingKey" AS ENUM (
      'ATTENDANCE', 'ELIMINATION', 'RE_ENTRY', 'BOUNTY',
      'FOUR_OF_A_KIND', 'STRAIGHT_FLUSH', 'ROYAL_FLUSH',
      'TOURNAMENT_WIN',
      'PLACE_2', 'PLACE_3', 'PLACE_4', 'PLACE_5', 'PLACE_6',
      'PLACE_7', 'PLACE_8', 'PLACE_9', 'PLACE_10'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LegalDocumentType') THEN
    CREATE TYPE "LegalDocumentType" AS ENUM (
      'CLUB_RULES', 'USER_AGREEMENT', 'PERSONAL_DATA_CONSENT', 'MEDIA_CONSENT'
    );
  END IF;
END
$$;

-- ---------------------------------------------------------------
-- 3. Новые поля существующих таблиц
-- ---------------------------------------------------------------
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "qrCode" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "consentAcceptedAt" TIMESTAMP(3);

ALTER TABLE "PlayerProfile" ADD COLUMN IF NOT EXISTS "reEntries" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "PlayerProfile" ADD COLUMN IF NOT EXISTS "bounties" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Registration" ADD COLUMN IF NOT EXISTS "arrivedAt" TIMESTAMP(3);
ALTER TABLE "Registration" ADD COLUMN IF NOT EXISTS "attendanceXpGiven" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Registration" ADD COLUMN IF NOT EXISTS "eliminatedAt" TIMESTAMP(3);
ALTER TABLE "Registration" ADD COLUMN IF NOT EXISTS "reEntries" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Registration" ADD COLUMN IF NOT EXISTS "bounties" INTEGER NOT NULL DEFAULT 0;

-- Уже прошедшие check-in регистрации считаем явившимися,
-- чтобы XP за посещение не начислился им повторно.
UPDATE "Registration"
SET "arrivedAt" = "checkedInAt", "attendanceXpGiven" = true
WHERE "checkedInAt" IS NOT NULL AND "arrivedAt" IS NULL;

-- ---------------------------------------------------------------
-- 4. Выдача постоянных QR-кодов существующим игрокам
-- ---------------------------------------------------------------
UPDATE "User"
SET "qrCode" = 'GS-' || upper(substr(translate(md5(random()::text || id), 'oil01', 'PQRST'), 1, 16))
WHERE "qrCode" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "User_qrCode_key" ON "User"("qrCode");
CREATE INDEX IF NOT EXISTS "User_qrCode_idx" ON "User"("qrCode");

-- ---------------------------------------------------------------
-- 5. Новые таблицы
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "PlayerEvent" (
  "id"            TEXT NOT NULL,
  "userId"        TEXT NOT NULL,
  "tournamentId"  TEXT,
  "type"          "PlayerEventType" NOT NULL,
  "xpAmount"      INTEGER NOT NULL DEFAULT 0,
  "metadata"      JSONB,
  "performedById" TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlayerEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PlayerEvent_userId_createdAt_idx" ON "PlayerEvent"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "PlayerEvent_tournamentId_idx" ON "PlayerEvent"("tournamentId");
CREATE INDEX IF NOT EXISTS "PlayerEvent_type_idx" ON "PlayerEvent"("type");

CREATE TABLE IF NOT EXISTS "Achievement" (
  "id"           TEXT NOT NULL,
  "userId"       TEXT NOT NULL,
  "code"         "AchievementCode" NOT NULL,
  "tournamentId" TEXT,
  "unlockedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Achievement_userId_code_key" ON "Achievement"("userId", "code");
CREATE INDEX IF NOT EXISTS "Achievement_userId_idx" ON "Achievement"("userId");

CREATE TABLE IF NOT EXISTS "XpSetting" (
  "key"       "XpSettingKey" NOT NULL,
  "value"     INTEGER NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "XpSetting_pkey" PRIMARY KEY ("key")
);

CREATE TABLE IF NOT EXISTS "LevelThreshold" (
  "level"      INTEGER NOT NULL,
  "requiredXp" INTEGER NOT NULL,
  "title"      TEXT,
  "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LevelThreshold_pkey" PRIMARY KEY ("level")
);

CREATE INDEX IF NOT EXISTS "LevelThreshold_requiredXp_idx" ON "LevelThreshold"("requiredXp");

CREATE TABLE IF NOT EXISTS "LegalDocument" (
  "type"        "LegalDocumentType" NOT NULL,
  "title"       TEXT NOT NULL,
  "content"     TEXT NOT NULL,
  "version"     INTEGER NOT NULL DEFAULT 1,
  "updatedById" TEXT,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LegalDocument_pkey" PRIMARY KEY ("type")
);

-- ---------------------------------------------------------------
-- 6. Внешние ключи
-- ---------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PlayerEvent_userId_fkey') THEN
    ALTER TABLE "PlayerEvent"
      ADD CONSTRAINT "PlayerEvent_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PlayerEvent_tournamentId_fkey') THEN
    ALTER TABLE "PlayerEvent"
      ADD CONSTRAINT "PlayerEvent_tournamentId_fkey"
      FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PlayerEvent_performedById_fkey') THEN
    ALTER TABLE "PlayerEvent"
      ADD CONSTRAINT "PlayerEvent_performedById_fkey"
      FOREIGN KEY ("performedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Achievement_userId_fkey') THEN
    ALTER TABLE "Achievement"
      ADD CONSTRAINT "Achievement_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LegalDocument_updatedById_fkey') THEN
    ALTER TABLE "LegalDocument"
      ADD CONSTRAINT "LegalDocument_updatedById_fkey"
      FOREIGN KEY ("updatedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;

COMMIT;

-- Значения XP, уровни и документы-заглушки создаются автоматически
-- при старте API (ProgressionModule и LegalModule).
