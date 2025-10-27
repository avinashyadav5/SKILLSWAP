const express = require('express');
const axios = require('axios');
require('dotenv').config();

const router = express.Router();

// In-memory cache (simple for now)
const cache = new Map();

// === GET /api/validate-subject/:subject ===
// Checks if a subject is valid and generates related info using Gemini if needed
router.get('/:subject', async (req, res) => {
  const subject = req.params.subject.trim().toLowerCase();

  if (!subject) {
    return res.status(400).json({ success: false, message: "Subject is required." });
  }

  // Serve from cache if available
  if (cache.has(subject)) {
    return res.json({ success: true, subject, ...cache.get(subject) });
  }

  try {
    // --- Step 1: Check if subject exists on StackOverflow (for legitimacy)
    const soUrl = `https://api.stackexchange.com/2.3/tags/${encodeURIComponent(subject)}/info?site=stackoverflow`;
    const soRes = await axios.get(soUrl);
    const isPopular = soRes.data.items && soRes.data.items.length > 0;

    let aiResponse = "";
    if (!isPopular) {
      // --- Step 2: Use Gemini API to validate and generate related skills
      const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
      const prompt = `
        Validate if "${subject}" is a real academic or skill subject.
        If valid, suggest 5 related topics or skills to learn.
        Respond in JSON with keys: valid (true/false), relatedSkills (array of strings), and a short summary.
      `;

      const payload = {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ]
      };

      const aiRes = await axios.post(geminiEndpoint, payload, {
        headers: { 'Content-Type': 'application/json' }
      });

      aiResponse = aiRes.data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }

    // --- Step 3: Construct final response
    const response = {
      success: true,
      subject,
      valid: isPopular || aiResponse.toLowerCase().includes("true"),
      source: isPopular ? "StackOverflow" : "Gemini AI",
      relatedSkills: [],
      summary: ""
    };

    // Try to extract related skills from AI output if available
    if (aiResponse) {
      try {
        const parsed = JSON.parse(aiResponse);
        response.relatedSkills = parsed.relatedSkills || [];
        response.summary = parsed.summary || "";
      } catch {
        // fallback parsing if not valid JSON
        const skills = aiResponse.match(/- (.+)/g)?.map(s => s.replace("- ", "")) || [];
        response.relatedSkills = skills.slice(0, 5);
      }
    }

    // Cache result
    cache.set(subject, response);

    return res.json(response);

  } catch (error) {
    console.error("validateSubject error:", error.response?.data || error.message);
    return res.status(500).json({ success: false, message: "Error validating subject." });
  }
});

module.exports = router;
