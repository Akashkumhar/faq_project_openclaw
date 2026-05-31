'use strict';

const STOPWORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with','by',
  'from','is','are','was','were','be','been','being','have','has','had',
  'do','does','did','will','would','could','should','can','may','might',
  'i','my','me','we','our','you','your','he','she','it','they','them',
  'this','that','these','those','what','which','who','how','why','when','where',
  'not','no','yes','if','then','else','so','as','up','out','get','got',
  'please','kindly','help','need','want','require','like',
]);

/**
 * Tokenise text into meaningful bigrams for trigram similarity.
 */
function getWordBigrams(text) {
  if (!text || typeof text !== 'string') return new Set();
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w));
  const bigrams = new Set();
  for (let i = 0; i < tokens.length - 1; i++) {
    bigrams.add(`${tokens[i]} ${tokens[i + 1]}`);
  }
  return bigrams;
}

/**
 * Trigram similarity between two strings (0–1).
 * Uses word bigrams for better semantic matching.
 */
function trigramSimilarity(a, b) {
  if (!a || !b) return 0;
  const bg1 = getWordBigrams(a);
  const bg2 = getWordBigrams(b);
  if (bg1.size === 0 && bg2.size === 0) return 0;
  const intersection = [...bg1].filter(bg => bg2.has(bg)).length;
  return (2 * intersection) / (bg1.size + bg2.size);
}

module.exports = { trigramSimilarity };