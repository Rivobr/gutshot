-- Месячный рейтинг вместо недельного: топ-27 месяца получают место в Финале месяца.
-- WeeklyFinalQualification остаётся в БД как история старого формата.

CREATE TABLE "MonthlyFinalQualification" (
    "id" TEXT NOT NULL,
    "monthKey" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "place" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonthlyFinalQualification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MonthlyFinalQualification_monthKey_userId_key"
  ON "MonthlyFinalQualification"("monthKey", "userId");
CREATE INDEX "MonthlyFinalQualification_monthKey_idx" ON "MonthlyFinalQualification"("monthKey");
CREATE INDEX "MonthlyFinalQualification_userId_idx" ON "MonthlyFinalQualification"("userId");

ALTER TABLE "MonthlyFinalQualification"
  ADD CONSTRAINT "MonthlyFinalQualification_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
