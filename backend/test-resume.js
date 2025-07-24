const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// Test resume data
const testResumeData = {
  id: 'test_resume_123',
  template: 'modern',
  content: `
    <div class="modern-resume">
      <header class="resume-header">
        <h1>John Doe</h1>
        <div class="contact-info">
          <p>john.doe@email.com • (555) 123-4567 • New York, NY</p>
          <p>LinkedIn: linkedin.com/in/johndoe</p>
        </div>
      </header>
      
      <section class="summary">
        <h2>Professional Summary</h2>
        <p>Experienced software developer with 5+ years in web development, specializing in React, Node.js, and MongoDB.</p>
      </section>
      
      <section class="skills">
        <h2>Skills</h2>
        <div class="skills-grid">
          <span class="skill-tag">JavaScript</span>
          <span class="skill-tag">React</span>
          <span class="skill-tag">Node.js</span>
          <span class="skill-tag">MongoDB</span>
          <span class="skill-tag">Express.js</span>
        </div>
      </section>
      
      <section class="experience">
        <h2>Professional Experience</h2>
        <div class="experience-item">
          <h3>Senior Software Developer</h3>
          <h4>Tech Company Inc.</h4>
          <p class="date">2020 - Present</p>
          <p>Led development of web applications using React and Node.js. Managed team of 5 developers.</p>
        </div>
      </section>
      
      <section class="education">
        <h2>Education</h2>
        <div class="education-item">
          <h3>Bachelor of Science in Computer Science</h3>
          <h4>University of Technology</h4>
          <p class="date">2016 - 2020</p>
          <p>GPA: 3.8/4.0</p>
        </div>
      </section>
    </div>
  `,
  generatedAt: new Date(),
  data: {
    fullName: 'John Doe',
    email: 'john.doe@email.com',
    phone: '(555) 123-4567',
    location: 'New York, NY',
    linkedin: 'linkedin.com/in/johndoe',
    summary: 'Experienced software developer with 5+ years in web development, specializing in React, Node.js, and MongoDB.',
    skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Express.js'],
    experience: [
      {
        company: 'Tech Company Inc.',
        position: 'Senior Software Developer',
        startDate: '2020-01',
        endDate: '',
        current: true,
        description: 'Led development of web applications using React and Node.js. Managed team of 5 developers.'
      }
    ],
    education: [
      {
        institution: 'University of Technology',
        degree: 'Bachelor of Science in Computer Science',
        field: 'Computer Science',
        startDate: '2016-09',
        endDate: '2020-05',
        gpa: '3.8'
      }
    ]
  }
};

async function testResumeFunctionality() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Test User model with resume data
    const testUser = new User({
      name: 'John Doe',
      email: 'john.doe@test.com',
      password: 'hashedpassword',
      role: 'candidate',
      profile: {
        skills: ['JavaScript', 'React', 'Node.js'],
        experience: '5+ years in web development',
        resumeData: testResumeData,
        resumeUrl: '/uploads/resumes/test-resume.pdf'
      }
    });

    // Save test user
    await testUser.save();
    console.log('✅ Test user created with resume data');

    // Test retrieving user with resume data
    const retrievedUser = await User.findOne({ email: 'john.doe@test.com' });
    console.log('✅ User retrieved successfully');
    console.log('📄 Resume Data:', {
      id: retrievedUser.profile.resumeData?.id,
      template: retrievedUser.profile.resumeData?.template,
      hasContent: !!retrievedUser.profile.resumeData?.content,
      resumeUrl: retrievedUser.profile.resumeUrl
    });

    // Clean up test data
    await User.deleteOne({ email: 'john.doe@test.com' });
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 Resume functionality test completed successfully!');
    console.log('\n📋 What was tested:');
    console.log('  ✅ MongoDB connection');
    console.log('  ✅ User model with resume data');
    console.log('  ✅ Resume data storage and retrieval');
    console.log('  ✅ Resume URL storage');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testResumeFunctionality(); 