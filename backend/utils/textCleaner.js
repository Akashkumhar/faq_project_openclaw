/**
 * Normalise and clean text before embedding or indexing.
 * Strips stopwords, lowercases, removes noise characters.
 */

const STOPWORDS = new Set([
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', "you're",
  "you've", "you'll", "you'd", 'your', 'yours', 'yourself', 'yourselves', 'he',
  'him', 'his', 'himself', 'she', "she's", 'her', 'hers', 'herself', 'it', "it's",
  'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which',
  'who', 'whom', 'this', 'that', "that'll", 'these', 'those', 'am', 'is', 'are',
  'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do',
  'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because',
  'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against',
  'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again',
  'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all',
  'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
  'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will',
  'just', 'don', "don't", 'should', "should've", 'now', 'd', 'll', 'm', 'o', 're',
  've', 'y', 'ain', 'aren', "aren't", 'couldn', "couldn't", 'didn', "didn't",
  'doesn', "doesn't", 'hadn', "hadn't", 'hasn', "hasn't", 'haven', "haven't",
  'isn', "isn't", 'ma', 'mightn', "mightn't", 'mustn', "mustn't", 'needn',
  "needn't", 'shan', "shan't", 'shouldn', "shouldn't", 'wasn', "wasn't", 'weren',
  "weren't", 'won', "won't", 'wouldn', "wouldn't",
]);

/**
 * Clean a string for embedding: lowercase, strip punctuation, remove stopwords.
 * @param {string} text
 * @returns {string}
 */
function cleanText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')   // remove non-alphanumeric (keep apostrophes/hyphens)
    .replace(/\s+/g, ' ')             // collapse whitespace
    .trim()
    .split(' ')
    .filter(w => w.length > 1 && !STOPWORDS.has(w))
    .join(' ');
}

/**
 * Light clean — just lowercase and strip punctuation, for keyword search display.
 * @param {string} text
 * @returns {string}
 */
function lightClean(text) {
  if (!text || typeof text !== 'string') return '';
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

module.exports = { cleanText, lightClean, STOPWORDS };