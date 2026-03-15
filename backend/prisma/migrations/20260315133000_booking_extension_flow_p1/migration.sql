-- AlterTable
ALTER TABLE "Booking"
ADD COLUMN "extensionStatus" TEXT NOT NULL DEFAULT 'none',
ADD COLUMN "extensionRequestedEndDate" TIMESTAMP(3),
ADD COLUMN "extensionRequestedAt" TIMESTAMP(3),
ADD COLUMN "extensionResolvedAt" TIMESTAMP(3);