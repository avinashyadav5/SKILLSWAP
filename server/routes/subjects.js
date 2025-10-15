const express = require('express');
const fetch = require('node-fetch');

const router = express.Router();

let cachedSubjects = [];
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

async function fetchSubjects() {
  if (Date.now() - lastFetchTime < CACHE_TTL_MS && cachedSubjects.length) {
    return cachedSubjects;
  }
  let page = 1;
  const subjects = [];
  while (subjects.length < 1000) {
    const url = `https://api.stackexchange.com/2.3/tags?page=${page}&pagesize=100&order=desc&sort=popular&site=stackoverflow`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.items || data.items.length === 0) break;
    subjects.push(...data.items.map(item => item.name));
    page++;
  }
  cachedSubjects = subjects.slice(0, 1000);
  lastFetchTime = Date.now();
  return cachedSubjects;
}

router.get('/api/subjects', async (req, res) => {
  try {
    const subjects = await fetchSubjects();
    res.json({ subjects });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

module.exports = router;
