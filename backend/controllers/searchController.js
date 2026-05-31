/**
 * searchController.js
 *
 * Endpoints:
 *   GET  /api/search?q=<text>&limit=10&mode=semantic|keyword|hybrid   — public unified search
 *   POST /api/search/feedback                                            — log result click-through
 *   GET  /api/search/logs        (admin)                                 — paginated search logs
 *   POST /api/admin/search/reindex (admin)                               — re-embed all published FAQs
 *   GET  /api/admin/search/stats  (admin)                                — search analytics
 */

const FAQ = require('../models/FAQ');
const SearchLog = require('../models/SearchLog');
const { semanticSearch } = require('../utils/searchPipeline');
const { embed } = require('../utils/embedder');
const { vectorStore } = require('../utils/vectorStore');
const asyncHandler = require('../utils/asyncHandler');

// ─── Public: Unified Search ────────────────────────────────────────────────

exports.search = asyncHandler(async (req, res) => {
  const { q, limit = '10', mode = 'hybrid' } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({ success: false, message: 'Query too short (min 2 chars)' });
  }

  const n = Math.min(parseInt(limit, 10) || 10, 50);
  const searchMode = ['semantic', 'keyword', 'hybrid'].includes(mode) ? mode : 'hybrid';

  const { results, durationMs, cleaned } = await semanticSearch(q, { limit: n, mode: searchMode });

  // Log the search (skip for unauthenticated users who just want quick answers)
  try {
    const log = await SearchLog.create({
      userId: req.user?._id || null,
      rawQuery: q.trim(),
      cleanedQuery: cleaned,
      mode: searchMode,
      topResultIds: results.slice(0, 3).map(r => r.id),
      resultCount: results.length,
      durationMs,
    });
    // Attach log id so client can later send click feedback
    res.set('X-Search-Log-Id', log._id.toString());
  } catch (logErr) {
    // Never let logging errors break the search response
    console.warn('[search] log insert failed:', logErr.message);
  }

  res.json({
    success: true,
    data: {
      query: q,
      mode: searchMode,
      durationMs,
      results,
    },
  });
});

// ─── Public: Click-Through Feedback ────────────────────────────────────────

exports.feedback = asyncHandler(async (req, res) => {
  const { queryText, clickedFaqId, searchLogId } = req.body;

  const update = {};
  if (clickedFaqId) update.clickedResultId = clickedFaqId;

  if (searchLogId) {
    await SearchLog.findByIdAndUpdate(searchLogId, update);
  } else if (queryText) {
    // Fallback: find most recent log for this queryText
    await SearchLog.findOneAndUpdate(
      { rawQuery: queryText },
      update,
      { sort: { createdAt: -1 } }
    );
  }

  res.json({ success: true });
});

// ─── Admin: Search Logs ─────────────────────────────────────────────────────

exports.getLogs = asyncHandler(async (req, res) => {
  const { page = '1', limit = '20', q } = req.query;
  const n = Math.min(parseInt(limit, 10) || 20, 100);
  const skip = (parseInt(page, 10) - 1) * n;

  const filter = {};
  if (q) filter.rawQuery = new RegExp(q, 'i');

  const [logs, total] = await Promise.all([
    SearchLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(n)
      .populate('userId', 'name email')
      .populate('clickedResultId', 'question')
      .lean(),
    SearchLog.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { logs, total, page: parseInt(page, 10), pages: Math.ceil(total / n) },
  });
});

// ─── Admin: Search Analytics ────────────────────────────────────────────────

exports.getStats = asyncHandler(async (req, res) => {
  const { days = '30' } = req.query;
  const since = new Date(Date.now() - parseInt(days, 10) * 86400000);

  const [
    totalSearches,
    uniqueQueriesArr,
    zeroResultCount,
    avgDuration,
    topQueriesAgg,
    zeroResultQueriesArr,
    totalClicksCount,
    positiveFeedbackCount,
    modeBreakdownAgg,
    topClickedAgg,
    indexedFaqsCount,
  ] = await Promise.all([
    SearchLog.countDocuments({ createdAt: { $gte: since } }),
    SearchLog.distinct('rawQuery', { createdAt: { $gte: since } }),
    SearchLog.countDocuments({ createdAt: { $gte: since }, resultCount: 0 }),
    SearchLog.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: null, avgMs: { $avg: '$durationMs' } } },
    ]),
    SearchLog.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$rawQuery', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]),
    SearchLog.find({ createdAt: { $gte: since }, resultCount: 0 })
      .sort({ createdAt: -1 }).limit(20).select('rawQuery createdAt').lean(),
    // clicks = logs where a result was clicked
    SearchLog.countDocuments({ createdAt: { $gte: since }, clickedResultId: { $ne: null } }),
    // positive feedback = logs that had a click (proxy for helpfulness)
    SearchLog.countDocuments({ createdAt: { $gte: since }, clickedResultId: { $ne: null } }),
    // mode breakdown
    SearchLog.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$mode', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    // top clicked FAQs
    SearchLog.aggregate([
      { $match: { createdAt: { $gte: since }, clickedResultId: { $ne: null } } },
      { $group: { _id: '$clickedResultId', clicks: { $sum: 1 } } },
      { $sort: { clicks: -1 } },
      { $limit: 7 },
      { $lookup: { from: 'faqs', localField: '_id', foreignField: '_id', as: 'faq' } },
      { $unwind: { path: '$faq', preserveNullAndEmptyArrays: true } },
    ]),
    // indexed FAQs count (those with embeddings)
    FAQ.countDocuments({ status: 'published', embedding: { $exists: true, $not: { $size: 0 } } }),
  ]);

  const ctr = totalSearches > 0 ? Math.round((totalClicksCount / totalSearches) * 100) : 0;
  const feedbackRate = totalSearches > 0 ? Math.round((positiveFeedbackCount / totalSearches) * 100) : 0;

  res.json({
    success: true,
    data: {
      periodDays: parseInt(days, 10),
      totalSearches,
      uniqueQueries: uniqueQueriesArr.length,
      zeroResultRate: totalSearches > 0 ? Math.round((zeroResultCount / totalSearches) * 100) : 0,
      avgLatencyMs: avgDuration[0]?.avgMs ? Math.round(avgDuration[0].avgMs) : 0,
      // Fields the frontend expects:
      totalClicks: totalClicksCount,
      ctr,
      positiveFeedback: positiveFeedbackCount,
      feedbackRate,
      modeBreakdown: modeBreakdownAgg,
      topClicked: topClickedAgg.map(t => ({ _id: t._id, clicks: t.clicks, faq: t.faq || null })),
      indexedFaqs: indexedFaqsCount,
      topQueries: topQueriesAgg.map(t => ({ query: t._id, count: t.count })),
      zeroResultQueries: zeroResultQueriesArr.map(z => ({ query: z.rawQuery, count: 1 })),
    },
  });
});

// ─── Admin: Reindex All FAQ Embeddings ──────────────────────────────────────

exports.reindex = asyncHandler(async (req, res) => {
  console.log('[reindex] Starting — query:', req.query);
  const isBackfill = req.query.backfill === 'true';
  const faqs = await FAQ.find({ status: 'published' }).select('_id question answer category tags embedding');
  const total = faqs.length;

  let processed = 0;
  let skipped = 0;
  let errors = 0;

  for (const faq of faqs) {
    try {
      const hasEmbedding = faq.embedding && faq.embedding.length > 0;

      if (hasEmbedding && isBackfill) {
        // Backfill mode: skip already-embedded, just load into in-memory index
        vectorStore.upsert(faq._id.toString(), faq.embedding, {
          question: faq.question,
          answer: faq.answer,
          category: faq.category,
          tags: faq.tags,
        });
        skipped++;
        continue;
      }

      // Generate fresh embedding
      const textToEmbed = [faq.question, faq.answer, ...(faq.tags || [])].join(' ');
      const embedding = await embed(textToEmbed);

      faq.embedding = embedding;
      faq.embeddingUpdatedAt = new Date();
      await faq.save();

      vectorStore.upsert(faq._id.toString(), embedding, {
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        tags: faq.tags,
      });

      processed++;
    } catch (err) {
      console.warn(`[reindex] faq ${faq._id} failed:`, err.message, err.stack?.split('\n')[1] || '');
      errors++;
    }
  }
  console.log(`[reindex] Done — processed=${processed} skipped=${skipped} errors=${errors}`);

  res.json({
    success: true,
    message: `Reindexed ${processed}/${total} FAQs${skipped > 0 ? ` (${skipped} skipped — already had embeddings)` : ''}${errors > 0 ? ` (${errors} errors)` : ''}`,
    data: { processed, total, errors, skipped, indexedInMemory: vectorStore.size },
  });
});

// ─── Admin: Vector Index Size ───────────────────────────────────────────────
exports.getIndexSize = asyncHandler(async (req, res) => {
  const count = await FAQ.countDocuments({
    status: 'published',
    embedding: { $exists: true, $not: { $size: 0 } },
  });
  res.json({ success: true, data: { indexedFaqs: count, inMemorySize: vectorStore.size } });
});

// ─── Warm index helper (called at server startup) ───────────────────────────
async function _warmIndex() {
  const faqs = await FAQ.find({
    status: 'published',
    embedding: { $exists: true, $not: { $size: 0 } },
  }).select('_id question answer category tags embedding');
  vectorStore.clear();
  for (const faq of faqs) {
    vectorStore.upsert(faq._id.toString(), faq.embedding, {
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      tags: faq.tags,
    });
  }
  return faqs.length;
}

// ─── Admin: Load All Embeddings Into Memory ──────────────────────────────────
exports.warmIndex = asyncHandler(async (req, res) => {
  const count = await _warmIndex();
  res.json({ success: true, data: { loaded: count } });
});

// Named export for non-HTTP use (server startup)
exports._warmIndex = _warmIndex;