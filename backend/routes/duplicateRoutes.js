const express = require('express');
const router = express.Router();
const { checkDuplicates, mergeQueries, findSimilar } = require('../controllers/duplicateController');
const { authenticate } = require('../middleware/auth');
const { staffOrAdmin } = require('../middleware/roleGuard');

router.post('/check', authenticate, checkDuplicates);
router.post('/merge', authenticate, staffOrAdmin, mergeQueries);
router.get('/similar/:id', authenticate, staffOrAdmin, findSimilar);

module.exports = router;
