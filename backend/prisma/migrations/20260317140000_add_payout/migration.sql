-- Add payout UPI ID field to User table
ALTER TABLE "User" ADD COLUMN "payoutUpiId" TEXT;

-- Create Payout table (tracks automatic lender payouts on booking completion)
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "lenderId" TEXT NOT NULL,
    "upiId" TEXT NOT NULL,
    "amountInPaise" INTEGER NOT NULL,
    "razorpayPayoutId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- One payout per booking
CREATE UNIQUE INDEX "Payout_bookingId_key" ON "Payout"("bookingId");

-- Foreign key to Booking
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_bookingId_fkey"
    FOREIGN KEY ("bookingId") REFERENCES "Booking"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
