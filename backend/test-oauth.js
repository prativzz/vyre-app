import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.GMAIL_USER,
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN
  }
});

async function run() {
  try {
    console.log("Testing OAuth2 credentials...");
    const info = await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER,
      subject: 'Test OAuth2',
      text: 'If you get this, OAuth2 is working perfectly.'
    });
    console.log("Success! Message ID:", info.messageId);
  } catch (err) {
    console.error("Failed!", err);
  }
}

run();
