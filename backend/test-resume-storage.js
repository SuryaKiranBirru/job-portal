const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Resume = require('./models/Resume');
const User = require('./models/User');

// Load environment variables
dotenv.config();

// Test resume data
const testResumeData = {
  fullName: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+1-555-0123',
  location: 'New York, NY',
  summary: 'Experienced software developer with 5+ years in web development',
  skills: ['JavaScript', 'React', 'Node.js', 'Python', 'MongoDB'],
  experience: [
    {
      company: 'Tech Corp',
      position: 'Senior Developer',
      startDate: '2020-01',
      endDate: '2023-12',
      current: false,
      description: 'Led development of multiple web applications'
    }
  ],
  education: [
    {
      institution: 'University of Technology',
      degree: 'Bachelor of Science',
      field: 'Computer Science',
      startDate: '2016-09',
      endDate: '2020-05',
      gpa: '3.8'
    }
  ]
};

async function testResumeStorage() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Create test user
    const testUser = new User({
      name: 'John Doe',
      email: 'john.doe@test.com',
      password: 'hashedpassword',
      role: 'candidate'
    });

    await testUser.save();
    console.log('✅ Test user created');

    // Test generated resume
    const generatedResume = new Resume({
      user: testUser._id,
      title: 'John Doe - Software Developer',
      type: 'generated',
      template: 'modern',
      content: '<div>Generated resume content</div>',
      data: testResumeData,
      isActive: true
    });

    await generatedResume.save();
    console.log('✅ Generated resume created');

    // Test uploaded resume
    const uploadedResume = new Resume({
      user: testUser._id,
      title: 'John Doe - Professional Resume',
      type: 'uploaded',
      fileUrl: '/uploads/resumes/test-file.pdf',
      fileName: 'john_doe_resume.pdf',
      isActive: false
    });

    await uploadedResume.save();
    console.log('✅ Uploaded resume created');

    // Test retrieving resumes
    const userResumes = await Resume.find({ user: testUser._id }).sort({ createdAt: -1 });
    console.log('✅ Resumes retrieved:', userResumes.length);

    // Test active resume
    const activeResume = await Resume.findOne({ user: testUser._id, isActive: true });
    console.log('✅ Active resume found:', activeResume.title);

    // Test resume by type
    const generatedResumes = await Resume.find({ user: testUser._id, type: 'generated' });
    const uploadedResumes = await Resume.find({ user: testUser._id, type: 'uploaded' });
    console.log('✅ Generated resumes:', generatedResumes.length);
    console.log('✅ Uploaded resumes:', uploadedResumes.length);

    // Clean up test data
    await Resume.deleteMany({ user: testUser._id });
    await User.deleteOne({ _id: testUser._id });
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 Resume storage functionality test completed successfully!');
    console.log('\n📋 What was tested:');
    console.log('  ✅ Resume model creation');
    console.log('  ✅ Generated resume storage');
    console.log('  ✅ Uploaded resume storage');
    console.log('  ✅ Resume retrieval by user');
    console.log('  ✅ Active resume identification');
    console.log('  ✅ Resume filtering by type');
    console.log('  ✅ Data cleanup');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testResumeStorage(); 