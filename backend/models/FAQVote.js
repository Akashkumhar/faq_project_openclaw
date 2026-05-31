const mongoose = require('mongoose');

const faqVoteSchema = new mongoose.Schema({
  faqId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FAQ',
    required: [true, 'FAQ ID is required'],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  vote: {
    type: String,
    enum: ['helpful', 'not_helpful'],
    required: [true, 'Vote type is required'],
  },
}, { timestamps: true });

// Compound unique index — one vote per user per FAQ
faqVoteSchema.index({ faqId: 1, userId: 1 }, { unique: true });

const FAQVote = mongoose.model('FAQVote', faqVoteSchema);
module.exports = FAQVote;