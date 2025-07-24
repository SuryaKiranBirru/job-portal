const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');
const User = require('../models/User');
const Resume = require('../models/Resume');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/resumes';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
    }
  }
});

// Upload resume file
router.post('/upload-resume', authenticate, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const resumeUrl = `/uploads/resumes/${req.file.filename}`;
    const title = req.body.title || `Resume ${new Date().toLocaleDateString()}`;
    
    // Create new resume record
    const resume = new Resume({
      user: req.user.id,
      title: title,
      type: 'uploaded',
      fileUrl: resumeUrl,
      fileName: req.file.originalname,
      isActive: true
    });

    await resume.save();

    // Set other resumes as inactive
    await Resume.updateMany(
      { user: req.user.id, _id: { $ne: resume._id } },
      { isActive: false }
    );

    // Update user profile with active resume URL
    await User.findByIdAndUpdate(req.user.id, {
      'profile.resumeUrl': resumeUrl
    });

    res.json({ 
      message: 'Resume uploaded successfully',
      resume: resume
    });
  } catch (err) {
    console.error('Resume upload error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate resume with AI
router.post('/generate', authenticate, async (req, res) => {
  try {
    const { template, data, title } = req.body;
    
    if (!template || !data) {
      return res.status(400).json({ message: 'Template and data are required' });
    }

    // Validate required fields
    if (!data.fullName || !data.email || !data.summary) {
      return res.status(400).json({ message: 'Full name, email, and summary are required' });
    }

    // Generate resume content using AI (simulated for now)
    const resumeContent = generateResumeContent(template, data);
    
    // Create new resume record
    const resume = new Resume({
      user: req.user.id,
      title: title || `${data.fullName}'s Resume`,
      type: 'generated',
      template: template,
      content: resumeContent,
      data: data,
      isActive: true
    });

    await resume.save();

    // Set other resumes as inactive
    await Resume.updateMany(
      { user: req.user.id, _id: { $ne: resume._id } },
      { isActive: false }
    );

    // Update user profile with resume data
    await User.findByIdAndUpdate(req.user.id, {
      'profile.resumeData': {
        id: resume._id,
        template: template,
        content: resumeContent,
        generatedAt: new Date(),
        data: data
      }
    });

    res.json({
      message: 'Resume generated successfully',
      resume: resume
    });
  } catch (err) {
    console.error('Resume generation error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all resumes for a user
router.get('/my-resumes', authenticate, async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    res.json(resumes);
  } catch (err) {
    console.error('Get resumes error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific resume by ID
router.get('/:resumeId', authenticate, async (req, res) => {
  try {
    const resume = await Resume.findOne({ 
      _id: req.params.resumeId, 
      user: req.user.id 
    });

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    res.json(resume);
  } catch (err) {
    console.error('Get resume error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// View resume (returns HTML content for generated resumes or file for uploaded resumes)
router.get('/view/:resumeId', authenticate, async (req, res) => {
  try {
    const resume = await Resume.findOne({ 
      _id: req.params.resumeId, 
      user: req.user.id 
    });

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    if (resume.type === 'generated') {
      // Return HTML content for generated resumes
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${resume.title}</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              line-height: 1.6;
              margin: 0;
              padding: 20px;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
            }
            .resume-header {
              text-align: center;
              border-bottom: 2px solid #007bff;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .resume-header h1 {
              color: #007bff;
              margin: 0 0 10px 0;
              font-size: 28px;
            }
            .contact-info {
              color: #666;
              font-size: 14px;
            }
            .contact-info p {
              margin: 5px 0;
            }
            section {
              margin-bottom: 25px;
            }
            h2 {
              color: #007bff;
              border-bottom: 1px solid #e9ecef;
              padding-bottom: 5px;
              margin-bottom: 15px;
            }
            h3 {
              color: #333;
              margin: 0 0 5px 0;
              font-size: 16px;
            }
            h4 {
              color: #666;
              margin: 0 0 8px 0;
              font-size: 14px;
            }
            .date {
              color: #999;
              font-size: 12px;
              margin-bottom: 8px;
            }
            .skills-grid {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
            }
            .skill-tag {
              background: #e3f2fd;
              color: #1976d2;
              padding: 4px 8px;
              border-radius: 12px;
              font-size: 12px;
              border: 1px solid #bbdefb;
            }
            .experience-item, .education-item {
              margin-bottom: 15px;
            }
            .project-item {
              margin-bottom: 12px;
            }
            .actions {
              position: fixed;
              top: 20px;
              right: 20px;
              z-index: 1000;
            }
            .action-btn {
              background: #007bff;
              color: white;
              border: none;
              padding: 10px 15px;
              border-radius: 5px;
              cursor: pointer;
              margin-left: 10px;
              text-decoration: none;
              display: inline-block;
            }
            .action-btn:hover {
              background: #0056b3;
            }
          </style>
        </head>
        <body>
          <div class="actions">
            <a href="/api/resume/download/${resume._id}" class="action-btn">Download PDF</a>
            <button onclick="window.print()" class="action-btn">Print</button>
          </div>
          ${resume.content}
        </body>
        </html>
      `;
      
      res.setHeader('Content-Type', 'text/html');
      res.send(htmlContent);
    } else {
      // Redirect to file for uploaded resumes
      res.redirect(resume.fileUrl);
    }
  } catch (err) {
    console.error('View resume error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Download generated resume
router.get('/download/:resumeId', authenticate, async (req, res) => {
  try {
    const resume = await Resume.findOne({ 
      _id: req.params.resumeId, 
      user: req.user.id 
    });

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    if (resume.type === 'generated') {
      // Generate PDF content
      const pdfContent = await generatePDFContent(resume);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${resume.title.replace(/\s+/g, '_')}.pdf"`);
      res.send(pdfContent);
    } else {
      // Serve uploaded file
      const filePath = path.join(__dirname, '..', resume.fileUrl);
      if (fs.existsSync(filePath)) {
        res.download(filePath, resume.fileName || 'resume.pdf');
      } else {
        res.status(404).json({ message: 'File not found' });
      }
    }
  } catch (err) {
    console.error('Resume download error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Set resume as active
router.put('/set-active/:resumeId', authenticate, async (req, res) => {
  try {
    const resume = await Resume.findOne({ 
      _id: req.params.resumeId, 
      user: req.user.id 
    });

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // Set all resumes as inactive
    await Resume.updateMany(
      { user: req.user.id },
      { isActive: false }
    );

    // Set this resume as active
    resume.isActive = true;
    await resume.save();

    // Update user profile
    const updateData = {};
    if (resume.type === 'generated') {
      updateData['profile.resumeData'] = {
        id: resume._id,
        template: resume.template,
        content: resume.content,
        generatedAt: resume.createdAt,
        data: resume.data
      };
    } else {
      updateData['profile.resumeUrl'] = resume.fileUrl;
    }

    await User.findByIdAndUpdate(req.user.id, updateData);

    res.json({ 
      message: 'Resume set as active',
      resume: resume
    });
  } catch (err) {
    console.error('Set active resume error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete resume
router.delete('/:resumeId', authenticate, async (req, res) => {
  try {
    const resume = await Resume.findOne({ 
      _id: req.params.resumeId, 
      user: req.user.id 
    });

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // Delete file if it's an uploaded resume
    if (resume.type === 'uploaded' && resume.fileUrl) {
      const filePath = path.join(__dirname, '..', resume.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await Resume.findByIdAndDelete(req.params.resumeId);

    // If this was the active resume, set another one as active
    if (resume.isActive) {
      const nextResume = await Resume.findOne({ user: req.user.id }).sort({ createdAt: -1 });
      if (nextResume) {
        nextResume.isActive = true;
        await nextResume.save();

        // Update user profile
        const updateData = {};
        if (nextResume.type === 'generated') {
          updateData['profile.resumeData'] = {
            id: nextResume._id,
            template: nextResume.template,
            content: nextResume.content,
            generatedAt: nextResume.createdAt,
            data: nextResume.data
          };
        } else {
          updateData['profile.resumeUrl'] = nextResume.fileUrl;
        }

        await User.findByIdAndUpdate(req.user.id, updateData);
      } else {
        // No resumes left, clear user profile
        await User.findByIdAndUpdate(req.user.id, {
          $unset: { 'profile.resumeUrl': 1, 'profile.resumeData': 1 }
        });
      }
    }

    res.json({ message: 'Resume deleted successfully' });
  } catch (err) {
    console.error('Delete resume error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to generate resume content
function generateResumeContent(template, data) {
  let content = '';
  
  switch (template) {
    case 'modern':
      content = generateModernTemplate(data);
      break;
    case 'classic':
      content = generateClassicTemplate(data);
      break;
    case 'creative':
      content = generateCreativeTemplate(data);
      break;
    case 'minimal':
      content = generateMinimalTemplate(data);
      break;
    default:
      content = generateClassicTemplate(data);
  }
  
  return content;
}

function generateModernTemplate(data) {
  return `
    <div class="modern-resume">
      <header class="resume-header">
        <h1>${data.fullName}</h1>
        <div class="contact-info">
          <p>${data.email} • ${data.phone || 'Phone'} • ${data.location || 'Location'}</p>
          ${data.linkedin ? `<p>LinkedIn: ${data.linkedin}</p>` : ''}
          ${data.website ? `<p>Website: ${data.website}</p>` : ''}
        </div>
      </header>
      
      <section class="summary">
        <h2>Professional Summary</h2>
        <p>${data.summary}</p>
      </section>
      
      <section class="skills">
        <h2>Skills</h2>
        <div class="skills-grid">
          ${data.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
        </div>
      </section>
      
      <section class="experience">
        <h2>Professional Experience</h2>
        ${data.experience.map(exp => `
          <div class="experience-item">
            <h3>${exp.position}</h3>
            <h4>${exp.company}</h4>
            <p class="date">${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}</p>
            <p>${exp.description}</p>
          </div>
        `).join('')}
      </section>
      
      <section class="education">
        <h2>Education</h2>
        ${data.education.map(edu => `
          <div class="education-item">
            <h3>${edu.degree}${edu.field ? ` in ${edu.field}` : ''}</h3>
            <h4>${edu.institution}</h4>
            <p class="date">${edu.startDate} - ${edu.endDate}</p>
            ${edu.gpa ? `<p>GPA: ${edu.gpa}</p>` : ''}
          </div>
        `).join('')}
      </section>
      
      ${data.projects.length > 0 ? `
        <section class="projects">
          <h2>Projects</h2>
          ${data.projects.map(project => `
            <div class="project-item">
              <h3>${project.name}</h3>
              <p>${project.description}</p>
              ${project.technologies ? `<p><strong>Technologies:</strong> ${project.technologies}</p>` : ''}
              ${project.link ? `<p><strong>Link:</strong> ${project.link}</p>` : ''}
            </div>
          `).join('')}
        </section>
      ` : ''}
    </div>
  `;
}

function generateClassicTemplate(data) {
  return `
    <div class="classic-resume">
      <header class="resume-header">
        <h1>${data.fullName}</h1>
        <div class="contact-info">
          <p>${data.email} | ${data.phone || 'Phone'} | ${data.location || 'Location'}</p>
          ${data.linkedin ? `<p>LinkedIn: ${data.linkedin}</p>` : ''}
          ${data.website ? `<p>Website: ${data.website}</p>` : ''}
        </div>
      </header>
      
      <section class="summary">
        <h2>PROFESSIONAL SUMMARY</h2>
        <p>${data.summary}</p>
      </section>
      
      <section class="skills">
        <h2>SKILLS</h2>
        <p>${data.skills.join(', ')}</p>
      </section>
      
      <section class="experience">
        <h2>PROFESSIONAL EXPERIENCE</h2>
        ${data.experience.map(exp => `
          <div class="experience-item">
            <h3>${exp.position}</h3>
            <h4>${exp.company} | ${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}</h4>
            <p>${exp.description}</p>
          </div>
        `).join('')}
      </section>
      
      <section class="education">
        <h2>EDUCATION</h2>
        ${data.education.map(edu => `
          <div class="education-item">
            <h3>${edu.degree}${edu.field ? ` in ${edu.field}` : ''}</h3>
            <h4>${edu.institution} | ${edu.startDate} - ${edu.endDate}</h4>
            ${edu.gpa ? `<p>GPA: ${edu.gpa}</p>` : ''}
          </div>
        `).join('')}
      </section>
    </div>
  `;
}

function generateCreativeTemplate(data) {
  return `
    <div class="creative-resume">
      <header class="resume-header">
        <div class="header-content">
          <h1>${data.fullName}</h1>
          <div class="contact-info">
            <p>📧 ${data.email}</p>
            <p>📱 ${data.phone || 'Phone'}</p>
            <p>📍 ${data.location || 'Location'}</p>
            ${data.linkedin ? `<p>🔗 ${data.linkedin}</p>` : ''}
            ${data.website ? `<p>🌐 ${data.website}</p>` : ''}
          </div>
        </div>
      </header>
      
      <section class="summary">
        <h2>✨ About Me</h2>
        <p>${data.summary}</p>
      </section>
      
      <section class="skills">
        <h2>🛠️ Skills & Expertise</h2>
        <div class="skills-grid">
          ${data.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
        </div>
      </section>
      
      <section class="experience">
        <h2>💼 Work Experience</h2>
        ${data.experience.map(exp => `
          <div class="experience-item">
            <h3>${exp.position}</h3>
            <h4>🏢 ${exp.company}</h4>
            <p class="date">📅 ${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}</p>
            <p>${exp.description}</p>
          </div>
        `).join('')}
      </section>
      
      <section class="education">
        <h2>🎓 Education</h2>
        ${data.education.map(edu => `
          <div class="education-item">
            <h3>${edu.degree}${edu.field ? ` in ${edu.field}` : ''}</h3>
            <h4>🏫 ${edu.institution}</h4>
            <p class="date">📅 ${edu.startDate} - ${edu.endDate}</p>
            ${edu.gpa ? `<p>📊 GPA: ${edu.gpa}</p>` : ''}
          </div>
        `).join('')}
      </section>
    </div>
  `;
}

function generateMinimalTemplate(data) {
  return `
    <div class="minimal-resume">
      <header class="resume-header">
        <h1>${data.fullName}</h1>
        <div class="contact-info">
          <p>${data.email}</p>
          <p>${data.phone || 'Phone'}</p>
          <p>${data.location || 'Location'}</p>
          ${data.linkedin ? `<p>${data.linkedin}</p>` : ''}
          ${data.website ? `<p>${data.website}</p>` : ''}
        </div>
      </header>
      
      <section class="summary">
        <h2>Summary</h2>
        <p>${data.summary}</p>
      </section>
      
      <section class="skills">
        <h2>Skills</h2>
        <p>${data.skills.join(' • ')}</p>
      </section>
      
      <section class="experience">
        <h2>Experience</h2>
        ${data.experience.map(exp => `
          <div class="experience-item">
            <h3>${exp.position}</h3>
            <p>${exp.company}</p>
            <p>${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}</p>
            <p>${exp.description}</p>
          </div>
        `).join('')}
      </section>
      
      <section class="education">
        <h2>Education</h2>
        ${data.education.map(edu => `
          <div class="education-item">
            <h3>${edu.degree}${edu.field ? ` in ${edu.field}` : ''}</h3>
            <p>${edu.institution}</p>
            <p>${edu.startDate} - ${edu.endDate}</p>
            ${edu.gpa ? `<p>GPA: ${edu.gpa}</p>` : ''}
          </div>
        `).join('')}
      </section>
    </div>
  `;
}

// Helper function to generate PDF content using puppeteer
async function generatePDFContent(resume) {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Create HTML content with CSS styling
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${resume.title} - Resume</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            color: #333;
          }
          .resume-header {
            text-align: center;
            border-bottom: 2px solid #007bff;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .resume-header h1 {
            color: #007bff;
            margin: 0 0 10px 0;
            font-size: 28px;
          }
          .contact-info {
            color: #666;
            font-size: 14px;
          }
          .contact-info p {
            margin: 5px 0;
          }
          section {
            margin-bottom: 25px;
          }
          h2 {
            color: #007bff;
            border-bottom: 1px solid #e9ecef;
            padding-bottom: 5px;
            margin-bottom: 15px;
          }
          h3 {
            color: #333;
            margin: 0 0 5px 0;
            font-size: 16px;
          }
          h4 {
            color: #666;
            margin: 0 0 8px 0;
            font-size: 14px;
          }
          .date {
            color: #999;
            font-size: 12px;
            margin-bottom: 8px;
          }
          .skills-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }
          .skill-tag {
            background: #e3f2fd;
            color: #1976d2;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            border: 1px solid #bbdefb;
          }
          .experience-item, .education-item {
            margin-bottom: 15px;
          }
          .project-item {
            margin-bottom: 12px;
          }
        </style>
      </head>
      <body>
        ${resume.content}
      </body>
      </html>
    `;
    
    await page.setContent(htmlContent);
    
    // Generate PDF
    const pdf = await page.pdf({
      format: 'A4',
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      },
      printBackground: true
    });
    
    return pdf;
  } finally {
    await browser.close();
  }
}

module.exports = router; 