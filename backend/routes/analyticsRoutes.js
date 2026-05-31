const express = require('express');
const router = express.Router();
const {
  getOverview,
  getQueryVolume,
  getCategoryBreakdown,
  getStatusBreakdown,
  getTopContributors,
  getBulkSummary,
} = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/auth');
const { staffOrAdmin } = require('../middleware/roleGuard');

router.use(authenticate);
router.use(staffOrAdmin);

router.get('/overview', getOverview);
router.get('/query-volume', getQueryVolume);
router.get('/category-breakdown', getCategoryBreakdown);
router.get('/status-breakdown', getStatusBreakdown);
router.get('/top-contributors', getTopContributors);
router.get('/bulk-summary', getBulkSummary);

module.exports = router;