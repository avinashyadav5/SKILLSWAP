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

    const endpoint = `https://api.groq.com/openai/v1/chat/completions`;

    const payload = {
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: `Explain about ${message} in simple terms.`,
        },
      ],
    };

    const response = await axios.post(endpoint, payload, {
      headers: { 
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json" 
      },
    });

    return response.data.choices?.[0]?.message?.content || "⚠️ No response from AI.";
  } catch (err) {
    const errorData = err.response?.data;
    console.error("Groq API error:", errorData || err.message);
    
    // Check for Rate Limit Error (429)
    if (err.response?.status === 429 || (errorData && errorData.error && errorData.error.code === 429)) {
        return "⚠️ I'm receiving too many requests right now! You've exceeded your current free-tier AI quota. Please wait a few seconds and try again.";
    }
    
    return "❌ Sorry, I'm having trouble connecting to my AI brain right now. Please try again later.";
  }
}

module.exports = { generateStudyBuddyResponse };
