const User = require('../models/User');
const { Query } = require('../models/Query');
const { getAllBadges, getEarnedBadges } = require('../utils/reputation');
const asyncHandler = require('../utils/asyncHandler');

// @route   GET /api/reputation/leaderboard
// @desc    Top 20 users by reputation points
// @access  Private
exports.getLeaderboard = asyncHandler(async (req, res) => {
  const top = await User.find({ isActive: true, role: { $in: ['user', 'student'] } })
    .select('name avatar department stats.reputationPoints stats.queriesAsked stats.solutionsSubmitted stats.solutionsApproved')
    .sort({ 'stats.reputationPoints': -1, 'stats.solutionsApproved': -1 })
    .limit(20);

  const ranked = top.map((u, i) => ({
    rank: i + 1,
    _id: u._id,
    name: u.name,
    avatar: u.avatar,
    department: u.department,
    stats: u.stats,
    badges: getEarnedBadges(u),
  }));

  res.json({ success: true, data: ranked });
});

// @route   GET /api/reputation/me
// @desc    Current user's reputation and badges
// @access  Private
exports.getMyReputation = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  // Find rank
  const rank = await User.countDocuments({
    isActive: true,
    role: { $in: ['user', 'student'] },
    'stats.reputationPoints': { $gt: user.stats?.reputationPoints || 0 },
  }) + 1;

  const allBadges = getAllBadges(user);
  const earnedBadges = allBadges.filter(b => b.earned);

  // Recent activity summary
  const [queriesAsked, solutionsApproved] = await Promise.all([
    Query.countDocuments({ raisedBy: user._id }),
    Query.countDocuments({ solutionBy: user._id, status: 'resolved' }),
  ]);

  res.json({
    success: true,
    data: {
      rank,
      stats: user.stats || {},
      earnedBadges,
      allBadges,
      activitySummary: { queriesAsked, solutionsApproved },
    },
  });
});

// @route   GET /api/reputation/user/:id
// @desc    Public profile of any user (badges + stats only)
// @access  Private
exports.getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('name avatar department stats createdAt');
  if (!user) throw new Error('User not found');

  const allBadges = getAllBadges(user);

  res.json({
    success: true,
    data: {
      name: user.name,
      avatar: user.avatar,
      department: user.department,
      stats: user.stats || {},
      badges: allBadges.filter(b => b.earned),
      memberSince: user.createdAt,
    },
  });
});

// @route   GET /api/reputation/stats
// @desc    Global reputation stats (admin overview)
// @access  Private
exports.getGlobalStats = asyncHandler(async (req, res) => {
  const [totalPoints, avgPoints, topUser, distribution] = await Promise.all([
    User.aggregate([{ $group: { _id: null, total: { $sum: '$stats.reputationPoints' } } }]),
    User.aggregate([{ $group: { _id: null, avg: { $avg: '$stats.reputationPoints' } } }]),
    User.findOne({ isActive: true, role: { $in: ['user', 'student'] } }).sort({ 'stats.reputationPoints': -1 }).select('name stats.reputationPoints'),
    User.aggregate([
      { $bucket: { groupBy: '$stats.reputationPoints', boundaries: [0, 50, 200, 500, 1000, Infinity], default: '1000+', countsByBranch: { low: {}, mid: {}, high: {}, veryHigh: {}, top: {} } } },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      totalPoints: totalPoints[0]?.total || 0,
      averagePoints: Math.round((avgPoints[0]?.avg || 0) * 10) / 10,
      topUser: topUser ? { name: topUser.name, points: topUser.stats?.reputationPoints || 0 } : null,
      distribution,
    },
  });
});