-- CreateEnum
CREATE TYPE "BroadcastStatus" AS ENUM ('DRAFT', 'SENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "BroadcastSegment" AS ENUM ('ALL_ACTIVE', 'TOURNAMENT_REGISTERED', 'TOURNAMENT_RSVP_PENDING');

-- CreateEnum
CREATE TYPE "BroadcastButtons" AS ENUM ('NONE', 'OPEN_APP', 'RSVP');

-- CreateEnum
CREATE TYPE "BroadcastDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "BroadcastCampaign" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "segment" "BroadcastSegment" NOT NULL,
    "tournamentId" TEXT,
    "buttons" "BroadcastButtons" NOT NULL DEFAULT 'NONE',
    "status" "BroadcastStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT,
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BroadcastCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BroadcastDelivery" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "telegramId" TEXT NOT NULL,
    "status" "BroadcastDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "telegramMessageId" INTEGER,
    "chatId" TEXT,
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BroadcastDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BroadcastCampaign_status_idx" ON "BroadcastCampaign"("status");

-- CreateIndex
CREATE INDEX "BroadcastCampaign_createdAt_idx" ON "BroadcastCampaign"("createdAt");

-- CreateIndex
CREATE INDEX "BroadcastCampaign_tournamentId_idx" ON "BroadcastCampaign"("tournamentId");

-- CreateIndex
CREATE INDEX "BroadcastDelivery_campaignId_idx" ON "BroadcastDelivery"("campaignId");

-- CreateIndex
CREATE INDEX "BroadcastDelivery_userId_idx" ON "BroadcastDelivery"("userId");

-- CreateIndex
CREATE INDEX "BroadcastDelivery_status_idx" ON "BroadcastDelivery"("status");

-- AddForeignKey
ALTER TABLE "BroadcastCampaign" ADD CONSTRAINT "BroadcastCampaign_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BroadcastCampaign" ADD CONSTRAINT "BroadcastCampaign_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BroadcastDelivery" ADD CONSTRAINT "BroadcastDelivery_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "BroadcastCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BroadcastDelivery" ADD CONSTRAINT "BroadcastDelivery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
