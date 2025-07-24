const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Notification = require('../models/Notification');

// Get user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, skills, experience, resumeUrl, linkedin, company } = req.body;
    
    const updateData = { name };
    
    // Update profile fields for candidates
    if (skills !== undefined) updateData['profile.skills'] = skills;
    if (experience !== undefined) updateData['profile.experience'] = experience;
    if (resumeUrl !== undefined) updateData['profile.resumeUrl'] = resumeUrl;
    if (linkedin !== undefined) updateData['profile.linkedin'] = linkedin;
    
    // Update company fields for employers
    if (company) {
      if (company.name !== undefined) updateData['company.name'] = company.name;
      if (company.industry !== undefined) updateData['company.industry'] = company.industry;
      if (company.about !== undefined) updateData['company.about'] = company.about;
      if (company.website !== undefined) updateData['company.website'] = company.website;
    }
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    ).select('-password');
    
    res.json(user);
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get recommended jobs for candidate
router.get('/recommended-jobs', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'candidate') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const user = await User.findById(req.user.id);
    const userSkills = user.profile.skills || [];
    
    // Find jobs that match user skills
    const jobs = await Job.find({ status: 'Open' })
      .populate('employer', 'name company.name')
      .limit(10);
    
    // Calculate match percentage for each job
    const jobsWithMatch = jobs.map(job => {
      const jobSkills = job.skills || [];
      const matchingSkills = userSkills.filter(skill => 
        jobSkills.some(jobSkill => 
          jobSkill.toLowerCase().includes(skill.toLowerCase())
        )
      );
      const matchPercent = jobSkills.length > 0 ? 
        Math.round((matchingSkills.length / jobSkills.length) * 100) : 0;
      
      return {
        ...job.toObject(),
        match: matchPercent
      };
    }).sort((a, b) => b.match - a.match);
    
    res.json(jobsWithMatch);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get saved jobs
router.get('/saved-jobs', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'candidate') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const user = await User.findById(req.user.id).populate('profile.wishlist');
    res.json(user.profile.wishlist || []);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Save/unsave a job
router.post('/save-job/:jobId', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'candidate') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const user = await User.findById(req.user.id);
    const jobId = req.params.jobId;
    
    const isSaved = user.profile.wishlist.includes(jobId);
    if (isSaved) {
      user.profile.wishlist = user.profile.wishlist.filter(id => id.toString() !== jobId);
    } else {
      user.profile.wishlist.push(jobId);
    }
    
    await user.save();
    res.json({ message: isSaved ? 'Job removed from saved' : 'Job saved' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get notifications
router.get('/notifications', authenticate, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark notification as read
router.put('/notifications/:id/read', authenticate, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 