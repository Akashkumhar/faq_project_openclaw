const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    unique: true,
    lowercase: true,
  },
  displayName: {
    type: String,
    required: [true, 'Display name is required'],
    trim: true,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  icon: {
    type: String,
    default: '📁',
  },
  order: {
    type: Number,
    default: 0,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

categorySchema.index({ order: 1, name: 1 });

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;