const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['uploaded', 'generated'], required: true },
  template: { type: String }, // For generated resumes
  content: { type: String }, // HTML content for generated resumes
  fileUrl: { type: String }, // For uploaded resumes
  fileName: { type: String }, // Original filename for uploaded resumes
  data: { type: Object }, // Resume data for generated resumes
  isActive: { type: Boolean, default: true }, // Primary resume flag
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
resumeSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Resume', resumeSchema); 