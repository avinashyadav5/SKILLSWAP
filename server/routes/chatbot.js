const express = require('express');
const { generateChatResponse } = require('../services/geminiService');
const router = express.Router();

router.post('/', async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ reply: 'Please enter a question' });
  }
  try {
    const aiReply = await generateChatResponse(message);
    res.json({ reply: aiReply });
  } catch (error) {
    console.error('Error generating AI response:', error);
    res.status(500).json({ reply: 'Error generating AI response' });
  }
});

module.exports = router;
