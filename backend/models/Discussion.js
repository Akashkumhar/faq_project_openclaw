const mongoose = require('mongoose');

const discussionSchema = new mongoose.Schema({
  queryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Query',
    required: [true, 'Query ID is required'],
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required'],
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    minlength: [10, 'Discussion must be at least 10 characters'],
    maxlength: [2000, 'Discussion cannot exceed 2000 characters'],
  },
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  isVerified: {
    type: Boolean,
    default: false,
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Discussion',
    default: null,
  },
  isSpam: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

discussionSchema.index({ queryId: 1, createdAt: 1 });
discussionSchema.index({ parentId: 1 });

// Virtual for upvote count
discussionSchema.virtual('upvoteCount').get(function () {
  return this.upvotes ? this.upvotes.length : 0;
});

discussionSchema.set('toJSON', { virtuals: true });
discussionSchema.set('toObject', { virtuals: true });

const Discussion = mongoose.model('Discussion', discussionSchema);
module.exports = Discussion;