const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const Job = require('../models/Job');
const User = require('../models/User');

// Create job (employer only)
router.post('/', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'employer') {
      return res.status(403).json({ message: 'Only employers can post jobs' });
    }

    const { title, description, salary, skills, type, location } = req.body;
    
    const job = new Job({
      title,
      description,
      salary,
      skills: skills.split(',').map(skill => skill.trim()),
      type,
      location,
      employer: req.user.id
    });

    await job.save();

    // Add job to employer's jobs array
    await User.findByIdAndUpdate(req.user.id, {
      $push: { 'company.jobs': job._id }
    });

    res.status(201).json({ message: 'Job posted successfully', job });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all jobs (with filters)
router.get('/', async (req, res) => {
  try {
    const { title, location, type, skills } = req.query;
    const filter = { status: 'Open' };

    if (title) {
      filter.title = { $regex: title, $options: 'i' };
    }
    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }
    if (type) {
      filter.type = type;
    }
    if (skills) {
      const skillArray = skills.split(',').map(skill => skill.trim());
      filter.skills = { $in: skillArray };
    }

    const jobs = await Job.find(filter)
      .populate('employer', 'name company.name')
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get job by ID
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('employer', 'name company.name company.about company.website')
      .populate('applicants', 'candidate status matchPercent')
      .populate('applicants.candidate', 'name email profile.skills');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json(job);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update job (employer who posted it or admin)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user is authorized to update this job
    if (req.user.role === 'employer' && job.employer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { title, description, salary, skills, type, location, status } = req.body;
    
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (salary) updateData.salary = salary;
    if (skills) updateData.skills = skills.split(',').map(skill => skill.trim());
    if (type) updateData.type = type;
    if (location) updateData.location = location;
    if (status) updateData.status = status;

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('employer', 'name company.name');

    res.json({ message: 'Job updated successfully', job: updatedJob });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete job (employer who posted it or admin)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user is authorized to delete this job
    if (req.user.role === 'employer' && job.employer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: 'Job deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get jobs posted by employer
router.get('/employer/my-jobs', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'employer') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const jobs = await Job.find({ employer: req.user.id })
      .populate('applicants')
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all jobs (admin only)
router.get('/admin/all', authenticate, authorizeRoles('admin'), async (req, res) => {
  try {
    const jobs = await Job.find()
      .populate('employer', 'name email')
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve/reject job (admin only)
router.put('/admin/:id/approve', authenticate, authorizeRoles('admin'), async (req, res) => {
  try {
    const { approved } = req.body;
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    job.status = approved ? 'Open' : 'Rejected';
    await job.save();

    res.json({ message: `Job ${approved ? 'approved' : 'rejected'}`, job });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 