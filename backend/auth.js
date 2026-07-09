import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { db } from './db.js';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'my_fallback_secret_please_change';
console.log("🔐 JWT_SECRET value:", JWT_SECRET);

import { sendOtpEmail } from './mailer.js';

export async function registerUser(email, username, password) {
  const hashed = await bcrypt.hash(password, 10);
  
  // Check if email or username already exists in main users table
  const existing = await db.get('SELECT id FROM users WHERE email = ? OR username = ?', [email, username]);
  if (existing) {
    return { success: false, error: 'Email or username already exists' };
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60000).toISOString(); // 10 mins

  try {
    // Upsert into pending_users
    await db.run(
      `INSERT INTO pending_users (email, username, password_hash, otp, expires_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET 
         username = excluded.username,
         password_hash = excluded.password_hash,
         otp = excluded.otp,
         expires_at = excluded.expires_at`,
      [email, username, hashed, otp, expiresAt]
    );

    // Send the email (or mock it)
    const mailResult = await sendOtpEmail(email, otp);
    if (!mailResult.success) {
      return { success: false, error: mailResult.error };
    }

    return { success: true, pending: true, message: 'OTP sent to email' };
  } catch (err) {
    console.error('Registration error:', err);
    return { success: false, error: 'Failed to initiate registration' };
  }
}

export async function verifyOtp(email, otp) {
  try {
    const pending = await db.get('SELECT * FROM pending_users WHERE email = ?', [email]);
    if (!pending) {
      return { success: false, error: 'No pending registration found for this email' };
    }

    if (pending.otp !== otp) {
      return { success: false, error: 'Invalid verification code' };
    }

    if (new Date(pending.expires_at) < new Date()) {
      return { success: false, error: 'Verification code has expired' };
    }

    // Move to users table
    const userId = uuidv4();
    await db.run(
      'INSERT INTO users (id, email, username, password_hash) VALUES (?, ?, ?, ?)',
      [userId, pending.email, pending.username, pending.password_hash]
    );

    // Clean up pending
    await db.run('DELETE FROM pending_users WHERE email = ?', [email]);

    // Generate JWT
    const token = jwt.sign({ userId, username: pending.username }, JWT_SECRET, { expiresIn: '7d' });
    
    return {
      success: true,
      token,
      user: {
        id: userId,
        username: pending.username,
        email: pending.email,
        display_name: pending.username,
        avatar: '',
        status: '',
        hasPassword: true
      }
    };
  } catch (err) {
    console.error('OTP verification error:', err);
    if (err.message.includes('UNIQUE')) return { success: false, error: 'Email or username already exists' };
    return { success: false, error: 'Failed to verify OTP' };
  }
}

export async function loginUser(email, password) {
  const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
  if (!user) return { success: false, error: 'User not found' };
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return { success: false, error: 'Invalid password' };
  const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  return {
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      display_name: user.display_name || user.username,
      avatar: user.avatar || '',
      status: user.status || '',
      hasPassword: !!user.password_hash
    }
  };
}
export async function googleLoginUser(email, name, picture) {
  let user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
  
  if (!user) {
    const tempToken = jwt.sign({ email, name, isPending: true }, JWT_SECRET, { expiresIn: '1h' });
    return {
      success: true,
      needsOnboarding: true,
      onboardingToken: tempToken,
      email,
      name
    };
  }
  
  const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  return {
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      display_name: user.display_name || user.username,
      avatar: user.avatar || '',
      status: user.status || ''
    }
  };
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export async function completeGoogleUser(onboardingToken, username) {
  const decoded = verifyToken(onboardingToken);
  if (!decoded || !decoded.isPending) {
    return { success: false, error: 'Invalid or expired onboarding session' };
  }

  const { email, name } = decoded;

  const userId = uuidv4();
  
  try {
    await db.run(
      'INSERT INTO users (id, email, username, display_name, avatar, password_hash) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, email, username, "", "", null]
    );
    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    
    return {
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        display_name: user.display_name || user.username,
        avatar: user.avatar || '',
        status: user.status || '',
        hasPassword: !!user.password_hash
      }
    };
  } catch (err) {
    if (err.message.includes('UNIQUE')) return { success: false, error: 'Username already exists' };
    throw err;
  }
}