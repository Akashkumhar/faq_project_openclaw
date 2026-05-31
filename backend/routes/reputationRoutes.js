const express = require('express');
const router = express.Router();
const {
  getLeaderboard,
  getMyReputation,
  getUserProfile,
  getGlobalStats,
} = require('../controllers/reputationController');
const { authenticate } = require('../middleware/auth');

router.get('/leaderboard', authenticate, getLeaderboard);
router.get('/me', authenticate, getMyReputation);
router.get('/user/:id', authenticate, getUserProfile);
router.get('/stats', authenticate, getGlobalStats);

module.exports = router;