// backend/src/services/payment.service.js
const Razorpay = require('razorpay');
const crypto = require('crypto');

function getRazorpayInstance() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

/**
 * Create a Razorpay order for the given amount (in INR rupees).
 * @param {number} amountInRupees
 * @param {string} receiptId - typically the bookingId
 */
async function createOrder(amountInRupees, receiptId) {
  const razorpay = getRazorpayInstance();
  return razorpay.orders.create({
    amount: Math.round(amountInRupees * 100), // convert to paise
    currency: 'INR',
    receipt: receiptId,
  });
}

/**
 * Verify Razorpay payment signature to confirm the payment is authentic.
 */
function verifySignature(razorpayOrderId, razorpayPaymentId, signature) {
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');
  if (!signature || typeof signature !== 'string') return false;
  const expectedBuffer = Buffer.from(expected, 'utf8');
  const signatureBuffer = Buffer.from(signature, 'utf8');
  if (expectedBuffer.length !== signatureBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}

// Webhook signature verification - COMMENTED OUT for later
// function verifyWebhookSignature(rawBody, signature) {
//   if (!rawBody || !signature || typeof signature !== 'string') return false;
//   if (!process.env.RAZORPAY_WEBHOOK_SECRET) return false;
//
//   const expected = crypto
//     .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
//     .update(rawBody)
//     .digest('hex');
//
//   const expectedBuffer = Buffer.from(expected, 'utf8');
//   const signatureBuffer = Buffer.from(signature, 'utf8');
//   if (expectedBuffer.length !== signatureBuffer.length) return false;
//   return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
// }

module.exports = { createOrder, verifySignature };
