const axios = require('axios');
require('dotenv').config();

async function generateChatResponse(message) {
  try {
    const endpoint = `https://api.groq.com/openai/v1/chat/completions`;

    const payload = {
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: message }]
    };

    const response = await axios.post(endpoint, payload, {
      headers: { 
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json' 
      },
    });

    return response.data.choices?.[0]?.message?.content || 'No response';
  } catch (err) {
    console.error('Groq Service error:', err.response?.data || err.message);
    throw new Error('Failed to generate chat response');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SKILL SYNONYM MAP — bidirectional, covers abbreviations ↔ full names ↔ domains
// When a user types "mern", they match with "web development", "full stack", etc.
// When a user types "ai", they match with "artificial intelligence", "machine learning".
// ─────────────────────────────────────────────────────────────────────────────
const COMMON_SKILLS = {
  // ─── AI / ML ─────────────────────────────────────────────────────────────
  'ai': ['artificial intelligence', 'machine learning', 'deep learning'],
  'artificial intelligence': ['artificial intelligence', 'machine learning', 'deep learning'],
  'ml': ['machine learning', 'artificial intelligence', 'data science'],
  'machine learning': ['machine learning', 'artificial intelligence', 'data science'],
  'deep learning': ['deep learning', 'machine learning', 'artificial intelligence'],
  'dl': ['deep learning', 'machine learning', 'artificial intelligence'],
  'nlp': ['natural language processing', 'machine learning', 'artificial intelligence'],
  'natural language processing': ['natural language processing', 'machine learning', 'ai'],
  'computer vision': ['computer vision', 'deep learning', 'machine learning'],
  'data science': ['data science', 'machine learning', 'statistics', 'python'],
  'data analysis': ['data analysis', 'data science', 'statistics'],
  'data engineering': ['data engineering', 'data science', 'databases'],

  // ─── WEB DEVELOPMENT (BROAD) ─────────────────────────────────────────────
  'web development': ['web development', 'frontend web development', 'backend web development', 'full stack web development', 'javascript'],
  'web dev': ['web development', 'frontend web development', 'backend web development', 'full stack web development'],
  'full stack': ['full stack web development', 'frontend web development', 'backend web development', 'web development'],
  'full stack web development': ['full stack web development', 'frontend web development', 'backend web development', 'web development'],
  'fullstack': ['full stack web development', 'web development', 'frontend web development', 'backend web development'],
  'frontend': ['frontend web development', 'web development', 'javascript', 'html', 'css'],
  'front end': ['frontend web development', 'web development', 'javascript'],
  'frontend web development': ['frontend web development', 'web development', 'javascript', 'react', 'html', 'css'],
  'backend': ['backend web development', 'web development', 'api development'],
  'back end': ['backend web development', 'web development'],
  'backend web development': ['backend web development', 'web development', 'api development', 'databases'],

  // ─── STACKS / FRAMEWORKS ─────────────────────────────────────────────────
  'mern': ['mern stack', 'full stack web development', 'web development', 'react', 'nodejs', 'mongodb', 'express', 'javascript'],
  'mern stack': ['mern stack', 'full stack web development', 'web development', 'react', 'nodejs', 'mongodb', 'express'],
  'mean': ['mean stack', 'full stack web development', 'web development', 'angular', 'nodejs', 'mongodb', 'express'],
  'mean stack': ['mean stack', 'full stack web development', 'web development', 'angular', 'nodejs'],
  'django': ['django', 'backend web development', 'web development', 'python'],
  'flask': ['flask', 'backend web development', 'web development', 'python'],
  'spring boot': ['spring boot', 'backend web development', 'java'],
  'laravel': ['laravel', 'backend web development', 'web development', 'php'],
  'rails': ['ruby on rails', 'backend web development', 'web development'],
  'ruby on rails': ['ruby on rails', 'backend web development', 'web development'],
  'nextjs': ['nextjs', 'react', 'frontend web development', 'full stack web development', 'javascript'],
  'next.js': ['nextjs', 'react', 'frontend web development', 'javascript'],

  // ─── JAVASCRIPT ECOSYSTEM ────────────────────────────────────────────────
  'js': ['javascript', 'web development', 'frontend web development'],
  'javascript': ['javascript', 'web development', 'frontend web development'],
  'ts': ['typescript', 'javascript', 'web development'],
  'typescript': ['typescript', 'javascript', 'web development'],
  'react': ['react', 'frontend web development', 'web development', 'javascript'],
  'reactjs': ['react', 'frontend web development', 'web development', 'javascript'],
  'react.js': ['react', 'frontend web development', 'web development', 'javascript'],
  'vue': ['vuejs', 'frontend web development', 'web development', 'javascript'],
  'vuejs': ['vuejs', 'frontend web development', 'web development', 'javascript'],
  'angular': ['angular', 'frontend web development', 'web development', 'javascript'],
  'svelte': ['svelte', 'frontend web development', 'web development', 'javascript'],
  'node': ['nodejs', 'backend web development', 'web development', 'javascript'],
  'nodejs': ['nodejs', 'backend web development', 'web development', 'javascript'],
  'node.js': ['nodejs', 'backend web development', 'web development', 'javascript'],
  'express': ['expressjs', 'backend web development', 'nodejs', 'javascript'],
  'expressjs': ['expressjs', 'backend web development', 'nodejs', 'javascript'],

  // ─── PYTHON ──────────────────────────────────────────────────────────────
  'python': ['python', 'backend web development', 'data science', 'machine learning'],
  'py': ['python', 'backend web development', 'data science'],

  // ─── SYSTEMS / LOW LEVEL ─────────────────────────────────────────────────
  'c++': ['c++', 'systems programming', 'competitive programming'],
  'cpp': ['c++', 'systems programming', 'competitive programming'],
  'c': ['c', 'systems programming'],
  'rust': ['rust', 'systems programming'],
  'go': ['golang', 'backend web development', 'systems programming'],
  'golang': ['golang', 'backend web development', 'systems programming'],

  // ─── JVM ─────────────────────────────────────────────────────────────────
  'java': ['java', 'backend web development', 'enterprise software'],
  'kotlin': ['kotlin', 'android development', 'mobile development', 'java'],
  'scala': ['scala', 'data engineering', 'functional programming', 'java'],

  // ─── MOBILE ──────────────────────────────────────────────────────────────
  'android': ['android development', 'mobile development', 'kotlin', 'java'],
  'android development': ['android development', 'mobile development'],
  'ios': ['ios development', 'mobile development', 'swift'],
  'ios development': ['ios development', 'mobile development', 'swift'],
  'swift': ['swift', 'ios development', 'mobile development'],
  'react native': ['react native', 'mobile development', 'react', 'javascript'],
  'flutter': ['flutter', 'mobile development', 'dart'],
  'mobile development': ['mobile development', 'android development', 'ios development'],
  'mobile dev': ['mobile development', 'android development', 'ios development'],

  // ─── DATABASES ───────────────────────────────────────────────────────────
  'sql': ['sql', 'databases', 'backend web development'],
  'mysql': ['mysql', 'sql', 'databases'],
  'postgresql': ['postgresql', 'sql', 'databases'],
  'postgres': ['postgresql', 'sql', 'databases'],
  'mongodb': ['mongodb', 'databases', 'nosql'],
  'nosql': ['nosql', 'databases', 'mongodb'],
  'redis': ['redis', 'databases', 'caching'],
  'databases': ['databases', 'sql', 'backend web development'],
  'db': ['databases', 'sql'],

  // ─── DEVOPS / CLOUD ──────────────────────────────────────────────────────
  'devops': ['devops', 'ci/cd', 'cloud computing', 'docker', 'kubernetes'],
  'docker': ['docker', 'devops', 'containerization'],
  'kubernetes': ['kubernetes', 'devops', 'containerization', 'cloud computing'],
  'k8s': ['kubernetes', 'devops', 'cloud computing'],
  'ci/cd': ['ci/cd', 'devops'],
  'cloud': ['cloud computing', 'devops', 'aws', 'gcp', 'azure'],
  'cloud computing': ['cloud computing', 'devops', 'aws'],
  'aws': ['aws', 'cloud computing', 'devops'],
  'azure': ['azure', 'cloud computing', 'devops'],
  'gcp': ['gcp', 'cloud computing', 'devops'],

  // ─── UI / DESIGN ─────────────────────────────────────────────────────────
  'ui': ['ui design', 'frontend web development', 'web design'],
  'ux': ['ux design', 'ui design', 'web design'],
  'ui/ux': ['ui design', 'ux design', 'web design', 'frontend web development'],
  'web design': ['web design', 'frontend web development', 'ui design'],
  'html': ['html', 'frontend web development', 'web development'],
  'css': ['css', 'frontend web development', 'web development'],

  // ─── CS FUNDAMENTALS ─────────────────────────────────────────────────────
  'dsa': ['data structures and algorithms', 'algorithms', 'competitive programming'],
  'data structures': ['data structures and algorithms', 'algorithms'],
  'algorithms': ['algorithms', 'data structures and algorithms'],
  'competitive programming': ['competitive programming', 'algorithms', 'data structures and algorithms'],
  'cp': ['competitive programming', 'algorithms'],
  'os': ['operating systems', 'systems programming'],
  'operating systems': ['operating systems', 'systems programming'],
  'networking': ['computer networking', 'devops'],
  'computer networking': ['computer networking', 'devops'],
  'cybersecurity': ['cybersecurity', 'networking', 'ethical hacking'],
  'security': ['cybersecurity', 'networking'],
  'ethical hacking': ['ethical hacking', 'cybersecurity'],

  // ─── BLOCKCHAIN ──────────────────────────────────────────────────────────
  'blockchain': ['blockchain', 'web3', 'smart contracts'],
  'web3': ['web3', 'blockchain', 'smart contracts'],
  'solidity': ['solidity', 'blockchain', 'smart contracts'],
};

async function normalizeSkills(skillsArray) {
  if (!skillsArray || skillsArray.length === 0) return [];

  const cleanArray = skillsArray.map(s => s.trim().toLowerCase()).filter(Boolean);

  let allFoundLocally = true;
  const mappedLocally = [];

  for (const skill of cleanArray) {
    if (COMMON_SKILLS[skill]) {
      mappedLocally.push(...COMMON_SKILLS[skill]);
    } else {
      allFoundLocally = false;
      mappedLocally.push(skill);
    }
  }

  // Deduplicate
  const uniqueMapped = [...new Set(mappedLocally)];

  if (allFoundLocally) {
    console.log(`🤖 Normalizer (Cache): ${skillsArray} -> ${uniqueMapped}`);
    return uniqueMapped;
  }

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const prompt = `You are a skill normalizer and expander. Take the following comma-separated list of skills and normalize them to standard industry terms. IMPORTANT: if a skill is specific (like 'mern' or 'django'), also include its broader industry domain (like 'full stack web development' or 'backend web development'). For example: 'ml' -> 'machine learning, artificial intelligence'. 'mern' -> 'mern stack, full stack web development, react, nodejs'. Only return the expanded comma-separated list, nothing else.
Skills: ${skillsArray.join(', ')}`;

    const payload = { contents: [{ parts: [{ text: prompt }] }] };

    const response = await axios.post(endpoint, payload, {
      headers: { 'Content-Type': 'application/json' },
    });

    const aiText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!aiText) return uniqueMapped;

    const result = [...new Set(aiText.split(',').map(s => s.trim().toLowerCase()).filter(Boolean))];
    console.log(`🤖 Normalizer (AI): ${skillsArray} -> ${result}`);
    return result;
  } catch (err) {
    console.error('Skill Normalization error:', err.message);
    return uniqueMapped;
  }
}

module.exports = { generateChatResponse, normalizeSkills };
