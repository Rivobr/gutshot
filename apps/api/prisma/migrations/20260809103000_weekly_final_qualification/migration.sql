-- CreateTable
CREATE TABLE "WeeklyFinalQualification" (
    "id" TEXT NOT NULL,
    "weekKey" TEXT NOT NULL,
    "monthKey" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekPlace" INTEGER NOT NULL,
    "weekPoints" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklyFinalQualification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WeeklyFinalQualification_monthKey_idx" ON "WeeklyFinalQualification"("monthKey");

-- CreateIndex
CREATE INDEX "WeeklyFinalQualification_userId_idx" ON "WeeklyFinalQualification"("userId");

-- CreateIndex
CREATE INDEX "WeeklyFinalQualification_weekKey_idx" ON "WeeklyFinalQualification"("weekKey");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyFinalQualification_weekKey_userId_key" ON "WeeklyFinalQualification"("weekKey", "userId");

-- AddForeignKey
ALTER TABLE "WeeklyFinalQualification" ADD CONSTRAINT "WeeklyFinalQualification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
