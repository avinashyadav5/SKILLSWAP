const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { generateChatResponse } = require('../services/geminiService');
const ChatSession = require('../models/ChatSession');
const ChatMessage = require('../models/ChatMessage');

const router = express.Router();

// Get all chat sessions for user
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const sessions = await ChatSession.findAll({
      where: { userId: req.userId },
      order: [['updatedAt', 'DESC']],
    });
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    res.status(500).json({ error: 'Failed to fetch chat sessions' });
  }
});

// Create a new chat session
router.post('/sessions', authenticateToken, async (req, res) => {
  try {
    const newSession = await ChatSession.create({
      userId: req.userId,
      title: req.body.title || 'New Chat',
    });
    res.status(201).json(newSession);
  } catch (error) {
    console.error('Error creating chat session:', error);
    res.status(500).json({ error: 'Failed to create chat session' });
  }
});

// Get messages for a session
router.get('/sessions/:sessionId/messages', authenticateToken, async (req, res) => {
  try {
    const messages = await ChatMessage.findAll({
      where: { sessionId: req.params.sessionId, userId: req.userId },
      order: [['createdAt', 'ASC']],
    });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a message and get AI response
router.post('/sessions/:sessionId/messages', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Verify ownership of chat session
    const session = await ChatSession.findOne({
      where: { id: req.params.sessionId, userId: req.userId },
    });
    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }

    // Save user message
    const userMessage = await ChatMessage.create({
      sessionId: session.id,
      userId: req.userId,
      message,
      sender: 'user',
    });

    // Fetch last 5 messages for context
    const recentMessages = await ChatMessage.findAll({
      where: { sessionId: session.id },
      order: [['createdAt', 'DESC']],
      limit: 5,
    });

    const history = recentMessages
      .reverse()
      .map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [msg.message],
      }));

    // Generate AI response from Gemini API
    const aiResponse = await generateChatResponse(message, history);

    // Save AI response message
    const aiMessage = await ChatMessage.create({
      sessionId: session.id,
      userId: req.userId,
      message: aiResponse,
      sender: 'ai',
    });

    // Update the session's updatedAt timestamp
    await session.update({ updatedAt: new Date() });

    res.status(201).json({ userMessage, aiMessage });
  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).json({ error: 'Failed to process message', details: error.message });
  }
});

// Delete chat session
router.delete('/sessions/:sessionId', authenticateToken, async (req, res) => {
  try {
    const session = await ChatSession.findOne({
      where: { id: req.params.sessionId, userId: req.userId },
    });
    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }
    await session.destroy();
    res.json({ message: 'Chat session deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat session:', error);
    res.status(500).json({ error: 'Failed to delete chat session' });
  }
});

// Update chat session title
router.put('/sessions/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    const session = await ChatSession.findOne({
      where: { id: req.params.sessionId, userId: req.userId },
    });
    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }
    await session.update({ title, updatedAt: new Date() });
    res.json(session);
  } catch (error) {
    console.error('Error updating chat session title:', error);
    res.status(500).json({ error: 'Failed to update chat session title' });
  }
});

module.exports = router;
