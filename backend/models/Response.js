const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: { type: String, required: true },
  questionType: { type: String, required: true },
  answer: mongoose.Schema.Types.Mixed
}, { _id: false });

const responseSchema = new mongoose.Schema({
  formId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Form', 
    required: true,
    index: true
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    index: true,
    // Optional for anonymous responses
    required: false
  },
  answers: [answerSchema],
  score: {
    type: Number,
    default: 0,
    min: 0
  },
  maxScore: {
    type: Number,
    default: 0,
    min: 0
  },
  submittedAt: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  ipAddress: String,
  userAgent: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for checking if response is from authenticated user
responseSchema.virtual('isAuthenticated').get(function() {
  return !!this.userId;
});

// Virtual for user display name
responseSchema.virtual('userDisplayName').get(function() {
  if (this.userId && this.userId.name) {
    return this.userId.name;
  }
  return 'Anonymous';
});

// Virtual for user email
responseSchema.virtual('userEmail').get(function() {
  if (this.userId && this.userId.email) {
    return this.userId.email;
  }
  return 'Anonymous';
});

// Virtual for score percentage
responseSchema.virtual('scorePercentage').get(function() {
  if (this.maxScore > 0) {
    return Math.round((this.score / this.maxScore) * 100);
  }
  return 0;
});

// Index for better query performance
responseSchema.index({ formId: 1, submittedAt: -1 });
responseSchema.index({ userId: 1, submittedAt: -1 });

module.exports = mongoose.model('Response', responseSchema);