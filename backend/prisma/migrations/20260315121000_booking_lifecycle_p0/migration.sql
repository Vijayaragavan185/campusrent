-- AlterTable
ALTER TABLE "Listing"
ADD COLUMN "blockedDates" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Booking"
ADD COLUMN "requestedReturnAt" TIMESTAMP(3),
ADD COLUMN "returnedAt" TIMESTAMP(3),
ADD COLUMN "completedAt" TIMESTAMP(3);