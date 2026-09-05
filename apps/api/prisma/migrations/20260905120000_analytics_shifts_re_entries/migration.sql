-- CreateEnum
CREATE TYPE "ReEntryKind" AS ENUM ('RE_ENTRY_1000', 'RE_ENTRY_1500', 'ADDON_1000');

-- CreateTable
CREATE TABLE "ReEntryLog" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "registrationId" TEXT,
    "userId" TEXT,
    "playerName" TEXT,
    "kind" "ReEntryKind" NOT NULL,
    "amount" INTEGER NOT NULL,
    "chips" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "ReEntryLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftEntry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "amount" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "ShiftEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReEntryLog_tournamentId_idx" ON "ReEntryLog"("tournamentId");

-- CreateIndex
CREATE INDEX "ReEntryLog_createdAt_idx" ON "ReEntryLog"("createdAt");

-- CreateIndex
CREATE INDEX "ShiftEntry_date_idx" ON "ShiftEntry"("date");

-- CreateIndex
CREATE INDEX "ShiftEntry_name_idx" ON "ShiftEntry"("name");

-- AddForeignKey
ALTER TABLE "ReEntryLog" ADD CONSTRAINT "ReEntryLog_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReEntryLog" ADD CONSTRAINT "ReEntryLog_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReEntryLog" ADD CONSTRAINT "ReEntryLog_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftEntry" ADD CONSTRAINT "ShiftEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
