const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  salary: { type: String },
  skills: [String],
  type: { type: String, enum: ['Full-Time', 'Part-Time', 'Internship', 'Contract'], required: true },
  location: { type: String },
  employer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  applicants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Application' }],
  status: { type: String, enum: ['Open', 'Closed'], default: 'Open' },
  // LinkedIn integration fields
  linkedinId: { type: String },
  source: { type: String, enum: ['portal', 'linkedin'], default: 'portal' },
  company: { type: String },
  requirements: [String],
  benefits: [String],
  applicationUrl: { type: String },
  postedDate: { type: Date },
  // Posting to candidates fields
  postedToCandidates: { type: Boolean, default: false },
  postedAt: { type: Date },
  candidatesNotified: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Job', jobSchema); 