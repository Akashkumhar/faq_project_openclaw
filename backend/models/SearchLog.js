const mongoose = require('mongoose');

const searchLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null, // null for public/unauthenticated searches
  },
  rawQuery: {
    type: String,
    required: true,
    trim: true,
  },
  cleanedQuery: {
    type: String,
    trim: true,
  },
  mode: {
    type: String,
    enum: ['semantic', 'keyword', 'hybrid'],
    default: 'hybrid',
  },
  topResultIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FAQ',
  }],
  resultCount: {
    type: Number,
    default: 0,
  },
  durationMs: {
    type: Number,
    default: 0,
  },
  clickedResultId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FAQ',
    default: null,
  },
}, {
  timestamps: true,
});

searchLogSchema.index({ rawQuery: 'text', cleanedQuery: 'text' });
searchLogSchema.index({ createdAt: -1 });
searchLogSchema.index({ userId: 1, createdAt: -1 });

const SearchLog = mongoose.model('SearchLog', searchLogSchema);
module.exports = SearchLog;