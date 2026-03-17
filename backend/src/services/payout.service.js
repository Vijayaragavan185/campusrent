// backend/src/services/payout.service.js
// Razorpay X Payouts API — automatically pays lenders via UPI on booking completion.
const axios = require('axios');

async function razorpayXPost(url, data, step) {
  try {
    const res = await axios.post(url, data, {
      headers: { Authorization: getRazorpayAuthHeader() },
      timeout: 15000,
    });
    return res.data;
  } catch (err) {
    err.razorpayXStep = step;
    err.razorpayXUrl = url;
    err.razorpayXPayload = data;
    throw err;
  }
}

function getRazorpayAuthHeader() {
  const credentials = Buffer.from(
    `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
  ).toString('base64');
  return `Basic ${credentials}`;
}

async function createContact(name, referenceId) {
  const data = await razorpayXPost(
    'https://api.razorpay.com/v1/contacts',
    { name, type: 'vendor', reference_id: referenceId },
    'create_contact'
  );
  return data.id;
}

async function createFundAccount(contactId, upiId) {
  const data = await razorpayXPost(
    'https://api.razorpay.com/v1/fund_accounts',
    {
      contact_id: contactId,
      account_type: 'vpa',
      vpa: { address: upiId },
    },
    'create_fund_account'
  );
  return data.id;
}

async function createRazorpayPayout({ fundAccountId, amountInPaise, bookingId }) {
  return razorpayXPost(
    'https://api.razorpay.com/v1/payouts',
    {
      account_number: process.env.RAZORPAY_X_ACCOUNT_NUMBER,
      fund_account_id: fundAccountId,
      amount: amountInPaise,
      currency: 'INR',
      mode: 'UPI',
      purpose: 'payout',
      queue_if_low_balance: true,
      reference_id: bookingId,
      narration: 'CampusRent rental payout',
    },
    'create_payout'
  );
}

/**
 * Send a payout to a lender's UPI ID via Razorpay X.
 * Requires RAZORPAY_X_ACCOUNT_NUMBER env var (Razorpay X activated account).
 *
 * @param {object} params
 * @param {string} params.upiId        - Lender's UPI address (e.g. name@upi)
 * @param {string} params.lenderName   - Lender's display name (for Razorpay contact)
 * @param {number} params.amountInPaise - Amount in paise (e.g. 50000 = ₹500)
 * @param {string} params.bookingId    - Booking ID (used as reference_id)
 */
async function sendPayoutToUpi({ upiId, lenderName, amountInPaise, bookingId }) {
  if (!process.env.RAZORPAY_X_ACCOUNT_NUMBER) {
    throw new Error(
      'RAZORPAY_X_ACCOUNT_NUMBER is not configured. Activate Razorpay X on your account to enable auto-payouts.'
    );
  }

  const contactId = await createContact(lenderName, `payout_${bookingId}`);
  const fundAccountId = await createFundAccount(contactId, upiId);
  const payout = await createRazorpayPayout({ fundAccountId, amountInPaise, bookingId });
  return payout;
}

module.exports = { sendPayoutToUpi };
