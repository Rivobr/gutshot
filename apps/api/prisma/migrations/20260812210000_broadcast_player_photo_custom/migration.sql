-- AlterEnum
ALTER TYPE "BroadcastSegment" ADD VALUE IF NOT EXISTS 'SINGLE_PLAYER';

-- AlterEnum
ALTER TYPE "BroadcastButtons" ADD VALUE IF NOT EXISTS 'CUSTOM';

-- AlterTable
ALTER TABLE "BroadcastCampaign" ADD COLUMN IF NOT EXISTS "targetUserId" TEXT;
ALTER TABLE "BroadcastCampaign" ADD COLUMN IF NOT EXISTS "photoUrl" TEXT;
ALTER TABLE "BroadcastCampaign" ADD COLUMN IF NOT EXISTS "customButtons" JSONB;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BroadcastCampaign_targetUserId_idx" ON "BroadcastCampaign"("targetUserId");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'BroadcastCampaign_targetUserId_fkey'
  ) THEN
    ALTER TABLE "BroadcastCampaign"
      ADD CONSTRAINT "BroadcastCampaign_targetUserId_fkey"
      FOREIGN KEY ("targetUserId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
