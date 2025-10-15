const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

// Simple cache (optional)
const cache = new Map();

router.get('/:subject', async (req, res) => {
  const subject = req.params.subject.toLowerCase();

  if (cache.has(subject)) {
    return res.json({ path: cache.get(subject) });
  }

  try {
    // Fetch FAQ-style "path" steps from StackOverflow
    const url = `https://api.stackexchange.com/2.3/tags/${encodeURIComponent(subject)}/faq?site=stackoverflow`;
    const response = await fetch(url);
    const data = await response.json();

    let path = [];
    if (data.items && data.items.length > 0) {
      path = data.items.slice(0, 5).map((item, idx) => `${idx + 1}. ${item.title}`);
    } else {
      // Fallback generic path if subject has no FAQ data
      path = [
        `Introduction to ${subject}`,
        `Core concepts in ${subject}`,
        `Intermediate ${subject} techniques`,
        `Advanced topics in ${subject}`,
        `Projects and best practices in ${subject}`
      ];
    }

    cache.set(subject, path);
    res.json({ path });
  } catch (err) {
    console.error('LearningPath API error:', err);
    res.status(500).json({ error: 'Failed to fetch learning path' });
  }
});

module.exports = router;
