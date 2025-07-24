const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Not required for LinkedIn OAuth
  role: { type: String, enum: ['candidate', 'employer', 'admin'], required: true },
  status: { type: String, enum: ['active', 'banned'], default: 'active' },
  profile: {
    skills: [String],
    experience: String,
    resumeUrl: String,
    linkedin: String,
    resumeData: {
      id: String,
      template: String,
      content: String,
      generatedAt: Date,
      data: Object
    },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
    applications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Application' }],
  },
  company: {
    name: String,
    industry: String,
    about: String,
    website: String,
    jobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema); 