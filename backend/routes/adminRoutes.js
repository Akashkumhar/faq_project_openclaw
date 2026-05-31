const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const { ROLES } = require('../utils/roles');

// All admin routes require admin or staff role
router.use(authenticate);
router.use(requireRole(ROLES.ADMIN, ROLES.SUPPORT_STAFF));

// Search reindex
router.post('/search/reindex', searchController.reindex);

// Vector index size
router.get('/search/indexed-count', searchController.getIndexSize);

// Load stored embeddings into memory index
router.post('/search/warm-index', searchController.warmIndex);

module.exports = router;