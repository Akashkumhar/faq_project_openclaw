const { Query } = require('../models/Query');
const { FAQ } = require('../models/FAQ');
const Discussion = require('../models/Discussion');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

// @route   GET /api/dashboard/my-stats
// @desc    Personal stats for the logged-in user
// @access  Private
exports.getMyStats = asyncHandler(async (req, res) => {
  const uid = req.user._id;

  const [
    totalQueries,
    openQueries,
    resolvedQueries,
    discussionCount,
    user,
  ] = await Promise.all([
    Query.countDocuments({ raisedBy: uid }),
    Query.countDocuments({ raisedBy: uid, status: { $in: ['open', 'assigned'] } }),
    Query.countDocuments({ raisedBy: uid, status: 'resolved' }),
    Discussion.countDocuments({ author: uid }),
    User.findById(uid).select('stats createdAt'),
  ]);

  // Queries by status breakdown
  const statusBreakdown = await Query.aggregate([
    { $match: { raisedBy: uid } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  // Categories the user asks about most
  const topCategories = await Query.aggregate([
    { $match: { raisedBy: uid } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);

  res.json({
    success: true,
    data: {
      stats: user?.stats || {},
      totalQueries,
      openQueries,
      resolvedQueries,
      discussionCount,
      statusBreakdown,
      topCategories,
      memberSince: user?.createdAt,
    },
  });
});

// @route   GET /api/dashboard/my-activity
// @desc    Recent activity for the logged-in user
// @access  Private
exports.getMyActivity = asyncHandler(async (req, res) => {
  const uid = req.user._id;
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Recent queries raised by user
  const [queries, queryCount] = await Promise.all([
    Query.find({ raisedBy: uid })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('assignedTo', 'name')
      .select('question status category priority createdAt updatedAt'),
    Query.countDocuments({ raisedBy: uid }),
  ]);

  // Discussions the user participated in
  const discussions = await Discussion.find({ author: uid })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate({
      path: 'queryId',
      select: 'question status',
    });

  res.json({
    success: true,
    data: {
      queries,
      queryCount,
      page: parseInt(page),
      pages: Math.ceil(queryCount / parseInt(limit)),
      discussions: discussions.map(d => ({
        _id: d._id,
        content: d.content.substring(0, 100),
        query: d.queryId,
        isVerified: d.isVerified,
        createdAt: d.createdAt,
      })),
    },
  });
});

// @route   GET /api/dashboard/recommended-faqs
// @desc    Recommended FAQs based on user's query history categories
// @access  Private
exports.getRecommendedFAQs = asyncHandler(async (req, res) => {
  const uid = req.user._id;
  const limit = parseInt(req.query.limit) || 8;

  // Find the categories the user asks about most
  const topCategories = await Query.aggregate([
    { $match: { raisedBy: uid } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 3 },
  ]);

  if (topCategories.length === 0) {
    // Fallback: return most viewed/popular FAQs
    const popular = await FAQ.find({ status: 'published' })
      .sort({ viewCount: -1, helpful: -1 })
      .limit(limit)
      .select('question answer category viewCount helpful averageRating tags');
    return res.json({ success: true, data: popular, source: 'popular' });
  }

  const categoryNames = topCategories.map(c => c._id);

  // Get unpublished FAQs in user's categories (hidden gems)
  const recommended = await FAQ.find({
    status: 'published',
    category: { $in: categoryNames },
  })
    .sort({ helpful: -1, viewCount: -1, averageRating: -1 })
    .limit(limit)
    .select('question answer category viewCount helpful averageRating tags');

  res.json({
    success: true,
    data: recommended,
    source: 'personalized',
    basedOnCategories: categoryNames,
  });
});