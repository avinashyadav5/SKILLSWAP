// server/services/embeddingService.js
const SubjectEmbedding = require('../models/SubjectEmbedding');
const { cosineSimilarity } = require('../utils/similarity');

let extractor = null;

// lazy load model once
async function getExtractor() {
  if (extractor) return extractor;
  const { pipeline } = await import('@xenova/transformers');
  extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  return extractor;
}

// normalize text (lowercase, trim)
function normText(s) {
  return (s || '').toLowerCase().trim();
}

// mean-pool + L2 normalize
function meanPoolAndNormalize(nested) {
  // nested shape: [tokens, dims]
  const arr = nested && nested[0] ? nested[0] : nested;
  if (!arr || !arr.length) return [];
  const dims = arr[0].length;
  const mean = new Array(dims).fill(0);
  for (const token of arr) {
    for (let j = 0; j < dims; j++) {
      mean[j] += token[j];
    }
  }
  for (let j = 0; j < dims; j++) mean[j] /= arr.length;
  const mag = Math.sqrt(mean.reduce((s, v) => s + v * v, 0)) || 1e-8;
  return mean.map(v => v / mag);
}

// get or create embedding for a subject text
async function getOrCreateEmbedding(rawText) {
  const text = normText(rawText);
  if (!text) return null;

  // try cache
  let row = await SubjectEmbedding.findOne({ where: { text } });
  if (row) return row;

  try {
    const extractor = await getExtractor();
    const output = await extractor(text, { pooling: 'none', normalize: false });
    const vec = meanPoolAndNormalize(output.data);
    row = await SubjectEmbedding.create({ text, vector: vec });
    return row;
  } catch (err) {
    console.error(`⚠️ Embedding failed for "${text}":`, err.message || err);
    return null;
  }
}

module.exports = {
  getOrCreateEmbedding,
  normText,
  cosineSimilarity, // export if needed
};
