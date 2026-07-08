import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
dotenv.config();

// Note: If DATABASE_URL is not set, we assume local dev and can use an empty string or local config.
// Postgres will fail to connect if DATABASE_URL is missing, so we ensure the user knows to add it.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Helper to convert SQLite '?' to Postgres '$1', '$2', etc.
function convertSql(sql) {
  let count = 1;
  return sql.replace(/\?/g, () => `$${count++}`);
}

export const db = {
  async get(sql, params = []) {
    const res = await pool.query(convertSql(sql), params);
    return res.rows[0];
  },
  async all(sql, params = []) {
    const res = await pool.query(convertSql(sql), params);
    return res.rows;
  },
  async run(sql, params = []) {
    await pool.query(convertSql(sql), params);
  },
  async exec(sql) {
    await pool.query(sql);
  }
};

export async function initializeDb() {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      username TEXT UNIQUE,
      password_hash TEXT,
      avatar_url TEXT,
      avatar TEXT DEFAULT '',
      display_name TEXT DEFAULT '',
      status TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS servers (
      id TEXT PRIMARY KEY,
      name TEXT,
      owner_id TEXT,
      invite_code TEXT UNIQUE,
      icon_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS server_members (
      server_id TEXT,
      user_id TEXT,
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (server_id, user_id),
      FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS channels (
      id TEXT PRIMARY KEY,
      server_id TEXT,
      name TEXT,
      type TEXT CHECK(type IN ('text', 'voice')),
      position INTEGER DEFAULT 0,
      FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      channel_id TEXT,
      user_id TEXT,
      content TEXT,
      reply_to TEXT REFERENCES messages(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS friends (
      user_id TEXT,
      friend_id TEXT,
      status TEXT CHECK(status IN ('pending', 'accepted', 'blocked')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, friend_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS direct_messages (
      id TEXT PRIMARY KEY,
      sender_id TEXT,
      receiver_id TEXT,
      content TEXT,
      reply_to TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS pending_users (
      email TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      password_hash TEXT,
      otp TEXT,
      expires_at TIMESTAMP
    )
  `);

  // Create a default server if none exists
  const serverCount = await db.get('SELECT COUNT(*) as count FROM servers');
  if (parseInt(serverCount.count, 10) === 0) {
    // Ensure 'system' user exists
    await db.run(`
      INSERT INTO users (id, email, username, display_name)
      VALUES ('system', 'system@vyre.local', 'system', 'System')
      ON CONFLICT (id) DO NOTHING
    `);

    const defaultServerId = uuidv4();
    await db.run(`
      INSERT INTO servers (id, name, owner_id, invite_code)
      VALUES (?, 'Welcome to Vyre', 'system', ?)
    `, [defaultServerId, uuidv4().slice(0, 8)]);
    await db.run(`
      INSERT INTO channels (id, server_id, name, type, position)
      VALUES (?, ?, 'general', 'text', 0)
    `, [uuidv4(), defaultServerId]);
    await db.run(`
      INSERT INTO channels (id, server_id, name, type, position)
      VALUES (?, ?, 'General Voice', 'voice', 1)
    `, [uuidv4(), defaultServerId]);
  }
}