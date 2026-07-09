import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.GMAIL_USER,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN
    }
  });
};

export const sendOtpEmail = async (to, otp) => {
  try {
    // Check for credentials
    if (!process.env.GMAIL_USER || !process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REFRESH_TOKEN) {
      return { success: false, error: 'Google OAuth credentials missing in Render environment variables' };
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: `"Vyre Accounts" <${process.env.GMAIL_USER}>`,
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

    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent via Gmail OAuth2: %s', info.messageId);
    return { success: true };
  } catch (err) {
    console.error('Error sending email via Gmail OAuth2:', err);
    return { success: false, error: err.message || 'Failed to send OTP email' };
  }
};
