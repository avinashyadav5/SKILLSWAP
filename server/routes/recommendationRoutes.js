const express = require('express');
const axios = require('axios');
require('dotenv').config();

const router = express.Router();

router.get('/learn/:subject', async (req, res) => {
  const subject = req.params.subject;

  try {
    // Gemini API endpoint
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

    // Prompt Gemini to recommend top learning resources
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Suggest the top online resources for learning ${subject}.
                     Return a short list of 5–7 items. 
                     Each item should include a title and a link if possible.
                     Format it clearly in Markdown with bullet points.`
            }
          ]
        }
      ]
    };

    // Call Gemini API
    const response = await axios.post(endpoint, payload, {
      headers: { 'Content-Type': 'application/json' }
    });

    const aiText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse Markdown list (e.g. "- [Title](URL)") into JSON
    const resources = aiText
      .split(/\n+/)
      .map(line => {
        const match = line.match(/\[(.+?)\]\((https?:\/\/[^\s]+)\)/); // [Title](URL)
        if (match) {
          return { title: match[1], url: match[2] };
        }
        return null;
      })
      .filter(Boolean);

    res.json(resources);
  } catch (error) {
    console.error('LearningResources API error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch learning resources' });
  }
});

module.exports = router;
