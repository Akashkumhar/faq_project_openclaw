const { Query } = require('../models/Query');
const FAQ = require('../models/FAQ');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// Simple text similarity: Jaccard index on word sets
function jaccardSimilarity(text1, text2) {
  const words1 = new Set(text1.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2));
  const words2 = new Set(text2.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2));
  if (words1.size === 0 || words2.size === 0) return 0;
  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);
  return intersection.size / union.size;
}

// @route   POST /api/duplicates/check
// @desc    Check for similar queries and FAQs before submission
// @access  Private
exports.checkDuplicates = asyncHandler(async (req, res) => {
  const { question, category } = req.body;
  if (!question || question.trim().length < 3) {
    return res.json({ success: true, data: { similarQueries: [], similarFAQs: [] } });
  }

  const queryText = question.trim().toLowerCase();

  // Search existing open queries (exclude closed/resolved)
  const openQueries = await Query.find({
    status: { $in: ['open', 'assigned', 'pending_approval', 'rejected'] },
  }).populate('raisedBy', 'name').sort({ createdAt: -1 }).limit(100);

  // Search published FAQs
  const publishedFAQs = await FAQ.find({ status: 'published' }).limit(100);

  // Score and rank similar queries
  const similarQueries = openQueries
    .map(q => ({
      _id: q._id,
      question: q.question,
      category: q.category,
      status: q.status,
      raisedBy: q.raisedBy,
      createdAt: q.createdAt,
      similarity: jaccardSimilarity(queryText, q.question),
    }))
    .filter(q => q.similarity >= 0.25)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5);

  // Score and rank similar FAQs
  const similarFAQs = publishedFAQs
    .map(f => ({
      _id: f._id,
      question: f.question,
      category: f.category,
      answer: f.answer,
      averageRating: f.averageRating,
      ratingCount: f.ratingCount,
      similarity: Math.max(
        jaccardSimilarity(queryText, f.question),
        jaccardSimilarity(queryText, f.answer || ''),
      ),
    }))
    .filter(f => f.similarity >= 0.2)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5);

  res.json({
    success: true,
    data: { similarQueries, similarFAQs },
  });
});

// @route   POST /api/duplicates/merge
// @desc    Merge a query into another (keeping the target, closing the source)
// @access  Private (staff+)
exports.mergeQueries = asyncHandler(async (req, res) => {
  const { sourceId, targetId, adminNote } = req.body;

  if (!sourceId || !targetId) throw ApiError.badRequest('sourceId and targetId are required');
  if (sourceId === targetId) throw ApiError.badRequest('Cannot merge a query into itself');

  const source = await Query.findById(sourceId);
  const target = await Query.findById(targetId);

  if (!source) throw ApiError.notFound('Source query not found');
  if (!target) throw ApiError.notFound('Target query not found');

  // Merge: append source description to target, close source
  const mergeNote = `\n\n[Merged from query ${source._id}] ${source.question}${source.description ? '\n' + source.description : ''}`;

  target.description = (target.description || '') + mergeNote;
  target.adminNote = (target.adminNote || '') + `\nMerged query ${source._id} (${source.question.substring(0, 50)}...)`;
  await target.save();

  source.status = 'closed';
  source.adminNote = (source.adminNote || '') + `\nMerged into query ${targetId}`;
  await source.save();

  const updated = await Query.findById(targetId)
    .populate('raisedBy', 'name email')
    .populate('assignedTo', 'name')
    .populate('solutionBy', 'name');

  res.json({ success: true, message: 'Queries merged successfully', data: updated });
});

// @route   GET /api/duplicates/similar/:id
// @desc    Find queries similar to a specific query
// @access  Private (staff+)
exports.findSimilar = asyncHandler(async (req, res) => {
  const query = await Query.findById(req.params.id);
  if (!query) throw ApiError.notFound('Query not found');

  const allOpen = await Query.find({
    _id: { $ne: query._id },
    status: { $in: ['open', 'assigned', 'pending_approval', 'rejected'] },
  }).populate('raisedBy', 'name').limit(200);

  const similar = allOpen
    .map(q => ({
      _id: q._id,
      question: q.question,
      category: q.category,
      status: q.status,
      raisedBy: q.raisedBy,
      createdAt: q.createdAt,
      similarity: jaccardSimilarity(query.question, q.question),
    }))
    .filter(q => q.similarity >= 0.25)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 10);

  res.json({ success: true, data: similar });
});
