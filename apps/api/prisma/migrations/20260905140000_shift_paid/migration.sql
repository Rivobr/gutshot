-- AlterTable
ALTER TABLE "ShiftEntry" ADD COLUMN     "paid" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "ShiftEntry_paid_idx" ON "ShiftEntry"("paid");
