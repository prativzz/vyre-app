import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { db } from './db.js';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'my_fallback_secret_please_change';
console.log("🔐 JWT_SECRET value:", JWT_SECRET);

export async function registerUser(email, username, password) {
  const hashed = await bcrypt.hash(password, 10);
  const userId = uuidv4();
  try {
    await db.run(
      'INSERT INTO users (id, email, username, password_hash) VALUES (?, ?, ?, ?)',
      [userId, email, username, hashed]
    );
    return { success: true, userId };
  } catch (err) {
    if (err.message.includes('UNIQUE')) return { success: false, error: 'Email or username already exists' };
    throw err;
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
      status: user.status || ''
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

export async function completeGoogleUser(onboardingToken, username, password) {
  const decoded = verifyToken(onboardingToken);
  if (!decoded || !decoded.isPending) {
    return { success: false, error: 'Invalid or expired onboarding session' };
  }

  const { email, name } = decoded;

  const hashed = await bcrypt.hash(password, 10);
  const userId = uuidv4();
  
  try {
    await db.run(
      'INSERT INTO users (id, email, username, display_name, avatar, password_hash) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, email, username, "", "", hashed]
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
        status: user.status || ''
      }
    };
  } catch (err) {
    if (err.message.includes('UNIQUE')) return { success: false, error: 'Username already exists' };
    throw err;
  }
}