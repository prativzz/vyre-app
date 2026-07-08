import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendOtpEmail = async (to, otp) => {
  const mailOptions = {
    from: process.env.SMTP_USER || '"Vyre Accounts" <noreply@vyre.local>',
    to,
    subject: 'Your Vyre Verification Code',
    text: `Welcome to Vyre! Your verification code is: ${otp}. This code expires in 10 minutes.`,
    html: `
      <div style="font-family: monospace; background-color: #0f1115; color: #a1a1aa; padding: 40px; text-align: center;">
        <h1 style="color: #10b981; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Vyre Verification</h1>
        <p style="font-size: 14px; margin-top: 20px;">Welcome! Please use the following code to complete your registration:</p>
        <div style="margin: 30px auto; background-color: #1a1d24; border: 1px solid #272a30; padding: 20px; font-size: 32px; font-weight: bold; color: #e4e4e7; width: max-content; letter-spacing: 5px;">
          ${otp}
        </div>
        <p style="font-size: 12px; color: #71717a;">This code expires in 10 minutes.</p>
      </div>
    `,
  };

  try {
    // If SMTP_USER is not set, we'll just log it to console instead of throwing an error.
    // This makes it easy to test locally without configuring SMTP.
    if (!process.env.SMTP_USER) {
      console.log(`\n========== MOCK EMAIL SENT ==========`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log(`OTP Code: ${otp}`);
      console.log(`=====================================\n`);
      return { success: true, mocked: true };
    }

    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: 'Failed to send OTP email' };
  }
};
