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
 
module.exports = { sendOtpEmail };
