const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { Server } = require('socket.io');
const sequelize = require('./config/db');

// Import routes
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

dotenv.config();
const app = express();
const server = http.createServer(app);

// ✅ CORS setup for both localhost & deployed frontend
const allowedOrigins = [
  'http://localhost:5173',
  'https://skillswap-nine-beta.vercel.app',  // Deployed frontend
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log('❌ Blocked by CORS:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// ✅ Middleware
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Route registrations
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

// ✅ Health check endpoint
app.get('/', (req, res) => res.send('✅ SkillSwap Backend is running!'));

// ✅ Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

global.io = io;

let onlineUsers = {};

io.on('connection', (socket) => {
  console.log(`🟢 Socket connected: ${socket.id}`);

  // --- User joins room ---
  socket.on('join_room', (userId) => {
    socket.join(userId.toString());
    onlineUsers[userId] = socket.id;
    io.emit('online_users', Object.keys(onlineUsers));
  });

  // --- Notifications ---
  socket.on('notify', ({ userId, message }) => {
    io.to(userId.toString()).emit('notification', message);
  });

  // --- AI Chatbot (Gemini API) ---
  socket.on('ai_message', async ({ sessionId, userId, message }) => {
    try {
      const { generateChatResponse } = require('./services/geminiService');
      const aiReply = await generateChatResponse(message, { sessionId, userId });
      io.to(userId.toString()).emit('ai_response', { sessionId, message: aiReply });
    } catch (error) {
      io.to(userId.toString()).emit('ai_response', { sessionId, message: 'AI error.' });
    }
  });

  // --- WebRTC Signaling for Video Calls ---
  socket.on('webrtc_offer', ({ to, offer, from }) => {
    console.log(`📡 Offer from ${from} to ${to}`);
    io.to(to.toString()).emit('webrtc_offer', { from, offer });
  });

  socket.on('webrtc_answer', ({ to, answer }) => {
    console.log(`📞 Answer sent to ${to}`);
    io.to(to.toString()).emit('webrtc_answer', { answer });
  });

  socket.on('webrtc_ice_candidate', ({ to, candidate }) => {
    io.to(to.toString()).emit('webrtc_ice_candidate', { candidate });
  });

  // --- Handle disconnection ---
  socket.on('disconnect', () => {
    for (let [id, sockId] of Object.entries(onlineUsers)) {
      if (sockId === socket.id) {
        delete onlineUsers[id];
        break;
      }
    }
    io.emit('online_users', Object.keys(onlineUsers));
    console.log(`🔴 Socket disconnected: ${socket.id}`);
  });
});

// ✅ Sync database & start server
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
