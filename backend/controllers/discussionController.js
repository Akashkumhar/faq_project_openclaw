const Discussion = require('../models/Discussion');
const { Query } = require('../models/Query');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../utils/roles');
const { isSpam } = require('../utils/spamFilter');
const { awardPoints } = require('../utils/reputation');

// @route   GET /api/queries/:queryId/discussions
// @desc    Get all discussion threads for a query
// @access  Private
exports.getDiscussions = asyncHandler(async (req, res) => {
  const { queryId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const queryExists = await Query.exists({ _id: queryId });
  if (!queryExists) throw ApiError.notFound('Query not found');

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [discussions, total] = await Promise.all([
    Discussion.find({ queryId, parentId: null })
      .populate('author', 'name avatar department reputationPoints')
      .populate('verifiedBy', 'name')
      .populate('upvotes', '_id')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Discussion.countDocuments({ queryId, parentId: null }),
  ]);

  // Fetch replies for all top-level discussions
  const discussionIds = discussions.map(d => d._id);
  const replies = await Discussion.find({ parentId: { $in: discussionIds } })
    .populate('author', 'name avatar department reputationPoints')
    .populate('verifiedBy', 'name')
    .populate('upvotes', '_id')
    .sort({ createdAt: 1 });

  const repliesByParent = {};
  replies.forEach(r => {
    if (!repliesByParent[r.parentId]) repliesByParent[r.parentId] = [];
    repliesByParent[r.parentId].push(r);
  });

  const result = discussions.map(d => ({
    ...d.toObject(),
    replies: repliesByParent[d._id] || [],
  }));

  res.json({ success: true, data: result, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
});

// @route   POST /api/queries/:queryId/discussions
// @desc    Post a discussion comment (or reply)
// @access  Private
exports.createDiscussion = asyncHandler(async (req, res) => {
  const { queryId } = req.params;
  const { content, parentId } = req.body;

  if (!content || !content.trim()) throw ApiError.badRequest('Content is required');
  if (isSpam(content)) throw ApiError.badRequest('Message is too short or meaningless');
  if (content.trim().length < 10) throw ApiError.badRequest('Discussion must be at least 10 characters');

  const query = await Query.findById(queryId);
  if (!query) throw ApiError.notFound('Query not found');

  if (parentId) {
    const parent = await Discussion.findById(parentId);
    if (!parent || parent.queryId.toString() !== queryId) {
      throw ApiError.badRequest('Invalid parent discussion');
    }
    if (parent.parentId) throw ApiError.badRequest('Maximum reply depth is 2 levels');
  }

  const discussion = await Discussion.create({
    queryId,
    author: req.user._id,
    content: content.trim(),
    parentId: parentId || null,
  });

  // Award points for posting a discussion
  await awardPoints(await User.findById(req.user._id), 'QUERY_ASKED'); // reuse discussion action

  const populated = await Discussion.findById(discussion._id)
    .populate('author', 'name avatar department reputationPoints')
    .populate('upvotes', '_id');

  res.status(201).json({ success: true, data: populated });
});

// @route   PUT /api/discussions/:id/upvote
// @desc    Toggle upvote on a discussion
// @access  Private
exports.toggleUpvote = asyncHandler(async (req, res) => {
  const discussion = await Discussion.findById(req.params.id);
  if (!discussion) throw ApiError.notFound('Discussion not found');

  const alreadyUpvoted = discussion.upvotes.some(
    u => u.toString() === req.user._id.toString()
  );

  if (alreadyUpvoted) {
    discussion.upvotes = discussion.upvotes.filter(
      u => u.toString() !== req.user._id.toString()
    );
  } else {
    discussion.upvotes.push(req.user._id);
  }

  await discussion.save();

  const updated = await Discussion.findById(discussion._id)
    .populate('author', 'name avatar department reputationPoints')
    .populate('upvotes', '_id');

  res.json({
    success: true,
    data: {
      upvoteCount: updated.upvotes.length,
      upvoted: updated.upvotes.some(u => u._id.toString() === req.user._id.toString()),
    },
  });
});

// @route   DELETE /api/discussions/:id
// @desc    Delete own comment or admin
// @access  Private
exports.deleteDiscussion = asyncHandler(async (req, res) => {
  const discussion = await Discussion.findById(req.params.id);
  if (!discussion) throw ApiError.notFound('Discussion not found');

  const isOwner = discussion.author.toString() === req.user._id.toString();
  const isStaffOrAdmin = [ROLES.ADMIN, ROLES.SUPPORT_STAFF].includes(req.user.role);

  if (!isOwner && !isStaffOrAdmin) {
    throw ApiError.forbidden('You can only delete your own comments');
  }

  // Also delete child replies
  await Discussion.deleteMany({ $or: [{ _id: discussion._id }, { parentId: discussion._id }] });

  res.json({ success: true, message: 'Discussion deleted' });
});

// @route   PUT /api/discussions/:id/verify
// @desc    Mark discussion as verified (staff+)
// @access  Private (staff+)
exports.verifyDiscussion = asyncHandler(async (req, res) => {
  if (![ROLES.ADMIN, ROLES.SUPPORT_STAFF].includes(req.user.role)) {
    throw ApiError.forbidden('Only staff or admin can verify discussions');
  }

  const discussion = await Discussion.findById(req.params.id);
  if (!discussion) throw ApiError.notFound('Discussion not found');

  discussion.isVerified = !discussion.isVerified;
  if (discussion.isVerified) {
    discussion.verifiedBy = req.user._id;
    await awardPoints(await User.findById(discussion.author), 'REPLY_APPROVED');
  } else {
    discussion.verifiedBy = null;
  }
  await discussion.save();

  const updated = await Discussion.findById(discussion._id)
    .populate('author', 'name avatar department reputationPoints')
    .populate('verifiedBy', 'name');

  res.json({ success: true, data: updated });
});