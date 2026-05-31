const express = require('express');
const router = express.Router();
const { getStats, getRecentQueries, getFAQStats } = require('../controllers/dashboardController');
const { getMyStats, getMyActivity, getRecommendedFAQs } = require('../controllers/personalizedController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/stats', getStats);
router.get('/recent-queries', getRecentQueries);
router.get('/faq-stats', getFAQStats);
router.get('/my-stats', getMyStats);
router.get('/my-activity', getMyActivity);
router.get('/recommended-faqs', getRecommendedFAQs);

module.exports = router;