-- Турнирные часы: структура уровней задаётся заранее, блайнды и перерывы
-- переключаются сами от clockStartedAt.

CREATE TYPE "ClockStatus" AS ENUM ('IDLE', 'RUNNING', 'PAUSED', 'FINISHED');

ALTER TABLE "Tournament"
  ADD COLUMN "clockStatus" "ClockStatus" NOT NULL DEFAULT 'IDLE',
  ADD COLUMN "clockStartedAt" TIMESTAMP(3),
  ADD COLUMN "clockLevelIdx" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "clockPausedAt" TIMESTAMP(3);

CREATE TABLE "BlindLevel" (
  "id" TEXT NOT NULL,
  "tournamentId" TEXT NOT NULL,
  "idx" INTEGER NOT NULL,
  "isBreak" BOOLEAN NOT NULL DEFAULT false,
  "smallBlind" INTEGER,
  "bigBlind" INTEGER,
  "ante" INTEGER,
  "durationSec" INTEGER NOT NULL,

  CONSTRAINT "BlindLevel_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BlindLevel_tournamentId_idx_key" ON "BlindLevel"("tournamentId", "idx");
CREATE INDEX "BlindLevel_tournamentId_idx" ON "BlindLevel"("tournamentId");

ALTER TABLE "BlindLevel"
  ADD CONSTRAINT "BlindLevel_tournamentId_fkey"
  FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;
