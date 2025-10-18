// server.js
const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { Server } = require('socket.io');
const sequelize = require('./config/db');

dotenv.config();
const app = express();
const server = http.createServer(app);

// === Allowed origins ===
// You can set FRONTEND_ORIGINS in your environment (comma-separated), otherwise these defaults are used.
const FRONTEND_ORIGINS =
  (process.env.FRONTEND_ORIGINS &&
    process.env.FRONTEND_ORIGINS.split(',').map((s) => s.trim())) || [
    'http://localhost:5173',
    'https://skillswap-nine-beta.vercel.app',
    // add any other deployed frontend URLs here
  ];

console.log('Allowed origins:', FRONTEND_ORIGINS);

// === CORS middleware for Express routes ===
app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like curl, mobile apps, or server-to-server)
      if (!origin) return callback(null, true);
      if (FRONTEND_ORIGINS.includes(origin)) return callback(null, true);
      console.warn('Blocked by CORS:', origin);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// === Middleware ===
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// === Routes (keep your route imports as-is) ===
const statsRoute = require('./routes/stats');
const chatRoutes = require('./routes/chatRoutes');
const userRoutes = require('./routes/userRoutes');
const matchRoutes = require('./routes/matchRoutes');
const messageRoutes = require('./routes/messageRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const videoRoutes = require('./routes/videoRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const chatbotRoute = require('./routes/chatbot');
const learningPathRoutes = require('./routes/learningPathRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const subjectsRouter = require('./routes/subjects');
const studyBuddyRoutes = require('./routes/studyBuddyRoutes');

app.use('/api/chatbot', chatbotRoute);
app.use('/api/learning-path', learningPathRoutes);
app.use('/api/subjects', subjectsRouter);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/user', userRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/rating', ratingRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stats', statsRoute);
app.use('/api/study-buddy', studyBuddyRoutes);

// Health check
app.get('/', (req, res) => res.send('✅ SkillSwap Backend is running!'));

// === Socket.IO Setup ===
// Configure Socket.IO CORS using the same origin list
const io = new Server(server, {
  cors: {
    origin: FRONTEND_ORIGINS,
    credentials: true,
  },
});

global.io = io;

let onlineUsers = {};

io.on('connection', (socket) => {
  console.log(`🟢 Socket connected: ${socket.id}`);

  // --- User joins room ---
  socket.on('join_room', (userId) => {
    try {
      socket.join(userId.toString());
      onlineUsers[userId] = socket.id;
      io.emit('online_users', Object.keys(onlineUsers));
      console.log(`👥 User ${userId} joined room (socket ${socket.id})`);
    } catch (err) {
      console.error('Error in join_room:', err);
    }
  });

  // --- Notifications ---
  socket.on('notify', ({ userId, message }) => {
    try {
      io.to(userId.toString()).emit('notification', message);
    } catch (err) {
      console.error('notify error:', err);
    }
  });

  // --- AI Chatbot (Gemini API) ---
  socket.on('ai_message', async ({ sessionId, userId, message }) => {
    try {
      const { generateChatResponse } = require('./services/geminiService');
      const aiReply = await generateChatResponse(message, { sessionId, userId });
      io.to(userId.toString()).emit('ai_response', { sessionId, message: aiReply });
    } catch (err) {
      console.error('ai_message error:', err);
      io.to(userId.toString()).emit('ai_response', { sessionId, message: 'AI error.' });
    }
  });

  // --- WebRTC Signaling (offers / answers / ICE) ---
  socket.on('webrtc_offer', ({ to, offer, from }) => {
    try {
      console.log(`📡 webrtc_offer ${from} -> ${to}`);
      io.to(to.toString()).emit('webrtc_offer', { from, offer });
    } catch (err) {
      console.error('webrtc_offer error:', err);
    }
  });

  socket.on('webrtc_answer', ({ to, answer }) => {
    try {
      console.log(`📞 webrtc_answer -> ${to}`);
      io.to(to.toString()).emit('webrtc_answer', { answer });
    } catch (err) {
      console.error('webrtc_answer error:', err);
    }
  });

  socket.on('webrtc_ice_candidate', ({ to, candidate }) => {
    try {
      io.to(to.toString()).emit('webrtc_ice_candidate', { candidate });
    } catch (err) {
      console.error('webrtc_ice_candidate error:', err);
    }
  });

  // === Call request / response / reject / end flow ===
  socket.on('call_request', ({ to, from }) => {
    try {
      console.log(`📞 call_request ${from} -> ${to}`);
      io.to(to.toString()).emit('call_request', { from });
    } catch (err) {
      console.error('call_request error:', err);
    }
  });

  socket.on('call_response', ({ to, accepted, from }) => {
    try {
      console.log(`📲 call_response from ${from} to ${to}: ${accepted}`);
      io.to(to.toString()).emit('call_response', { accepted, from });
    } catch (err) {
      console.error('call_response error:', err);
    }
  });

  socket.on('call_rejected', ({ to, from }) => {
    try {
      console.log(`🚫 call_rejected by ${from} -> notify ${to}`);
      io.to(to.toString()).emit('call_rejected', { from });
    } catch (err) {
      console.error('call_rejected error:', err);
    }
  });

  socket.on('end_call', ({ to }) => {
    try {
      console.log(`❌ end_call (from socket ${socket.id}) -> ${to}`);
      io.to(to.toString()).emit('end_call');
    } catch (err) {
      console.error('end_call error:', err);
    }
  });

  // --- Disconnect handler ---
  socket.on('disconnect', () => {
    try {
      for (let [id, sockId] of Object.entries(onlineUsers)) {
        if (sockId === socket.id) {
          delete onlineUsers[id];
          break;
        }
      }
      io.emit('online_users', Object.keys(onlineUsers));
      console.log(`🔴 Socket disconnected: ${socket.id}`);
    } catch (err) {
      console.error('disconnect handler error:', err);
    }
  });
});

// === DB Sync + Start server ===
const PORT = process.env.PORT || 5000;
sequelize
  .sync({ alter: true })
  .then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err);
  });
