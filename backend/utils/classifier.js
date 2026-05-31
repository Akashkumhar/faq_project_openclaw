'use strict';

const CATEGORY_KEYWORDS = {
  academics:  ['exam', 'grade', 'course', 'lecture', 'syllabus', 'assignment', 'marks', 'attendance', 'semester', 'result', 'cgpa', 'backlog', 'subject', 'teacher', 'professor', 'project', 'lab', 'practical', 'internal', 'external', 'revaluation', 'gradecard'],
  admission:  ['admission', 'apply', 'eligibility', 'deadline', 'document', 'form', 'counselling', 'seat', 'rank', 'cutoff', 'entrance', 'merit', 'reservation', 'category', 'fee structure', 'nri', 'foreign', 'transfer', 'withdrawal', 'cancellation'],
  fees:       ['fee', 'payment', 'scholarship', 'refund', 'challan', 'tuition', 'deposit', 'installment', 'bank', 'transaction', 'receipt', 'receipt', 'dues', 'pending', ' concession', 'waiver', 'stipend', 'financial aid'],
  placement:  ['placement', 'internship', 'company', 'interview', 'offer', 'job', 'recruit', 'campus', 'drive', 'package', 'salary', 'ctc', 'joining', 'training', 'tpo', 'pool', 'crt', 'aptitude', 'group discussion', 'technical round'],
  facilities: ['hostel', 'library', 'wifi', 'transport', 'mess', 'gym', 'sports', 'canteen', 'cafeteria', 'parking', 'medical', 'bank atm', 'generator', 'security', 'water', 'electricity', 'room', 'faculty building', 'classroom', 'laboratory', 'stationery', 'photocopy'],
};

const STOPWORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with','by',
  'from','is','are','was','were','be','been','being','have','has','had',
  'do','does','did','will','would','could','should','can','may','might',
  'i','my','me','we','our','you','your','he','she','it','they','them',
  'this','that','these','those','what','which','who','how','why','when','where',
  'not','no','yes','if','then','else','so','as','up','out','get','got',
  'please','kindly','help','need','want','require','require','want','like',
]);

/**
 * Tokenise text into meaningful words.
 * @param {string} text
 * @returns {string[]}
 */
function tokenise(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w));
}

/**
 * Classify text into a FAQ/Query category.
 * Returns { category, confidence }.
 * Confidence is 0.0–1.0 based on keyword overlap.
 * @param {string} text
 * @returns {{ category: string, confidence: number }}
 */
function classifyQuery(text) {
  const tokens = tokenise(text);
  if (tokens.length === 0) return { category: 'other', confidence: 0 };

  const scores = {};

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let matchCount = 0;
    for (const token of tokens) {
      if (keywords.some(kw => kw.includes(token) || token.includes(kw))) {
        matchCount++;
      }
    }
    // Score = fraction of tokens matched × keyword density bonus
    const coverage = matchCount / tokens.length;
    const density = keywords.filter(kw => tokens.some(t => kw.includes(t) || t.includes(kw))).length;
    scores[category] = coverage * 0.6 + (density / keywords.length) * 0.4;
  }

  const best = Object.entries(scores).reduce(
    (max, [cat, score]) => score > max.score ? { category: cat, score } : max,
    { category: 'other', score: 0 }
  );

  // Only auto-assign if confidence is >= 0.4
  return {
    category: best.score >= 0.4 ? best.category : 'other',
    confidence: Math.round(best.score * 100) / 100,
  };
}

module.exports = { classifyQuery, tokenise, CATEGORY_KEYWORDS };