const Category = require('../models/Category');
const FAQ = require('../models/FAQ');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// @route   GET /api/categories
// @desc    Get all categories with FAQ count
// @access  Public
exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ order: 1, name: 1 });

  // Attach published FAQ count per category
  const withCounts = await Promise.all(categories.map(async (cat) => {
    const count = await FAQ.countDocuments({ category: cat.name, status: 'published' });
    return { ...cat.toObject(), faqCount: count };
  }));

  res.json({ success: true, data: withCounts });
});

// @route   POST /api/categories
// @desc    Create a category
// @access  Private (admin)
exports.createCategory = asyncHandler(async (req, res) => {
  const { name, displayName, description, icon, order } = req.body;
  if (!name || !displayName) throw ApiError.badRequest('Name and display name are required');

  const slug = name.toLowerCase().trim().replace(/\s+/g, '_');
  const existing = await Category.findOne({ name: slug });
  if (existing) throw ApiError.badRequest('Category already exists');

  const category = await Category.create({
    name: slug,
    displayName: displayName.trim(),
    description: description || '',
    icon: icon || '📁',
    order: order ?? 0,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, data: category });
});

// @route   PUT /api/categories/:id
// @desc    Update a category
// @access  Private (admin)
exports.updateCategory = asyncHandler(async (req, res) => {
  const cat = await Category.findById(req.params.id);
  if (!cat) throw ApiError.notFound('Category not found');

  const { displayName, description, icon, order } = req.body;
  if (displayName) cat.displayName = displayName.trim();
  if (description !== undefined) cat.description = description.trim();
  if (icon) cat.icon = icon.trim();
  if (order !== undefined) cat.order = Number(order);

  await cat.save();
  res.json({ success: true, data: cat });
});

// @route   DELETE /api/categories/:id
// @desc    Delete a category (only if no published FAQs)
// @access  Private (admin)
exports.deleteCategory = asyncHandler(async (req, res) => {
  const cat = await Category.findById(req.params.id);
  if (!cat) throw ApiError.notFound('Category not found');

  const faqCount = await FAQ.countDocuments({ category: cat.name });
  if (faqCount > 0) {
    throw ApiError.badRequest(`Cannot delete: ${faqCount} published FAQ(s) still use this category`);
  }

  await cat.deleteOne();
  res.json({ success: true, message: 'Category deleted' });
});