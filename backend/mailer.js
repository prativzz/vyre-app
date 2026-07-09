import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendOtpEmail = async (to, otp) => {
  try {
    // If RESEND_API_KEY is not set, throw an error to enforce config
    if (!process.env.RESEND_API_KEY) {
      return { success: false, error: 'RESEND_API_KEY is missing in Render environment variables' };
    }

    const { data, error } = await resend.emails.send({
      from: 'Vyre Accounts <onboarding@resend.dev>', // Resend's free testing domain
      to: [to],
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
    });

    if (error) {
      console.error('Resend API Error:', error);
      return { success: false, error: error.message };
    }

    console.log('Message sent via Resend: %s', data.id);
    return { success: true };
  } catch (err) {
    console.error('Error sending email via Resend:', err);
    return { success: false, error: 'Failed to send OTP email' };
  }
};
