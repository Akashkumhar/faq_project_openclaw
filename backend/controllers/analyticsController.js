const { Query } = require('../models/Query');
const FAQ = require('../models/FAQ');
const Discussion = require('../models/Discussion');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

// @route   GET /api/analytics/overview
// @desc    High-level admin overview stats
// @access  Private (admin)
exports.getOverview = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay); startOfWeek.setDate(startOfWeek.getDate() - 7);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers, newUsersToday, newUsersThisWeek,
    totalQueries, queriesToday, queriesThisWeek,
    totalResolved, resolvedToday, resolvedThisWeek,
    pendingQueries,
    totalFAQs, publishedFAQs,
    totalDiscussions,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ createdAt: { $gte: startOfDay } }),
    User.countDocuments({ createdAt: { $gte: startOfWeek } }),
    Query.countDocuments({}),
    Query.countDocuments({ createdAt: { $gte: startOfDay } }),
    Query.countDocuments({ createdAt: { $gte: startOfWeek } }),
    Query.countDocuments({ status: 'resolved' }),
    Query.countDocuments({ status: 'resolved', approvedAt: { $gte: startOfDay } }),
    Query.countDocuments({ status: 'resolved', approvedAt: { $gte: startOfWeek } }),
    Query.countDocuments({ status: 'pending_approval' }),
    FAQ.countDocuments({}),
    FAQ.countDocuments({ status: 'published' }),
    Discussion.countDocuments({}),
  ]);

  res.json({
    success: true,
    data: {
      users: { total: totalUsers, newToday: newUsersToday, newThisWeek: newUsersThisWeek },
      queries: { total: totalQueries, today: queriesToday, thisWeek: queriesThisWeek, resolved: totalResolved, resolvedToday, resolvedThisWeek, pending: pendingQueries },
      faqs: { total: totalFAQs, published: publishedFAQs },
      discussions: { total: totalDiscussions },
    },
  });
});

// @route   GET /api/analytics/query-volume
// @desc    Daily query counts for the last 30 days
// @access  Private (admin)
exports.getQueryVolume = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const start = new Date();
  start.setDate(start.getDate() - days);

  const data = await Query.aggregate([
    { $match: { createdAt: { $gte: start } } },
    { $group: {
      _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
      raised: { $sum: 1 },
      resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
    }},
    { $sort: { _id: 1 } },
  ]);

  res.json({ success: true, data });
});

// @route   GET /api/analytics/category-breakdown
// @desc    Query and FAQ counts per category
// @access  Private (admin)
exports.getCategoryBreakdown = asyncHandler(async (req, res) => {
  const [queryCats, faqCats] = await Promise.all([
    Query.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    FAQ.aggregate([{ $match: { status: 'published' } }, { $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
  ]);

  res.json({ success: true, data: { queryCategories: queryCats, faqCategories: faqCats } });
});

// @route   GET /api/analytics/status-breakdown
// @desc    Queries by status
// @access  Private (admin)
exports.getStatusBreakdown = asyncHandler(async (req, res) => {
  const data = await Query.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  res.json({ success: true, data });
});

// @route   GET /api/analytics/top-contributors
// @desc    Top users by solutions approved
// @access  Private (admin)
exports.getTopContributors = asyncHandler(async (req, res) => {
  const top = await User.find({ isActive: true, role: { $in: ['user', 'student'] } })
    .select('name stats.reputationPoints stats.solutionsApproved stats.solutionsSubmitted')
    .sort({ 'stats.solutionsApproved': -1 })
    .limit(10);
  res.json({ success: true, data: top });
});

// @route   GET /api/analytics/bulk-actions-summary
// @desc    Summary of bulk actions stats
// @access  Private (admin)
exports.getBulkSummary = asyncHandler(async (req, res) => {
  const [queriesAddedToFAQ, resolvedWithoutFAQ] = await Promise.all([
    Query.countDocuments({ addedToFAQ: true }),
    Query.countDocuments({ status: 'resolved', addedToFAQ: false }),
  ]);
  res.json({ success: true, data: { queriesAddedToFAQ, resolvedWithoutFAQ } });
});