const express = require('express');
const router = express.Router();
const {
  getDiscussions,
  createDiscussion,
  toggleUpvote,
  deleteDiscussion,
  verifyDiscussion,
} = require('../controllers/discussionController');
const { authenticate } = require('../middleware/auth');
const { staffOrAdmin } = require('../middleware/roleGuard');
const { body } = require('express-validator');
const validate = require('../middleware/validate');

// /api/queries/:queryId/discussions
router.get('/queries/:queryId/discussions', authenticate, getDiscussions);
router.post('/queries/:queryId/discussions', authenticate, [
  body('content').trim().isLength({ min: 10, max: 2000 }).withMessage('Content must be 10–2000 characters'),
  body('parentId').optional().isMongoId(),
], validate, createDiscussion);

// /api/discussions/:id/...
router.put('/:id/upvote', authenticate, toggleUpvote);
router.delete('/:id', authenticate, deleteDiscussion);
router.put('/:id/verify', authenticate, staffOrAdmin, verifyDiscussion);

module.exports = router;