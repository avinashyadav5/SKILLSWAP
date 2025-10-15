const axios = require("axios");
require("dotenv").config();

async function generateStudyBuddyResponse(message, teachSubjects, learnSubjects) {
  try {
    const allowedSubjects = [...teachSubjects, ...learnSubjects].map(s => s.toLowerCase());
    const msgLower = message.toLowerCase();

    // Check if message is relevant to selected subjects
    const isRelevant = allowedSubjects.some(sub => msgLower.includes(sub));
    if (!isRelevant) {
      return `⚠️ I can only help with your selected subjects: ${allowedSubjects.join(", ") || "None"}.`;
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const payload = {
      contents: [
        {
          role: "user",
          parts: [{ text: `Explain about ${message} in simple terms.` }],
        },
      ],
    };

    const response = await axios.post(endpoint, payload, {
      headers: { "Content-Type": "application/json" },
    });

    return response.data.candidates?.[0]?.content?.parts?.[0]?.text || "⚠️ No response from AI.";
  } catch (err) {
    // 🔴 Improved error handling → show actual Gemini error in Postman
    const errorDetails = err.response?.data || err.message;
    console.error("Gemini API error:", errorDetails);
    return `❌ Gemini error: ${JSON.stringify(errorDetails)}`;
  }
}

module.exports = { generateStudyBuddyResponse };
