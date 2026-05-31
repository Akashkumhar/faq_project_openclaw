'use strict';

const BLOCKED_PHRASES = [
  'yes', 'no', 'ok', 'okay', 'thanks', 'thank you', 'hi', 'hello',
  'bye', 'good', 'fine', 'sure', 'yep', 'nope', 'cool', 'great',
  'awesome', 'nice', 'got it', 'noted', 'understood', 'hmm', 'lol',
  'idk', 'wtf', 'omg', 'brb', 'tbh', 'imo', 'etc',
];

/**
 * Check if text is just a blocked filler phrase.
 * @param {string} text
 * @returns {boolean}
 */
function isSpam(text) {
  if (!text || typeof text !== 'string') return false;
  const normalised = text.trim().toLowerCase().replace(/[^a-z\s]/g, '');
  if (BLOCKED_PHRASES.includes(normalised)) return true;
  const words = normalised.split(/\s+/).filter(Boolean);
  if (words.length > 0 && words.length < 3) return true;
  return false;
}

/**
 * Check if text fails quality checks (caps, repeats, etc.)
 * Returns an array of failure reasons (empty = passes)
 * @param {string} text
 * @returns {string[]}
 */
function getQualityFailures(text) {
  if (!text || typeof text !== 'string') return ['Text is empty'];
  const failures = [];

  if (text.trim().length < 20) {
    failures.push('Question must be at least 20 characters');
  }

  // All caps (allowing punctuation and spaces)
  if (/^[A-Z\s!?.]+$/.test(text.trim())) {
    failures.push('Do not use ALL CAPS');
  }

  // Repeated characters like "helloooooo"
  if (/(.)\1{4,}/.test(text)) {
    failures.push('Avoid repeated characters (e.g., "helloooooo")');
  }

  return failures;
}

/**
 * Full validation: spam + quality + rate limit.
 * Returns { valid: boolean, reasons: string[] }
 * @param {string} text
 * @returns {{ valid: boolean, reasons: string[] }}
 */
function validateText(text) {
  const reasons = [];
  if (isSpam(text)) {
    reasons.push('Message is too short or meaningless');
  }
  const qualityFailures = getQualityFailures(text);
  reasons.push(...qualityFailures);
  return { valid: reasons.length === 0, reasons };
}

module.exports = { isSpam, getQualityFailures, validateText, BLOCKED_PHRASES };