const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');

// Apply for a job
router.post('/apply', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'candidate') {
      return res.status(403).json({ message: 'Only candidates can apply for jobs' });
    }

    const { jobId, resumeUrl } = req.body;
    
    // Check if already applied
    const existingApplication = await Application.findOne({
      candidate: req.user.id,
      job: jobId
    });
    
    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }

    // Get job details for match calculation
    const job = await Job.findById(jobId);
    const candidate = await User.findById(req.user.id);
    
    // Calculate match percentage
    const jobSkills = job.skills || [];
    const candidateSkills = candidate.profile.skills || [];
    const matchingSkills = candidateSkills.filter(skill => 
      jobSkills.some(jobSkill => 
        jobSkill.toLowerCase().includes(skill.toLowerCase())
      )
    );
    const matchPercent = jobSkills.length > 0 ? 
      Math.round((matchingSkills.length / jobSkills.length) * 100) : 0;

    const application = new Application({
      candidate: req.user.id,
      job: jobId,
      resumeUrl,
      matchPercent
    });

    await application.save();

    // Add application to job's applicants array
    await Job.findByIdAndUpdate(jobId, {
      $push: { applicants: application._id }
    });

    // Add application to user's applications array
    await User.findByIdAndUpdate(req.user.id, {
      $push: { 'profile.applications': application._id }
    });

    res.status(201).json({ message: 'Application submitted successfully', application });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get applications by candidate (my applications)
router.get('/my-applications', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'candidate') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const applications = await Application.find({ candidate: req.user.id })
      .populate('job', 'title employer')
      .populate('job.employer', 'name company.name')
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get applications for employer's jobs
router.get('/employer-applications', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'employer') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get all jobs posted by this employer
    const employerJobs = await Job.find({ employer: req.user.id });
    const jobIds = employerJobs.map(job => job._id);

    const applications = await Application.find({ job: { $in: jobIds } })
      .populate('candidate', 'name email profile.skills')
      .populate('job', 'title')
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all applications (admin only)
router.get('/', authenticate, authorizeRoles('admin'), async (req, res) => {
  try {
    const applications = await Application.find()
      .populate('candidate', 'name email')
      .populate('job', 'title')
      .populate('job.employer', 'name')
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update application status (employer/admin)
router.put('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const application = await Application.findById(req.params.id)
      .populate('job', 'employer')
      .populate('candidate', 'name email');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if user is authorized to update this application
    if (req.user.role === 'employer' && application.job.employer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.user.role === 'candidate' && application.candidate.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    application.status = status;
    await application.save();

    res.json({ message: 'Application status updated', application });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get applications for a specific job
router.get('/job/:jobId', authenticate, async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user is authorized to view applications for this job
    if (req.user.role === 'employer' && job.employer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const applications = await Application.find({ job: req.params.jobId })
      .populate('candidate', 'name email profile.skills profile.experience')
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 