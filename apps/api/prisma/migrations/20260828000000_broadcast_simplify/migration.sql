ALTER TYPE "BroadcastDeliveryStatus" ADD VALUE IF NOT EXISTS 'DELETED';

ALTER TABLE "BroadcastCampaign" ADD COLUMN "targetTelegramId" TEXT;
ALTER TABLE "BroadcastCampaign" ADD COLUMN "photoPath" TEXT;
ALTER TABLE "BroadcastCampaign" ADD COLUMN "photoFileId" TEXT;

ALTER TABLE "BroadcastDelivery" ALTER COLUMN "userId" DROP NOT NULL;
