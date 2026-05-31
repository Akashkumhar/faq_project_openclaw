const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Question is required'],
    trim: true,
    maxlength: [500, 'Question cannot exceed 500 characters'],
  },
  answer: {
    type: String,
    required: [true, 'Answer is required'],
  },
  category: {
    type: String,
    default: 'other',
  },
  screenshot: {
    type: String,
    default: null,
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published',
  },
  viewCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  helpful: {
    type: Number,
    default: 0,
    min: 0,
  },
  notHelpful: {
    type: Number,
    default: 0,
    min: 0,
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  ratingCount: {
    type: Number,
    default: 0,
  },
  ratings: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    score: { type: Number, min: 1, max: 5 },
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  publishedAt: {
    type: Date,
  },
  // Semantic search — 384-dim embedding (all-MiniLM-L6-v2), never exposed via API
  embedding: {
    type: [Number],
    select: false,
  },
  embeddingUpdatedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Index for full-text search
faqSchema.index({ question: 'text', answer: 'text', tags: 'text' });

const FAQ = mongoose.model('FAQ', faqSchema);
module.exports = FAQ;