// backend/src/services/email.service.js
async function sendOtpEmail(toEmail, otp) {
 
  // In development: print OTP to terminal instead of emailing
  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n═══════════════════════════════════`);
    console.log(`  OTP for ${toEmail}: ${otp}`);
    console.log(`  (development mode — not emailed)`);
    console.log(`═══════════════════════════════════\n`);
    return;
  }
 
  // Production: send via AWS SES
  const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
  const ses = new SESClient({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
 
  await ses.send(new SendEmailCommand({
    Source: process.env.SES_FROM_EMAIL,
    Destination: { ToAddresses: [toEmail] },
    Message: {
      Subject: { Data: 'CampusRent — Verify your email' },
      Body: {
        Text: { Data: `Your verification code: ${otp}\nExpires in 10 minutes.` },
      },
    },
  }));
}

async function sendEmail({ toEmail, subject, textBody }) {
  if (!toEmail) return;

  // In development: print message to terminal instead of emailing
  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n═══════════════════════════════════`);
    console.log(`  EMAIL to ${toEmail}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  ${textBody}`);
    console.log(`  (development mode — not emailed)`);
    console.log(`═══════════════════════════════════\n`);
    return;
  }

  const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
  const ses = new SESClient({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  await ses.send(new SendEmailCommand({
    Source: process.env.SES_FROM_EMAIL,
    Destination: { ToAddresses: [toEmail] },
    Message: {
      Subject: { Data: subject },
      Body: {
        Text: { Data: textBody },
      },
    },
  }));
}

async function sendBookingRequestOwnerEmail(toEmail, details) {
  const {
    ownerName,
    renterName,
    listingTitle,
    location,
    startDateLabel,
    endDateLabel,
    totalCost,
  } = details;

  const subject = `New booking request for ${listingTitle}`;
  const textBody = [
    `Hi ${ownerName || 'there'},`,
    '',
    `${renterName || 'A renter'} placed a booking request for your listing: ${listingTitle}.`,
    '',
    `Pickup location: ${location || 'On Campus'}`,
    `Start time: ${startDateLabel}`,
    `Deadline/End time: ${endDateLabel}`,
    `Total: $${Number(totalCost || 0).toFixed(2)}`,
    '',
    'Please open CampusRent and approve or reject this request from My Bookings → Lending.',
  ].join('\n');

  await sendEmail({ toEmail, subject, textBody });
}

async function sendBookingDecisionRenterEmail(toEmail, details) {
  const {
    renterName,
    ownerName,
    listingTitle,
    location,
    startDateLabel,
    endDateLabel,
    status,
  } = details;

  const decisionWord = status === 'accepted' ? 'approved' : 'rejected';
  const subject = `Your booking was ${decisionWord}: ${listingTitle}`;
  const textBody = [
    `Hi ${renterName || 'there'},`,
    '',
    `${ownerName || 'The owner'} has ${decisionWord} your booking request for: ${listingTitle}.`,
    '',
    `Pickup location: ${location || 'On Campus'}`,
    `Start time: ${startDateLabel}`,
    `Deadline/End time: ${endDateLabel}`,
    '',
    status === 'accepted'
      ? 'Please coordinate pickup via CampusRent chat. We will continue sending updates when booking deadlines/status change.'
      : 'You can browse and request other available listings from the home page.',
  ].join('\n');

  await sendEmail({ toEmail, subject, textBody });
}

async function sendBookingDueReminderEmail(toEmail, details) {
  const {
    recipientName,
    listingTitle,
    dueDateLabel,
    role,
  } = details;

  const subject = `Reminder: ${listingTitle} is due soon`;
  const roleSpecificLine = role === 'owner'
    ? 'Please coordinate with the renter for a smooth return and inspection.'
    : 'Please return the item on time to avoid late fees.';

  const textBody = [
    `Hi ${recipientName || 'there'},`,
    '',
    `This is a reminder that the booking for "${listingTitle}" is due by ${dueDateLabel}.`,
    roleSpecificLine,
    '',
    'Open CampusRent → My Bookings to review the booking timeline and status.',
  ].join('\n');

  await sendEmail({ toEmail, subject, textBody });
}
 
module.exports = {
  sendOtpEmail,
  sendBookingRequestOwnerEmail,
  sendBookingDecisionRenterEmail,
  sendBookingDueReminderEmail,
};
