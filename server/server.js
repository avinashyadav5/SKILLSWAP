const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { Server } = require('socket.io');
const sequelize = require('./config/db');

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

// Enable CORS with your frontend origin and allow credentials
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Route registrations (order matters)

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


// Basic health check
app.get('/', (req, res) => res.send('SkillSwap Backend is running!'));

// Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
  },
});

global.io = io;

let onlineUsers = {};

io.on('connection', socket => {
  console.log(`🟢 Socket connected: ${socket.id}`);

  socket.on('join_room', userId => {
    socket.join(userId.toString());
    onlineUsers[userId] = socket.id;
    io.emit('online_users', Object.keys(onlineUsers));
  });

  socket.on('notify', ({ userId, message }) => {
    io.to(userId.toString()).emit('notification', message);
  });

  socket.on('ai_message', async ({ sessionId, userId, message }) => {
    try {
      const { generateChatResponse } = require('./services/geminiService');
      const aiReply = await generateChatResponse(message, { sessionId, userId });
      io.to(userId.toString()).emit('ai_response', { sessionId, message: aiReply });
    } catch (error) {
      io.to(userId.toString()).emit('ai_response', { sessionId, message: 'AI error.' });
    }
  });

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

// Sequelize sync and start server
sequelize.sync({ alter: true }).then(() => {
  server.listen(5000, () => {
    console.log('🚀 Server running at http://localhost:5000');
  });
});
