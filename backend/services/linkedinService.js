const axios = require('axios');
const Job = require('../models/Job');
const User = require('../models/User');

class LinkedInService {
  constructor() {
    this.baseURL = 'https://api.linkedin.com/v2';
    this.accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
    this.clientId = process.env.LINKEDIN_CLIENT_ID;
    this.clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  }

  // Get LinkedIn access token (you'll need to implement OAuth flow)
  async getAccessToken() {
    if (!this.accessToken) {
      throw new Error('LinkedIn access token not configured');
    }
    return this.accessToken;
  }

  // Search for jobs on LinkedIn
  async searchJobs(keywords, location, limit = 10) {
    try {
      const token = await this.getAccessToken();
      
      // LinkedIn Jobs API endpoint (this is a simplified version)
      // In production, you'd use LinkedIn's official Jobs API
      const response = await axios.get(`${this.baseURL}/jobSearch`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: {
          keywords: keywords,
          location: location,
          limit: limit
        }
      });

      return this.formatLinkedInJobs(response.data);
    } catch (error) {
      console.error('LinkedIn API Error:', error.message);
      // Fallback to mock data for development
      return this.getMockLinkedInJobs(keywords, location, limit);
    }
  }

  // Format LinkedIn job data to match our Job model
  formatLinkedInJobs(linkedinJobs) {
    return linkedinJobs.map(job => ({
      linkedinId: job.id,
      title: job.title,
      description: job.description,
      company: job.company.name,
      location: job.location,
      salary: job.salary || 'Not specified',
      type: this.mapJobType(job.employmentType),
      skills: this.extractSkills(job.description),
      requirements: job.requirements || [],
      benefits: job.benefits || [],
      applicationUrl: job.applicationUrl,
      postedDate: job.postedDate,
      source: 'linkedin'
    }));
  }

  // Map LinkedIn job types to our job types
  mapJobType(linkedinType) {
    const typeMap = {
      'FULL_TIME': 'Full-Time',
      'PART_TIME': 'Part-Time',
      'CONTRACT': 'Contract',
      'INTERNSHIP': 'Internship',
      'TEMPORARY': 'Contract'
    };
    return typeMap[linkedinType] || 'Full-Time';
  }

  // Extract skills from job description
  extractSkills(description) {
    const commonSkills = [
      'JavaScript', 'React', 'Node.js', 'Python', 'Java', 'C++', 'C#',
      'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin', 'TypeScript',
      'Angular', 'Vue.js', 'Express.js', 'Django', 'Flask', 'Spring',
      'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'AWS', 'Azure', 'GCP',
      'Docker', 'Kubernetes', 'Git', 'Jenkins', 'CI/CD', 'Agile',
      'Machine Learning', 'AI', 'Data Science', 'DevOps', 'UI/UX'
    ];

    const foundSkills = [];
    const lowerDescription = description.toLowerCase();

    commonSkills.forEach(skill => {
      if (lowerDescription.includes(skill.toLowerCase())) {
        foundSkills.push(skill);
      }
    });

    return foundSkills.slice(0, 10); // Limit to 10 skills
  }

  // Mock LinkedIn jobs for development/testing
  getMockLinkedInJobs(keywords, location, limit) {
    const mockJobs = [
      {
        linkedinId: 'linkedin_1',
        title: 'Senior Software Engineer',
        description: `We are looking for a Senior Software Engineer to join our team. 
        You will be responsible for developing and maintaining web applications using modern technologies.
        Requirements: ${keywords} experience, strong problem-solving skills, team collaboration.`,
        company: 'Tech Solutions Inc.',
        location: location || 'Remote',
        salary: '$120,000 - $150,000',
        type: 'Full-Time',
        skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
        requirements: ['5+ years experience', 'Bachelor\'s degree'],
        benefits: ['Health insurance', '401k', 'Remote work'],
        applicationUrl: 'https://linkedin.com/jobs/view/123',
        postedDate: new Date().toISOString(),
        source: 'linkedin'
      },
      {
        linkedinId: 'linkedin_2',
        title: 'Frontend Developer',
        description: `Join our dynamic team as a Frontend Developer. 
        You will work on creating beautiful and responsive user interfaces.
        Skills needed: ${keywords}, modern frameworks, responsive design.`,
        company: 'Digital Innovations',
        location: location || 'New York, NY',
        salary: '$80,000 - $100,000',
        type: 'Full-Time',
        skills: ['React', 'TypeScript', 'CSS', 'HTML'],
        requirements: ['3+ years experience', 'Portfolio required'],
        benefits: ['Flexible hours', 'Professional development'],
        applicationUrl: 'https://linkedin.com/jobs/view/124',
        postedDate: new Date().toISOString(),
        source: 'linkedin'
      },
      {
        linkedinId: 'linkedin_3',
        title: 'Data Scientist',
        description: `Exciting opportunity for a Data Scientist to work on cutting-edge projects.
        You will analyze data and build machine learning models.
        Expertise in ${keywords} and statistical analysis required.`,
        company: 'AI Analytics Corp',
        location: location || 'San Francisco, CA',
        salary: '$130,000 - $160,000',
        type: 'Full-Time',
        skills: ['Python', 'Machine Learning', 'SQL', 'Statistics'],
        requirements: ['PhD or MS in related field', 'Research experience'],
        benefits: ['Competitive salary', 'Stock options', 'Health benefits'],
        applicationUrl: 'https://linkedin.com/jobs/view/125',
        postedDate: new Date().toISOString(),
        source: 'linkedin'
      },
      {
        linkedinId: 'linkedin_4',
        title: 'DevOps Engineer',
        description: `We need a DevOps Engineer to help us scale our infrastructure.
        You will work on CI/CD pipelines and cloud infrastructure.
        Experience with ${keywords} and cloud platforms required.`,
        company: 'Cloud Solutions',
        location: location || 'Austin, TX',
        salary: '$110,000 - $140,000',
        type: 'Full-Time',
        skills: ['Docker', 'Kubernetes', 'AWS', 'Jenkins'],
        requirements: ['4+ years DevOps experience', 'Cloud certifications'],
        benefits: ['Remote work', 'Flexible schedule', 'Health insurance'],
        applicationUrl: 'https://linkedin.com/jobs/view/126',
        postedDate: new Date().toISOString(),
        source: 'linkedin'
      },
      {
        linkedinId: 'linkedin_5',
        title: 'Product Manager',
        description: `Join us as a Product Manager to drive product strategy and development.
        You will work with cross-functional teams to deliver amazing products.
        Background in ${keywords} and product development preferred.`,
        company: 'Innovation Labs',
        location: location || 'Seattle, WA',
        salary: '$140,000 - $180,000',
        type: 'Full-Time',
        skills: ['Product Strategy', 'Agile', 'User Research', 'Analytics'],
        requirements: ['5+ years PM experience', 'Technical background'],
        benefits: ['Competitive benefits', 'Career growth', 'Stock options'],
        applicationUrl: 'https://linkedin.com/jobs/view/127',
        postedDate: new Date().toISOString(),
        source: 'linkedin'
      }
    ];

    return mockJobs.slice(0, limit);
  }

  // Import LinkedIn job to our database
  async importLinkedInJob(linkedinJob, adminUserId) {
    try {
      // Check if job already exists
      const existingJob = await Job.findOne({ 
        linkedinId: linkedinJob.linkedinId,
        source: 'linkedin'
      });

      if (existingJob) {
        return { success: false, message: 'Job already imported', job: existingJob };
      }

      // Create new job
      const newJob = new Job({
        title: linkedinJob.title,
        description: linkedinJob.description,
        salary: linkedinJob.salary,
        skills: linkedinJob.skills,
        type: linkedinJob.type,
        location: linkedinJob.location,
        employer: adminUserId, // Admin becomes the employer
        status: 'Open',
        linkedinId: linkedinJob.linkedinId,
        source: 'linkedin',
        company: linkedinJob.company,
        requirements: linkedinJob.requirements,
        benefits: linkedinJob.benefits,
        applicationUrl: linkedinJob.applicationUrl,
        postedDate: linkedinJob.postedDate
      });

      await newJob.save();

      return { success: true, message: 'Job imported successfully', job: newJob };
    } catch (error) {
      console.error('Error importing LinkedIn job:', error);
      return { success: false, message: 'Failed to import job', error: error.message };
    }
  }

  // Bulk import LinkedIn jobs
  async bulkImportLinkedInJobs(linkedinJobs, adminUserId) {
    const results = [];
    
    for (const linkedinJob of linkedinJobs) {
      const result = await this.importLinkedInJob(linkedinJob, adminUserId);
      results.push(result);
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return {
      total: results.length,
      successful,
      failed,
      results
    };
  }
}

module.exports = new LinkedInService(); 