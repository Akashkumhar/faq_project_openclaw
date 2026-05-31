/**
 * VectorStore — abstract interface + in-memory cosine-similarity implementation.
 *
 * Stores FAQ embeddings in memory, indexed by string (mongoose ObjectId).
 * Provides fast top-K similarity search using cosine-similarity.
 *
 * For production at scale (100k+ vectors) swap to MongoDB Atlas Vector Search
 * or a dedicatedANN library by implementing the same interface.
 */

const cosineSimilarity = require('cosine-similarity');

// ─── In-MemoryVectorStore ────────────────────────────────────────────────────

class InMemoryVectorStore {
  constructor() {
    /** @type {Map<string, number[]>}  faqId → embedding vector */
    this._vectors = new Map();
    /** @type {Map<string, object>}  faqId → raw FAQ doc snapshot (for display) */
    this._meta = new Map();
  }

  /**
   * Store (or update) a vector for one FAQ.
   * @param {string} faqId  — stringified mongoose ObjectId
   * @param {number[]} vector  — 384-dim array
   * @param {object} meta  — { question, answer, category, tags }
   */
  upsert(faqId, vector, meta = {}) {
    this._vectors.set(faqId, vector);
    this._meta.set(faqId, meta);
  }

  /**
   * Remove a vector from the index.
   * @param {string} faqId
   */
  delete(faqId) {
    this._vectors.delete(faqId);
    this._meta.delete(faqId);
  }

  /**
   * Search for the top-K nearest vectors to the query vector.
   * @param {number[]} queryVector  — 384-dim
   * @param {number} topK
   * @returns {Array<{id: string, score: number, meta: object}>}
   */
  search(queryVector, topK = 10) {
    const results = [];

    for (const [faqId, vec] of this._vectors.entries()) {
      if (vec.length !== queryVector.length) continue;
      const score = cosineSimilarity(queryVector, vec);
      results.push({ id: faqId, score, meta: this._meta.get(faqId) ?? {} });
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  /** Total number of indexed vectors */
  get size() {
    return this._vectors.size;
  }

  /** Clear the entire index */
  clear() {
    this._vectors.clear();
    this._meta.clear();
  }
}

// ─── Singleton export ────────────────────────────────────────────────────────

const vectorStore = new InMemoryVectorStore();

module.exports = { vectorStore, InMemoryVectorStore };