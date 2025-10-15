const axios = require('axios');
require('dotenv').config();

async function generateChatResponse(message) {
  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

    // ✅ contents should be an array
    const payload = {
      contents: [
        {
          parts: [
            { text: message }
          ]
        }
      ]
    };

    const response = await axios.post(endpoint, payload, {
      headers: { 'Content-Type': 'application/json' },
    });

    // ✅ matches API structure
    return response.data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
  } catch (err) {
    console.error('GeminiService error:', err.response?.data || err.message);
    throw new Error('Failed to generate chat response');
  }
}

module.exports = { generateChatResponse };
