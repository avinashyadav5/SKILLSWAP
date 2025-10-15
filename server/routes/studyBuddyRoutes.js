const express = require("express");
const { generateStudyBuddyResponse } = require("../services/studyBuddyService");
const router = express.Router();

// POST /api/study-buddy
router.post("/", async (req, res) => {
  const { message, teachSubjects = [], learnSubjects = [] } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ reply: "⚠️ Please enter a question." });
  }

  try {
    const aiReply = await generateStudyBuddyResponse(message, teachSubjects, learnSubjects);

    // ✅ If AI returns an error string, detect and set status code properly
    if (aiReply.startsWith("❌ Gemini error:")) {
      return res.status(500).json({ reply: aiReply });
    }

    res.json({ reply: aiReply });
  } catch (error) {
    console.error("❌ Study Buddy Route Error:", error);
    res.status(500).json({ reply: "⚠️ Unexpected server error." });
  }
});

module.exports = router;
