const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Notification = require('../models/Notification');
const linkedinService = require('../services/linkedinService');

// Get system summary
router.get('/summary', authenticate, authorizeRoles('admin'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalJobs = await Job.countDocuments();
    const totalApplications = await Application.countDocuments();
    const activeSessions = Math.floor(Math.random() * 200) + 100; // Mock for now

    res.json({
      totalUsers,
      totalJobs,
      totalApplications,
      activeSessions
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users
router.get('/users', authenticate, authorizeRoles('admin'), async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Ban user
router.put('/users/:id/ban', authenticate, authorizeRoles('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'banned' },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User banned successfully', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Unban user
router.put('/users/:id/unban', authenticate, authorizeRoles('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'active' },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User unbanned successfully', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user
router.delete('/users/:id', authenticate, authorizeRoles('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Also delete user's jobs and applications
    await Job.deleteMany({ employer: req.params.id });
    await Application.deleteMany({ candidate: req.params.id });

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all jobs for moderation
router.get('/jobs', authenticate, authorizeRoles('admin'), async (req, res) => {
  try {
    const jobs = await Job.find()
      .populate('employer', 'name email')
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve job
router.put('/jobs/:id/approve', authenticate, authorizeRoles('admin'), async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { status: 'Open' },
      { new: true }
    ).populate('employer', 'name email');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json({ message: 'Job approved successfully', job });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject job
router.put('/jobs/:id/reject', authenticate, authorizeRoles('admin'), async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { status: 'Rejected' },
      { new: true }
    ).populate('employer', 'name email');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json({ message: 'Job rejected successfully', job });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete job
router.delete('/jobs/:id', authenticate, authorizeRoles('admin'), async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Also delete related applications
    await Application.deleteMany({ job: req.params.id });

    res.json({ message: 'Job deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get analytics
router.get('/analytics', authenticate, authorizeRoles('admin'), async (req, res) => {
  try {
    // Calculate application success rate
    const totalApplications = await Application.countDocuments();
    const successfulApplications = await Application.countDocuments({
      status: { $in: ['Shortlisted', 'Hired'] }
    });
    const applicationRate = totalApplications > 0 ? 
      Math.round((successfulApplications / totalApplications) * 100) : 0;

    // Get top job categories
    const jobs = await Job.find();
    const categories = {};
    jobs.forEach(job => {
      const category = job.skills && job.skills.length > 0 ? job.skills[0] : 'Other';
      categories[category] = (categories[category] || 0) + 1;
    });
    
    const topCategories = Object.entries(categories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category]) => category);

    // Mock user growth data (in real app, you'd calculate this from actual data)
    const userGrowth = [120, 135, 142, 158, 167, 189, 201];
    const jobGrowth = [45, 52, 48, 61, 67, 73, 89];

    res.json({
      applicationRate,
      topCategories,
      userGrowth,
      jobGrowth
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Send broadcast notification
router.post('/broadcast', authenticate, authorizeRoles('admin'), async (req, res) => {
  try {
    const { message, targetUsers } = req.body;
    
    let usersToNotify = [];
    
    if (targetUsers.includes('all')) {
      usersToNotify = await User.find().select('_id');
    } else {
      if (targetUsers.includes('candidates')) {
        const candidates = await User.find({ role: 'candidate' }).select('_id');
        usersToNotify.push(...candidates);
      }
      if (targetUsers.includes('employers')) {
        const employers = await User.find({ role: 'employer' }).select('_id');
        usersToNotify.push(...employers);
      }
    }

    // Create notifications for all target users
    const notifications = usersToNotify.map(user => ({
      user: user._id,
      type: 'admin',
      message,
      read: false
    }));

    await Notification.insertMany(notifications);

    res.json({ 
      message: `Broadcast sent to ${usersToNotify.length} users`,
      recipients: usersToNotify.length
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get reports (mock data for now)
router.get('/reports', authenticate, authorizeRoles('admin'), async (req, res) => {
  try {
    // Mock reports data - in real app, you'd have a Report model
    const reports = [
      {
        id: 1,
        type: 'User Report',
        reporter: 'john@example.com',
        reported: 'bob@example.com',
        reason: 'Inappropriate behavior',
        status: 'pending',
        createdAt: new Date('2024-01-15')
      },
      {
        id: 2,
        type: 'Job Report',
        reporter: 'jane@company.com',
        reported: 'fake@job.com',
        reason: 'Fake job posting',
        status: 'investigating',
        createdAt: new Date('2024-01-14')
      }
    ];

    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// LinkedIn Integration Routes

// Search LinkedIn jobs
router.get('/linkedin/search', authenticate, authorizeRoles('admin'), async (req, res) => {
  try {
    const { keywords, location, limit } = req.query;
    
    if (!keywords) {
      return res.status(400).json({ message: 'Keywords are required' });
    }

    const linkedinJobs = await linkedinService.searchJobs(
      keywords, 
      location || '', 
      parseInt(limit) || 10
    );

    res.json({
      message: 'LinkedIn jobs fetched successfully',
      jobs: linkedinJobs,
      count: linkedinJobs.length
    });
  } catch (err) {
    console.error('LinkedIn search error:', err);
    res.status(500).json({ message: 'Failed to search LinkedIn jobs' });
  }
});

// Import single LinkedIn job
router.post('/linkedin/import/:linkedinId', authenticate, authorizeRoles('admin'), async (req, res) => {
  try {
    const { linkedinId } = req.params;
    const { keywords, location } = req.query;

    // First search for the specific job
    const linkedinJobs = await linkedinService.searchJobs(keywords, location, 50);
    const targetJob = linkedinJobs.find(job => job.linkedinId === linkedinId);

    if (!targetJob) {
      return res.status(404).json({ message: 'Job not found in LinkedIn search results' });
    }

    const result = await linkedinService.importLinkedInJob(targetJob, req.user.id);

    res.json(result);
  } catch (err) {
    console.error('LinkedIn import error:', err);
    res.status(500).json({ message: 'Failed to import LinkedIn job' });
  }
});

// Bulk import LinkedIn jobs
router.post('/linkedin/bulk-import', authenticate, authorizeRoles('admin'), async (req, res) => {
  try {
    const { keywords, location, limit, jobIds } = req.body;

    if (!keywords) {
      return res.status(400).json({ message: 'Keywords are required' });
    }

    // Search for jobs
    const linkedinJobs = await linkedinService.searchJobs(keywords, location, limit || 10);

    // Filter by specific job IDs if provided
    let jobsToImport = linkedinJobs;
    if (jobIds && jobIds.length > 0) {
      jobsToImport = linkedinJobs.filter(job => jobIds.includes(job.linkedinId));
    }

    const result = await linkedinService.bulkImportLinkedInJobs(jobsToImport, req.user.id);

    res.json({
      message: 'Bulk import completed',
      ...result
    });
  } catch (err) {
    console.error('LinkedIn bulk import error:', err);
    res.status(500).json({ message: 'Failed to bulk import LinkedIn jobs' });
  }
});

// Get LinkedIn import history
router.get('/linkedin/history', authenticate, authorizeRoles('admin'), async (req, res) => {
  try {
    const linkedinJobs = await Job.find({ source: 'linkedin' })
      .populate('employer', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      message: 'LinkedIn import history retrieved',
      jobs: linkedinJobs,
      count: linkedinJobs.length
    });
  } catch (err) {
    console.error('LinkedIn history error:', err);
    res.status(500).json({ message: 'Failed to get LinkedIn import history' });
  }
});

// Get LinkedIn job statistics
router.get('/linkedin/stats', authenticate, authorizeRoles('admin'), async (req, res) => {
  try {
    const totalLinkedInJobs = await Job.countDocuments({ source: 'linkedin' });
    const activeLinkedInJobs = await Job.countDocuments({ 
      source: 'linkedin', 
      status: 'Open' 
    });
    const linkedInApplications = await Application.countDocuments({
      job: { $in: await Job.find({ source: 'linkedin' }).select('_id') }
    });

    // Get top companies from LinkedIn jobs
    const linkedinJobs = await Job.find({ source: 'linkedin' });
    const companies = {};
    linkedinJobs.forEach(job => {
      if (job.company) {
        companies[job.company] = (companies[job.company] || 0) + 1;
      }
    });

    const topCompanies = Object.entries(companies)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([company, count]) => ({ company, count }));

    res.json({
      totalLinkedInJobs,
      activeLinkedInJobs,
      linkedInApplications,
      topCompanies
    });
  } catch (err) {
    console.error('LinkedIn stats error:', err);
    res.status(500).json({ message: 'Failed to get LinkedIn statistics' });
  }
});

// Post LinkedIn job to candidates
router.post('/linkedin/post-to-candidates', authenticate, authorizeRoles('admin'), async (req, res) => {
  try {
    const { jobId, targetSkills, targetLocations, message } = req.body;

    // Get the LinkedIn job
    const job = await Job.findById(jobId);
    if (!job || job.source !== 'linkedin') {
      return res.status(404).json({ message: 'LinkedIn job not found' });
    }

    // Find candidates based on criteria
    let candidateQuery = { role: 'candidate', status: 'active' };
    
    // Filter by skills if provided
    if (targetSkills && targetSkills.length > 0) {
      candidateQuery['profile.skills'] = { $in: targetSkills };
    }

    // Filter by location if provided (this would need location field in user profile)
    if (targetLocations && targetLocations.length > 0) {
      // For now, we'll skip location filtering as it's not in the user model
      // In a real implementation, you'd add location to user profile
    }

    const candidates = await User.find(candidateQuery);
    
    if (candidates.length === 0) {
      return res.json({ 
        message: 'No candidates found matching the criteria',
        candidatesNotified: 0
      });
    }

    // Create notifications for candidates
    const notifications = candidates.map(candidate => ({
      user: candidate._id,
      type: 'linkedin_job',
      title: `New LinkedIn Job: ${job.title}`,
      message: message || `A new job opportunity matching your profile has been posted: ${job.title} at ${job.company}`,
      jobId: job._id,
      read: false,
      createdAt: new Date()
    }));

    await Notification.insertMany(notifications);

    // Update job with posting info
    await Job.findByIdAndUpdate(jobId, {
      $set: {
        postedToCandidates: true,
        postedAt: new Date(),
        candidatesNotified: candidates.length
      }
    });

    res.json({
      message: `Job posted to ${candidates.length} candidates successfully`,
      candidatesNotified: candidates.length,
      job: {
        id: job._id,
        title: job.title,
        company: job.company,
        location: job.location
      }
    });
  } catch (err) {
    console.error('Post to candidates error:', err);
    res.status(500).json({ message: 'Failed to post job to candidates' });
  }
});

// Get candidates for job posting
router.get('/linkedin/candidates', authenticate, authorizeRoles('admin'), async (req, res) => {
  try {
    const { skills, location } = req.query;
    
    let candidateQuery = { role: 'candidate', status: 'active' };
    
    if (skills) {
      const skillArray = skills.split(',').map(s => s.trim());
      candidateQuery['profile.skills'] = { $in: skillArray };
    }

    const candidates = await User.find(candidateQuery)
      .select('name email profile.skills profile.experience')
      .limit(50);

    res.json({
      candidates: candidates,
      count: candidates.length
    });
  } catch (err) {
    console.error('Get candidates error:', err);
    res.status(500).json({ message: 'Failed to get candidates' });
  }
});

// Get posting history
router.get('/linkedin/posting-history', authenticate, authorizeRoles('admin'), async (req, res) => {
  try {
    const postedJobs = await Job.find({ 
      source: 'linkedin', 
      postedToCandidates: true 
    })
    .populate('employer', 'name email')
    .sort({ postedAt: -1 })
    .limit(20);

    res.json({
      postedJobs: postedJobs,
      count: postedJobs.length
    });
  } catch (err) {
    console.error('Get posting history error:', err);
    res.status(500).json({ message: 'Failed to get posting history' });
  }
});

module.exports = router; 