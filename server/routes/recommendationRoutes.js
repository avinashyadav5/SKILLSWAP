const express = require('express');
const axios = require('axios');
require('dotenv').config();

const router = express.Router();

router.get('/learn/:subject', async (req, res) => {
  const subject = req.params.subject;

  try {
    // Groq API endpoint
    const endpoint = `https://api.groq.com/openai/v1/chat/completions`;

    const payload = {
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: 'user',
          content: `Suggest the top online resources for learning ${subject}. Return exactly 5 items as a valid JSON array of objects. Each object must have "title" and "url" properties. Do not output markdown, just the JSON array.`
        }
      ]
    };

    // Call Groq API
    const response = await axios.post(endpoint, payload, {
      headers: { 
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json' 
      }
    });

    const aiText = response.data.choices?.[0]?.message?.content || '';

    let resources = [];
    try {
        const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
        resources = JSON.parse(cleanJson);
    } catch(e) {
        console.error("Failed to parse Gemini recommendation JSON", aiText);
        resources = [
            { title: `${subject} Official Documentation`, url: `https://www.google.com/search?q=${subject}+documentation` },
            { title: `${subject} on YouTube`, url: `https://www.youtube.com/results?search_query=${subject}+tutorial` },
            { title: `Learn ${subject} on freeCodeCamp`, url: `https://www.freecodecamp.org/news/search/?query=${subject}` }
        ];
    }

    res.json(resources);
  } catch (error) {
    console.error('LearningResources API error:', error.response?.data || error.message);
    // Return fallback resources on API failure (e.g. Rate Limits)
    res.json([
        { title: `${subject} Official Documentation`, url: `https://www.google.com/search?q=${subject}+documentation` },
        { title: `${subject} on YouTube`, url: `https://www.youtube.com/results?search_query=${subject}+tutorial` },
        { title: `Learn ${subject} on freeCodeCamp`, url: `https://www.freecodecamp.org/news/search/?query=${subject}` }
    ]);
  }
});

module.exports = router;
