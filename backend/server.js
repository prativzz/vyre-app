import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDb, db } from './db.js';
import { registerUser, loginUser, verifyToken, googleLoginUser, completeGoogleUser, verifyOtp } from './auth.js';
import dns from 'dns';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import { AccessToken } from 'livekit-server-sdk';
import bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';

dotenv.config();
const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const userSocketMap = {};

// ---------- Socket middleware with logging ----------
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  console.log('🔑 Socket auth token:', token ? token.slice(0, 20) + '...' : 'null');
  if (!token) return next(new Error('Authentication required'));
  const decoded = verifyToken(token);
  console.log('🔓 Decoded user:', decoded);
  if (!decoded) return next(new Error('Invalid token'));
  socket.userId = decoded.userId;
  socket.username = decoded.username;
  next();
});

io.on('connection', (socket) => {
  console.log(`✅ User ${socket.username} (${socket.userId}) connected`);
  socket.join(socket.userId);
  if (!userSocketMap[socket.userId]) userSocketMap[socket.userId] = new Set();
  userSocketMap[socket.userId].add(socket.id);

  socket.on('join:server', async (serverId) => {
    socket.join(`server:${serverId}`);
    const memberIds = await db.all(`SELECT user_id FROM server_members WHERE server_id = ?`, [serverId]);
    const onlineMembers = memberIds.filter(m => userSocketMap[m.user_id]).map(m => m.user_id);
    socket.emit('server:online', onlineMembers);
  });

  socket.on('message:send', async ({ channelId, content, replyTo }) => {
    try {
      console.log('📥 Message send request:', { channelId, content, replyTo });
      const messageId = uuidv4();
      await db.run(
        'INSERT INTO messages (id, channel_id, user_id, content, reply_to) VALUES (?, ?, ?, ?, ?)',
        [messageId, channelId, socket.userId, content, replyTo || null]
      );
      console.log('✅ Inserted message:', messageId);

      const user = await db.get('SELECT username, avatar, display_name FROM users WHERE id = ?', [socket.userId]);
      let replyData = null;
      if (replyTo) {
        replyData = await db.get(
          `SELECT u.username, m.content FROM messages m JOIN users u ON m.user_id = u.id WHERE m.id = ?`,
          [replyTo]
        );
        console.log('📎 Reply data:', replyData);
      }
      const message = {
        id: messageId,
        content,
        username: user.username,
        display_name: user.display_name || user.username,
        avatar: user.avatar || '',
        userId: socket.userId,
        createdAt: new Date().toISOString(),
        reply_to: replyTo || null,
        reply_username: replyData?.username || null,
        reply_content: replyData?.content || null
      };
      console.log('📤 Emitting message:', message);
      const channel = await db.get('SELECT server_id FROM channels WHERE id = ?', [channelId]);
      if (channel) {
        io.to(`server:${channel.server_id}`).emit('message:new', { channelId, message });
      }
    } catch (err) {
      console.error('❌ Message send error:', err);
    }
  });

  socket.on('dm:send', async ({ targetUserId, content, replyTo }) => {
    try {
      const messageId = uuidv4();
      await db.run(
        'INSERT INTO direct_messages (id, sender_id, receiver_id, content, reply_to) VALUES (?, ?, ?, ?, ?)',
        [messageId, socket.userId, targetUserId, content, replyTo || null]
      );
      const user = await db.get('SELECT username, avatar, display_name FROM users WHERE id = ?', [socket.userId]);
      let replyData = null;
      if (replyTo) {
        replyData = await db.get(
          `SELECT u.username, m.content FROM direct_messages m JOIN users u ON m.sender_id = u.id WHERE m.id = ?`,
          [replyTo]
        );
      }
      const message = {
        id: messageId,
        content,
        username: user.username,
        display_name: user.display_name || user.username,
        avatar: user.avatar || '',
        sender_id: socket.userId,
        receiver_id: targetUserId,
        createdAt: new Date().toISOString(),
        reply_to: replyTo || null,
        reply_username: replyData?.username || null,
        reply_content: replyData?.content || null
      };

      io.to(targetUserId).emit('dm:new', message);
      io.to(socket.userId).emit('dm:new', message);
    } catch (err) {
      console.error('❌ DM send error:', err);
    }
  });

  socket.on('dm:delete', async ({ messageId, targetUserId }) => {
    try {
      const msg = await db.get('SELECT sender_id FROM direct_messages WHERE id = ?', [messageId]);
      if (msg && msg.sender_id === socket.userId) {
        await db.run('DELETE FROM direct_messages WHERE id = ?', [messageId]);
        io.to(targetUserId).emit('dm:deleted', { messageId, targetUserId: socket.userId });
        io.to(socket.userId).emit('dm:deleted', { messageId, targetUserId });
      }
    } catch (err) {
      console.error('❌ DM delete error:', err);
    }
  });

  socket.on('disconnect', () => {
    if (userSocketMap[socket.userId]) {
      userSocketMap[socket.userId].delete(socket.id);
      if (userSocketMap[socket.userId].size === 0) {
        delete userSocketMap[socket.userId];
      }
    }
    console.log(`❌ User ${socket.username} (${socket.userId}) disconnected`);
  });
});

const resolveMx = promisify(dns.resolveMx);

async function isValidEmailDomain(email) {
  const domain = email.split('@')[1];
  if (!domain) return false;
  try {
    const addresses = await resolveMx(domain);
    return addresses && addresses.length > 0;
  } catch (err) {
    return false;
  }
}

// REST endpoints
app.post('/api/register', async (req, res) => {
  const { email, username, password } = req.body;
  if (!email || !username || !password) return res.status(400).json({ error: 'Missing fields' });
  
  // Validate if email domain is real
  const isValidDomain = await isValidEmailDomain(email);
  if (!isValidDomain) {
    return res.status(400).json({ success: false, error: 'This email is not real or does not exist' });
  }

  const result = await registerUser(email, username, password);
  if (!result.success) return res.status(400).json({ error: result.error });
  res.json({ success: true, pending: true, message: 'OTP sent' });
});

app.post('/api/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Missing fields' });
  
  const result = await verifyOtp(email, otp);
  if (!result.success) return res.status(400).json({ error: result.error });
  res.json(result);
});

app.post('/api/auth/google', async (req, res) => {
  const { token } = req.body;
  try {
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!userInfoRes.ok) throw new Error("Invalid access token");
    const payload = await userInfoRes.json();
    const { email, name, picture } = payload;
    
    const result = await googleLoginUser(email, name, picture);
    res.json(result);
  } catch (err) {
    console.error("Google Auth Error:", err);
    res.status(401).json({ success: false, error: "Invalid Google token" });
  }
});

app.post('/api/auth/complete-google', async (req, res) => {
  const { onboardingToken, username } = req.body;
  if (!onboardingToken || !username) {
    return res.status(400).json({ success: false, error: 'Missing fields' });
  }
  try {
    const result = await completeGoogleUser(onboardingToken, username);
    res.json(result);
  } catch (err) {
    console.error("Complete Google Auth Error:", err);
    res.status(500).json({ success: false, error: "Failed to complete setup" });
  }
});

app.post('/api/login', async (req, res) => {
  console.log("🔑 Login request received:", req.body);
  const { email, password } = req.body;
  const result = await loginUser(email, password);
  console.log("🔑 Login result:", result);
  res.json(result);
});

app.get('/api/user/servers', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
  const servers = await db.all(`
    SELECT s.* FROM servers s
    JOIN server_members sm ON s.id = sm.server_id
    WHERE sm.user_id = ?
  `, [decoded.userId]);
  res.json(servers);
});

app.post('/api/servers/create', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
  const { name, template = 'general' } = req.body;

  const serverId = uuidv4();
  const inviteCode = uuidv4().slice(0, 8);
  await db.run('INSERT INTO servers (id, name, owner_id, invite_code) VALUES (?, ?, ?, ?)',
    [serverId, name, decoded.userId, inviteCode]);
  await db.run('INSERT INTO server_members (server_id, user_id) VALUES (?, ?)', [serverId, decoded.userId]);

  let channels = [];
  switch (template) {
    case 'gaming':
      channels = [
        { name: '🎮 general-gaming', type: 'text', position: 0 },
        { name: '🔥 lfg', type: 'text', position: 1 },
        { name: '📢 game-news', type: 'text', position: 2 },
        { name: '🎙️ voice-gaming', type: 'voice', position: 3 },
      ];
      break;
    case 'news':
      channels = [
        { name: '📰 world-news', type: 'text', position: 0 },
        { name: '💬 discussion', type: 'text', position: 1 },
        { name: '📡 livestream', type: 'voice', position: 2 },
      ];
      break;
    case 'study':
      channels = [
        { name: '📚 general-study', type: 'text', position: 0 },
        { name: '❓ homework-help', type: 'text', position: 1 },
        { name: '📝 resources', type: 'text', position: 2 },
        { name: '🔇 silent-study', type: 'voice', position: 3 },
      ];
      break;
    case 'random':
      channels = [
        { name: '🌀 random', type: 'text', position: 0 },
        { name: '💩 spam', type: 'text', position: 1 },
        { name: '🤡 off-topic', type: 'text', position: 2 },
        { name: '🎲 voice-chaos', type: 'voice', position: 3 },
      ];
      break;
    default:
      channels = [
        { name: 'general', type: 'text', position: 0 },
        { name: 'Voice', type: 'voice', position: 1 },
      ];
  }
  for (const ch of channels) {
    await db.run(
      'INSERT INTO channels (id, server_id, name, type, position) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), serverId, ch.name, ch.type, ch.position]
    );
  }
  res.json({ serverId, inviteCode, template });
});

app.post('/api/servers/join', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
  const { inviteCode } = req.body;
  const server = await db.get('SELECT * FROM servers WHERE invite_code = ?', [inviteCode]);
  if (!server) return res.status(404).json({ error: 'Server not found' });
  const existing = await db.get('SELECT * FROM server_members WHERE server_id = ? AND user_id = ?', [server.id, decoded.userId]);
  if (existing) return res.status(400).json({ error: 'Already a member' });
  await db.run('INSERT INTO server_members (server_id, user_id) VALUES (?, ?)', [server.id, decoded.userId]);
  res.json({ serverId: server.id, name: server.name });
});

app.delete('/api/servers/:serverId', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
  const { serverId } = req.params;

  const server = await db.get('SELECT * FROM servers WHERE id = ?', [serverId]);
  if (!server) return res.status(404).json({ error: 'Server not found' });
  if (server.owner_id !== decoded.userId) return res.status(403).json({ error: 'Only the owner can delete this server' });

  // Delete messages, channels, members, and the server
  await db.run('DELETE FROM messages WHERE channel_id IN (SELECT id FROM channels WHERE server_id = ?)', [serverId]);
  await db.run('DELETE FROM channels WHERE server_id = ?', [serverId]);
  await db.run('DELETE FROM server_members WHERE server_id = ?', [serverId]);
  await db.run('DELETE FROM servers WHERE id = ?', [serverId]);

  io.emit('server:deleted', { serverId });
  res.json({ success: true });
});

app.get('/api/servers/:serverId/channels', async (req, res) => {
  const { serverId } = req.params;
  const channels = await db.all('SELECT * FROM channels WHERE server_id = ? ORDER BY position', [serverId]);
  res.json(channels);
});

// ---------- Messages endpoint with reply data ----------
app.get('/api/channels/:channelId/messages', async (req, res) => {
  try {
    const { channelId } = req.params;
    const messages = await db.all(`
      SELECT 
        m.id, 
        m.channel_id, 
        m.user_id as userId, 
        m.content, 
        m.reply_to, 
        m.created_at,
        u.username, 
        u.avatar, 
        u.display_name,
        parent_user.username as reply_username,
        parent_msg.content as reply_content
      FROM messages m
      JOIN users u ON m.user_id = u.id
      LEFT JOIN messages parent_msg ON m.reply_to = parent_msg.id
      LEFT JOIN users parent_user ON parent_msg.user_id = parent_user.id
      WHERE m.channel_id = ?
      ORDER BY m.created_at ASC LIMIT 100
    `, [channelId]);
    res.json(messages);
  } catch (err) {
    console.error('❌ Error fetching messages:', err);
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

// ---------- Get all users (with online status) ----------
app.get('/api/users', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: 'Invalid token' });

    const users = await db.all(`
      SELECT id, username, display_name, avatar, status
      FROM users
      WHERE id != ?
    `, [decoded.userId]);

    const usersWithOnline = users.map(u => ({
      ...u,
      online: !!userSocketMap[u.id]
    }));

    res.json(usersWithOnline);
  } catch (err) {
    console.error('❌ Fetch all users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ---------- Get server members (with online status) ----------
app.get('/api/servers/:serverId/members', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: 'Invalid token' });

    const { serverId } = req.params;
    const membership = await db.get('SELECT * FROM server_members WHERE server_id = ? AND user_id = ?', [serverId, decoded.userId]);
    if (!membership) return res.status(403).json({ error: 'You are not a member of this server' });

    const members = await db.all(`
      SELECT u.id, u.username, u.display_name, u.avatar, u.status
      FROM users u
      JOIN server_members sm ON u.id = sm.user_id
      WHERE sm.server_id = ?
    `, [serverId]);

    const membersWithOnline = members.map(m => ({
      ...m,
      online: !!userSocketMap[m.id]
    }));

    res.json(membersWithOnline);
  } catch (err) {
    console.error('❌ Fetch members error:', err);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

app.get('/api/users/online', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
    const onlineUsers = Object.keys(userSocketMap).filter(id => id !== decoded.userId);
    if (onlineUsers.length === 0) {
      res.json([]);
      return;
    }
    const users = await db.all(`
      SELECT id, username, avatar, display_name, status 
      FROM users 
      WHERE id IN (${onlineUsers.map(() => '?').join(',')})
    `, onlineUsers);
    res.json(users);
  } catch (err) {
    console.error('❌ Online users fetch error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/user/profile', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
  const { display_name, avatar, status } = req.body;
  await db.run(
    'UPDATE users SET display_name = ?, avatar = ?, status = ? WHERE id = ?',
    [display_name || '', avatar || '', status || '', decoded.userId]
  );
  const updated = await db.get('SELECT username, display_name, avatar, status, password_hash FROM users WHERE id = ?', [decoded.userId]);
  const hasPassword = !!updated.password_hash;
  delete updated.password_hash;
  res.json({ success: true, user: { ...updated, hasPassword } });
});

app.get('/api/user/:userId/profile', async (req, res) => {
  const { userId } = req.params;
  const user = await db.get('SELECT id, username, display_name, avatar, status, password_hash FROM users WHERE id = ?', [userId]);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const hasPassword = !!user.password_hash;
  delete user.password_hash;
  res.json({ ...user, hasPassword });
});

app.post('/api/livekit/token', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
  const { roomName } = req.body;
  const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
    identity: decoded.userId,
    name: decoded.username,
  });
  at.addGrant({ roomJoin: true, room: roomName });
  const jwt = await at.toJwt();
  res.json({ token: jwt });
});

// ========== CHANNEL MANAGEMENT ==========
app.post('/api/channels/create', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: 'Unauthorized' });

    const { serverId, name, type } = req.body;
    if (!serverId || !name || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (!['text', 'voice'].includes(type)) {
      return res.status(400).json({ error: 'Invalid channel type' });
    }

    const channelId = uuidv4();
    const maxPos = await db.get('SELECT MAX(position) as max FROM channels WHERE server_id = ?', [serverId]);
    const position = (maxPos?.max ?? -1) + 1;

    await db.run(
      'INSERT INTO channels (id, server_id, name, type, position) VALUES (?, ?, ?, ?, ?)',
      [channelId, serverId, name, type, position]
    );

    const newChannel = await db.get('SELECT * FROM channels WHERE id = ?', [channelId]);
    res.json({ success: true, channel: newChannel });
  } catch (err) {
    console.error('❌ Create channel error:', err);
    res.status(500).json({ error: 'Failed to create channel' });
  }
});

app.put('/api/channels/:channelId', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: 'Unauthorized' });

    const { channelId } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    await db.run('UPDATE channels SET name = ? WHERE id = ?', [name, channelId]);
    const updated = await db.get('SELECT * FROM channels WHERE id = ?', [channelId]);
    res.json({ success: true, channel: updated });
  } catch (err) {
    console.error('❌ Rename channel error:', err);
    res.status(500).json({ error: 'Failed to rename channel' });
  }
});

app.delete('/api/channels/:channelId', async (req, res) => {
  try {
    console.log('🗑️ Delete request for channel:', req.params.channelId);
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log('❌ No authorization header');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
      console.log('❌ No token found');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const decoded = verifyToken(token);
    if (!decoded) {
      console.log('❌ Invalid token');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { channelId } = req.params;

    const channel = await db.get('SELECT server_id FROM channels WHERE id = ?', [channelId]);
    if (!channel) {
      console.log('❌ Channel not found:', channelId);
      return res.status(404).json({ error: 'Channel not found' });
    }

    const countResult = await db.get('SELECT COUNT(*) as count FROM channels WHERE server_id = ?', [channel.server_id]);
    if (countResult.count <= 1) {
      console.log('⚠️ Cannot delete last channel in server:', channel.server_id);
      return res.status(400).json({ error: 'Cannot delete the last channel in this server.' });
    }

    await db.run('DELETE FROM channels WHERE id = ?', [channelId]);
    console.log('✅ Channel deleted:', channelId);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Delete channel error:', err);
    res.status(500).json({ error: 'Failed to delete channel' });
  }
});

// ========== ACCOUNT SETTINGS ==========
app.put('/api/user/password', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ success: false, error: 'Invalid token' });

    const { currentPassword, newPassword } = req.body;
    if (!newPassword) {
      return res.status(400).json({ success: false, error: 'Missing new password' });
    }
    if (newPassword.length < 4) {
      return res.status(400).json({ success: false, error: 'New password must be at least 4 characters' });
    }

    const user = await db.get('SELECT * FROM users WHERE id = ?', [decoded.userId]);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const hasPassword = !!user.password_hash;

    if (hasPassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, error: 'Current password is required' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isMatch) return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.run('UPDATE users SET password_hash = ? WHERE id = ?', [hashed, decoded.userId]);
    res.json({ success: true, message: 'Password updated' });
  } catch (err) {
    console.error('❌ Change password error:', err);
    res.status(500).json({ success: false, error: 'Internal error' });
  }
});

// ---------- Delete account (unique suffix to avoid UNIQUE constraint) ----------
app.delete('/api/user', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ success: false, error: 'Invalid token' });

    const userId = decoded.userId;
    const uniqueSuffix = userId.slice(0, 8);

    await db.run('BEGIN TRANSACTION');

    // 1. Anonymize user with unique suffix
    await db.run(
      `UPDATE users SET 
        username = 'Deleted_User_' || ?,
        display_name = 'Deleted User',
        avatar = '',
        email = 'deleted_' || ? || '@deleted',
        password_hash = ''
      WHERE id = ?`,
      [uniqueSuffix, uniqueSuffix, userId]
    );

    // 2. Remove from server memberships
    await db.run('DELETE FROM server_members WHERE user_id = ?', [userId]);

    // 3. Delete owned servers and their channels
    const ownedServers = await db.all('SELECT id FROM servers WHERE owner_id = ?', [userId]);
    for (const server of ownedServers) {
      await db.run('DELETE FROM channels WHERE server_id = ?', [server.id]);
      await db.run('DELETE FROM servers WHERE id = ?', [server.id]);
    }

    // 4. Remove from friends table
    await db.run('DELETE FROM friends WHERE user_id = ? OR friend_id = ?', [userId, userId]);

    await db.run('COMMIT');
    res.json({ success: true });
  } catch (err) {
    try { await db.run('ROLLBACK'); } catch (e) {}
    console.error('❌ Delete account error:', err);
    res.status(500).json({ success: false, error: 'Delete failed: ' + err.message });
  }
});

// ========== FRIENDS SYSTEM ==========

// Send friend request
app.post('/api/friends/request', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: 'Invalid token' });

    const { friendId } = req.body;
    if (!friendId) return res.status(400).json({ error: 'Friend ID required' });
    if (friendId === decoded.userId) return res.status(400).json({ error: 'Cannot add yourself' });

    const existing = await db.get(
      'SELECT * FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
      [decoded.userId, friendId, friendId, decoded.userId]
    );
    if (existing) {
      if (existing.status === 'accepted') return res.status(400).json({ error: 'Already friends' });
      if (existing.status === 'pending') return res.status(400).json({ error: 'Request already pending' });
    }

    await db.run(
      'INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, ?)',
      [decoded.userId, friendId, 'pending']
    );

    // Notify the receiver in real-time
    io.to(friendId).emit('friend:update');

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Send friend request error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// Accept friend request
app.put('/api/friends/accept', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: 'Invalid token' });

    const { friendId } = req.body;
    if (!friendId) return res.status(400).json({ error: 'Friend ID required' });

    const request = await db.get(
      'SELECT * FROM friends WHERE user_id = ? AND friend_id = ? AND status = ?',
      [friendId, decoded.userId, 'pending']
    );
    if (!request) return res.status(404).json({ error: 'No pending request from this user' });

    await db.run(
      'UPDATE friends SET status = ? WHERE user_id = ? AND friend_id = ?',
      ['accepted', friendId, decoded.userId]
    );
    await db.run(
      'INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, ?) ON CONFLICT (user_id, friend_id) DO NOTHING',
      [decoded.userId, friendId, 'accepted']
    );

    // Notify the sender that we accepted
    io.to(friendId).emit('friend:update');

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Accept friend error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// Decline/remove friend
app.delete('/api/friends/decline', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: 'Invalid token' });

    const { friendId } = req.body;
    if (!friendId) return res.status(400).json({ error: 'Friend ID required' });

    await db.run(
      'DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
      [decoded.userId, friendId, friendId, decoded.userId]
    );

    // Notify the other person just in case
    io.to(friendId).emit('friend:update');

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Decline/remove friend error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// Get friends list – with DISTINCT to remove duplicates
app.get('/api/friends', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: 'Invalid token' });

    const friends = await db.all(`
      SELECT DISTINCT
        CASE 
          WHEN f.user_id = ? THEN f.friend_id 
          ELSE f.user_id 
        END as friend_id
      FROM friends f
      WHERE (f.user_id = ? OR f.friend_id = ?) AND f.status = 'accepted'
    `, [decoded.userId, decoded.userId, decoded.userId]);

    if (friends.length === 0) {
      return res.json([]);
    }

    const friendIds = friends.map(f => f.friend_id);
    const placeholders = friendIds.map(() => '?').join(',');
    const users = await db.all(`
      SELECT id, username, display_name, avatar, status
      FROM users
      WHERE id IN (${placeholders})
    `, friendIds);

    const friendsWithOnline = users.map(u => ({
      friend_id: u.id,
      username: u.username,
      display_name: u.display_name,
      avatar: u.avatar,
      user_status: u.status,
      online: !!userSocketMap[u.id]
    }));

    console.log('👥 Friends list:', friendsWithOnline);
    res.json(friendsWithOnline);
  } catch (err) {
    console.error('❌ Get friends error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// Get pending friend requests (received)
app.get('/api/friends/pending', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: 'Invalid token' });

    const pending = await db.all(`
      SELECT u.id, u.username, u.display_name, u.avatar, 'received' as type
      FROM friends f
      JOIN users u ON f.user_id = u.id
      WHERE f.friend_id = ? AND f.status = 'pending'
      UNION ALL
      SELECT u.id, u.username, u.display_name, u.avatar, 'sent' as type
      FROM friends f
      JOIN users u ON f.friend_id = u.id
      WHERE f.user_id = ? AND f.status = 'pending'
    `, [decoded.userId, decoded.userId]);

    res.json(pending);
  } catch (err) {
    console.error('❌ Get pending requests error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// Get Direct Messages
app.get('/api/dms/:friendId', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: 'Invalid token' });
    const friendId = req.params.friendId;

    const messages = await db.all(`
      SELECT 
        m.id, m.content, m.created_at as createdAt, m.reply_to, m.sender_id, m.receiver_id,
        u.username, u.display_name, u.avatar,
        ru.username as reply_username,
        rm.content as reply_content
      FROM direct_messages m
      JOIN users u ON m.sender_id = u.id
      LEFT JOIN direct_messages rm ON m.reply_to = rm.id
      LEFT JOIN users ru ON rm.sender_id = ru.id
      WHERE (m.sender_id = ? AND m.receiver_id = ?) 
         OR (m.sender_id = ? AND m.receiver_id = ?)
      ORDER BY m.created_at ASC
    `, [decoded.userId, friendId, friendId, decoded.userId]);

    const formatted = messages.map(m => ({
      id: m.id,
      content: m.content,
      username: m.username,
      display_name: m.display_name || m.username,
      avatar: m.avatar || '',
      sender_id: m.sender_id,
      receiver_id: m.receiver_id,
      createdAt: m.createdAt,
      reply_to: m.reply_to,
      reply_username: m.reply_username,
      reply_content: m.reply_content
    }));

    res.json(formatted);
  } catch (err) {
    console.error('❌ Get DMs error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// ========== DEBUG ENDPOINT ==========
app.get('/api/debug/socketmap', (req, res) => {
  res.json(userSocketMap);
});

httpServer.on('error', (err) => {
  console.error('❌ Server error:', err);
});

initializeDb().then(() => {
  httpServer.listen(process.env.PORT || 5001, () => {
    console.log(`🚀 Vyre backend running on port ${process.env.PORT || 5001}`);
  });
});