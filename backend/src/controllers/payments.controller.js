// backend/src/controllers/payments.controller.js
const { PrismaClient } = require('@prisma/client');
const { createOrder, verifySignature } = require('../services/payment.service');

const prisma = new PrismaClient();

// Webhook helper - COMMENTED OUT for later
// async function updatePaymentStatusByOrderId(orderId, status, paymentId) {
//   if (!orderId) return { updated: false };
//
//   const existing = await prisma.payment.findUnique({
//     where: { razorpayOrderId: orderId },
//     select: { bookingId: true, status: true },
//   });
//
//   if (!existing) return { updated: false };
//   if (existing.status === status && (!paymentId || status !== 'paid')) return { updated: true };
//
//   await prisma.payment.update({
//     where: { razorpayOrderId: orderId },
//     data: {
//       status,
//       razorpayPaymentId: paymentId || undefined,
//       updatedAt: new Date(),
//     },
//   });
//
//   return { updated: true };
// }

// POST /api/payments/create-order
// Body: { bookingId }
exports.createPaymentOrder = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) return res.status(400).json({ error: 'bookingId is required' });

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true },
    });

    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.renterId !== req.userId) return res.status(403).json({ error: 'Forbidden' });
    if (booking.payment?.status === 'paid') {
      return res.status(400).json({ error: 'This booking is already paid' });
    }

    const order = await createOrder(booking.totalCost, bookingId);

    await prisma.payment.upsert({
      where: { bookingId },
      update: { razorpayOrderId: order.id, status: 'created', updatedAt: new Date() },
      create: {
        bookingId,
        razorpayOrderId: order.id,
        amount: booking.totalCost,
        status: 'created',
      },
    });

    res.json({
      orderId: order.id,
      amount: order.amount,   // in paise
      currency: order.currency,
      bookingId,
    });
  } catch (err) { next(err); }
};

// POST /api/payments/verify
// Body: { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature }
exports.verifyPayment = async (req, res, next) => {
  try {
    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!bookingId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ error: 'Missing required payment fields' });
    }

    // Confirm the payment belongs to the authenticated renter
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true },
    });

    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.renterId !== req.userId) return res.status(403).json({ error: 'Forbidden' });
    if (booking.payment?.status === 'paid') {
      return res.json({ success: true, alreadyPaid: true });
    }

    const valid = verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!valid) {
      return res.status(400).json({ error: 'Payment verification failed: invalid signature' });
    }

    await prisma.payment.update({
      where: { bookingId },
      data: {
        razorpayPaymentId,
        razorpaySignature,
        status: 'paid',
        updatedAt: new Date(),
      },
    });

    res.json({ success: true });
  } catch (err) { next(err); }
};

// Webhook endpoint - COMMENTED OUT for later
// exports.handleRazorpayWebhook = async (req, res, next) => {
//   try {
//     const signature = req.headers['x-razorpay-signature'];
//     const rawBody = req.rawBody;
//
//     const valid = verifyWebhookSignature(rawBody, signature);
//     if (!valid) return res.status(400).json({ error: 'Invalid webhook signature' });
//
//     const event = req.body?.event;
//     const payload = req.body?.payload || {};
//
//     if (event === 'payment.captured') {
//       const paymentEntity = payload.payment?.entity || {};
//       await updatePaymentStatusByOrderId(paymentEntity.order_id, 'paid', paymentEntity.id);
//     } else if (event === 'order.paid') {
//       const orderEntity = payload.order?.entity || {};
//       await updatePaymentStatusByOrderId(orderEntity.id, 'paid');
//     } else if (event === 'payment.failed') {
//       const paymentEntity = payload.payment?.entity || {};
//       await updatePaymentStatusByOrderId(paymentEntity.order_id, 'failed', paymentEntity.id);
//     }
//
//     res.json({ received: true, event });
//   } catch (err) { next(err); }
// };
