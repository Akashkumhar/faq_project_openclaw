/**
 * searchPipeline.js — orchestrates the full hybrid search flow.
 *
 * 1. Embed user query  →  384-dim vector
 * 2. Vector search     →  top-K semantic results (cosine similarity)
 * 3. BM25 / $text      →  top-K keyword results (MongoDB text index)
 * 4. RRF fusion        →  unified ranked list
 * 5. Enrich with FAQ metadata and return
 *
 * Environment variables:
 *   SEMANTIC_WEIGHT=0.7   — weight of semantic scores in hybrid mode (0–1)
 *   VECTOR_SEARCH_K=20    — top-K fetched from each retrieval arm before fusion
 */

const { embed } = require('./embedder');
const { vectorStore } = require('./vectorStore');
const { reciprocalRankFusion } = require('./rrfMerge');
const { cleanText } = require('./textCleaner');
const FAQ = require('../models/FAQ');

const SEMANTIC_WEIGHT = parseFloat(process.env.SEMANTIC_WEIGHT || '0.7');
const VECTOR_SEARCH_K = parseInt(process.env.VECTOR_SEARCH_K || '20', 10);

/**
 * Perform a hybrid search over published FAQs.
 *
 * @param {string} rawQuery   — raw user input
 * @param {object} opts
 * @param {number}   opts.limit       — max results to return (default 10)
 * @param {'semantic'|'keyword'|'hybrid'} opts.mode  — search mode (default hybrid)
 * @returns {Promise<Array<object>>}  enriched FAQ result objects
 */
async function semanticSearch(rawQuery, { limit = 10, mode = 'hybrid' } = {}) {
  const t0 = Date.now();
  const cleaned = cleanText(rawQuery);

  if (!cleaned) return [];

  let semanticResults = [];
  let keywordResults = [];

  // ── Step 1: Semantic arm ─────────────────────────────────────────────────
  if (mode !== 'keyword') {
    try {
      const queryVec = await embed(cleaned);
      semanticResults = vectorStore.search(queryVec, VECTOR_SEARCH_K);
    } catch (err) {
      console.warn('[searchPipeline] semantic arm failed:', err.message);
    }
  }

  // ── Step 2: Keyword arm (MongoDB $text) ─────────────────────────────────
  if (mode !== 'semantic') {
    try {
      const textResults = await FAQ.find(
        { status: 'published', $text: { $search: cleaned } },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' } })
        .limit(VECTOR_SEARCH_K)
        .select('_id');

      keywordResults = textResults.map(r => ({
        id: r._id.toString(),
        score: 1, // textScore not normalised; use constant so RRF treats it fairly
      }));
    } catch (err) {
      console.warn('[searchPipeline] keyword arm failed:', err.message);
    }
  }

  // ── Step 3: RRF Fusion ──────────────────────────────────────────────────
  let fused;
  if (mode === 'hybrid') {
    fused = reciprocalRankFusion([semanticResults, keywordResults]);
  } else if (mode === 'semantic') {
    fused = semanticResults;
  } else {
    fused = keywordResults;
  }

  // ── Step 4: Fetch and enrich FAQ documents ──────────────────────────────
  const topIds = fused.slice(0, limit).map(r => r.id);
  const faqs = await FAQ.find({ _id: { $in: topIds }, status: 'published' })
    .select('question answer category tags viewCount helpful')
    .lean();

  // Cosine-similarity lookup for semantic arm (genuine 0-1 score)
  const cosineMap = Object.fromEntries(
    semanticResults.map(r => [r.id, r.score])
  );
  // RRF rank-score lookup for hybrid fusion
  const rrfMap = Object.fromEntries(fused.map(r => [r.id, r.score]));

  const results = topIds
    .map(id => {
      const faq = faqs.find(f => f._id.toString() === id);
      if (!faq) return null;
      const cosine = cosineMap[id];
      const inSemantic = cosine !== undefined;
      // Show cosine similarity when available; fall back to RRF score
      const displayScore = cosine !== undefined ? cosine : (rrfMap[id] ?? 0);
      return {
        id: faq._id.toString(),
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        tags: faq.tags || [],
        viewCount: faq.viewCount || 0,
        helpful: faq.helpful || 0,
        score: displayScore,
        matchType: inSemantic ? 'semantic' : 'keyword',
      };
    })
    .filter(Boolean);

  const durationMs = Date.now() - t0;
  return { results, durationMs, mode, query: rawQuery, cleaned };
}

module.exports = { semanticSearch };