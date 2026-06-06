const express = require('express');
const axios = require('axios');
const router = express.Router();
require('dotenv').config();

const cache = new Map();

router.get('/:subject', async (req, res) => {
  const subject = req.params.subject.toLowerCase();

  if (cache.has(subject)) {
    return res.json({ path: cache.get(subject) });
  }

  try {
    const endpoint = `https://api.groq.com/openai/v1/chat/completions`;
    
    const prompt = `Create a high-level 5-step learning path for someone who wants to learn "${subject}". Return exactly 5 strings in a valid JSON array format, like this: ["Step 1 description", "Step 2 description", "Step 3 description", "Step 4 description", "Step 5 description"]. Only output the JSON array, no markdown formatting or backticks.`;

    const payload = {
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }]
    };

    const response = await axios.post(endpoint, payload, {
      headers: { 
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json' 
      }
    });

    const aiText = response.data.choices?.[0]?.message?.content || '';
    
    let path = [];
    try {
        const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
        path = JSON.parse(cleanJson);
    } catch(e) {
        path = [
            `Introduction and Basics of ${subject}`,
            `Core concepts and fundamentals of ${subject}`,
            `Intermediate techniques and tooling in ${subject}`,
            `Advanced topics and architecture in ${subject}`,
            `Real-world projects and best practices in ${subject}`
        ];
    }

    cache.set(subject, path);
    res.json({ path });
  } catch (err) {
    console.error('LearningPath API error:', err.response?.data || err.message);
    // Return fallback path on API failure
    res.json({
        path: [
            `Introduction and Basics of ${subject}`,
            `Core concepts and fundamentals of ${subject}`,
            `Intermediate techniques and tooling in ${subject}`,
            `Advanced topics and architecture in ${subject}`,
            `Real-world projects and best practices in ${subject}`
        ]
    });
  }
});

module.exports = router;
