-- Прогрессия клуба по ТЗ: места 1–30, уровни 1–100,
-- каталог достижений и награды за неделю / финал месяца.

-- 1. Новые причины начисления XP
ALTER TYPE "XPReason" ADD VALUE IF NOT EXISTS 'WEEKLY_RATING';
ALTER TYPE "XPReason" ADD VALUE IF NOT EXISTS 'MONTHLY_FINAL';

-- 2. Новые типы событий игрока
ALTER TYPE "PlayerEventType" ADD VALUE IF NOT EXISTS 'WEEKLY_RATING_REWARD';
ALTER TYPE "PlayerEventType" ADD VALUE IF NOT EXISTS 'MONTHLY_FINAL_REWARD';
ALTER TYPE "PlayerEventType" ADD VALUE IF NOT EXISTS 'TUTORIAL_COMPLETED';
ALTER TYPE "PlayerEventType" ADD VALUE IF NOT EXISTS 'FRIEND_REFERRED';
ALTER TYPE "PlayerEventType" ADD VALUE IF NOT EXISTS 'SHORT_STACK_WIN';

-- 3. Места 21–30 и награды рейтинга в настройках XP
ALTER TYPE "XpSettingKey" ADD VALUE IF NOT EXISTS 'PLACE_21';
ALTER TYPE "XpSettingKey" ADD VALUE IF NOT EXISTS 'PLACE_22';
ALTER TYPE "XpSettingKey" ADD VALUE IF NOT EXISTS 'PLACE_23';
ALTER TYPE "XpSettingKey" ADD VALUE IF NOT EXISTS 'PLACE_24';
ALTER TYPE "XpSettingKey" ADD VALUE IF NOT EXISTS 'PLACE_25';
ALTER TYPE "XpSettingKey" ADD VALUE IF NOT EXISTS 'PLACE_26';
ALTER TYPE "XpSettingKey" ADD VALUE IF NOT EXISTS 'PLACE_27';
ALTER TYPE "XpSettingKey" ADD VALUE IF NOT EXISTS 'PLACE_28';
ALTER TYPE "XpSettingKey" ADD VALUE IF NOT EXISTS 'PLACE_29';
ALTER TYPE "XpSettingKey" ADD VALUE IF NOT EXISTS 'PLACE_30';
ALTER TYPE "XpSettingKey" ADD VALUE IF NOT EXISTS 'WEEKLY_TOP_1';
ALTER TYPE "XpSettingKey" ADD VALUE IF NOT EXISTS 'WEEKLY_TOP_2';
ALTER TYPE "XpSettingKey" ADD VALUE IF NOT EXISTS 'WEEKLY_TOP_3';
ALTER TYPE "XpSettingKey" ADD VALUE IF NOT EXISTS 'MONTHLY_TOP_1';
ALTER TYPE "XpSettingKey" ADD VALUE IF NOT EXISTS 'MONTHLY_TOP_2';
ALTER TYPE "XpSettingKey" ADD VALUE IF NOT EXISTS 'MONTHLY_TOP_3';

-- 4. Тип периода наград
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RatingPeriodType') THEN
    CREATE TYPE "RatingPeriodType" AS ENUM ('WEEKLY', 'MONTHLY');
  END IF;
END
$$;

-- 5. Достижения каталога
CREATE TABLE IF NOT EXISTS "PlayerAchievement" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "achievementId" TEXT NOT NULL,
  "xpAwarded" INTEGER NOT NULL DEFAULT 0,
  "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlayerAchievement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PlayerAchievement_userId_achievementId_key"
  ON "PlayerAchievement"("userId", "achievementId");
CREATE INDEX IF NOT EXISTS "PlayerAchievement_userId_idx" ON "PlayerAchievement"("userId");
CREATE INDEX IF NOT EXISTS "PlayerAchievement_achievementId_idx"
  ON "PlayerAchievement"("achievementId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PlayerAchievement_userId_fkey'
  ) THEN
    ALTER TABLE "PlayerAchievement"
      ADD CONSTRAINT "PlayerAchievement_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END
$$;

-- 6. Награды за недельный рейтинг и финал месяца
CREATE TABLE IF NOT EXISTS "RatingReward" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "periodType" "RatingPeriodType" NOT NULL,
  "periodKey" TEXT NOT NULL,
  "place" INTEGER NOT NULL,
  "xpAwarded" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RatingReward_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "RatingReward_userId_periodType_periodKey_key"
  ON "RatingReward"("userId", "periodType", "periodKey");
CREATE INDEX IF NOT EXISTS "RatingReward_periodType_periodKey_idx"
  ON "RatingReward"("periodType", "periodKey");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'RatingReward_userId_fkey'
  ) THEN
    ALTER TABLE "RatingReward"
      ADD CONSTRAINT "RatingReward_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END
$$;
