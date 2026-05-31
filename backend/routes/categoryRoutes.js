const express = require('express');
const router = express.Router();
const { getCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { authenticate } = require('../middleware/auth');
const { adminOnly } = require('../middleware/roleGuard');
const validate = require('../middleware/validate');
const { body } = require('express-validator');

router.get('/', getCategories);

router.post('/', authenticate, adminOnly, [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('displayName').trim().notEmpty().withMessage('Display name is required'),
], validate, createCategory);

router.put('/:id', authenticate, adminOnly, [
  body('displayName').optional().trim().notEmpty(),
], validate, updateCategory);

router.delete('/:id', authenticate, adminOnly, deleteCategory);

module.exports = router;