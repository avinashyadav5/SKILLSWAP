const express = require('express');
const axios = require('axios');
const router = express.Router();

const crypto = require('crypto');

router.post('/create-room', async (req, res) => {
  try {
    // Generate a random, unique room name for Jitsi
    const roomName = `SkillSwap-${crypto.randomBytes(8).toString('hex')}`;
    const jitsiUrl = `https://meet.jit.si/${roomName}`;

    res.json({ url: jitsiUrl });
  } catch (err) {
    console.error('Failed to create Jitsi room:', err.message);
    res.status(500).json({ error: 'Could not create room' });
  }
});

module.exports = router;
