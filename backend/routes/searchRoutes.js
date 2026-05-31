const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const { ROLES } = require('../utils/roles');

// Public search
router.get('/', searchController.search);
router.post('/feedback', authenticate, searchController.feedback);

// Admin: search analytics & management
router.get('/logs', authenticate, requireRole(ROLES.ADMIN), searchController.getLogs);
router.get('/stats', authenticate, requireRole(ROLES.ADMIN), searchController.getStats);

module.exports = router;