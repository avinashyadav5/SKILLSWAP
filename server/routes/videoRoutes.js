const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/create-room', async (req, res) => {
  try {
    const response = await axios.post('https://api.daily.co/v1/rooms', {
      properties: {
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
        enable_chat: true
      }
    }, {
      headers: {
        Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    res.json({ url: response.data.url });
  } catch (err) {
    console.error('Failed to create Daily room:', err.response?.data || err.message);
    res.status(500).json({ error: 'Could not create room' });
  }
});

module.exports = router;
