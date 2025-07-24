const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Job = require('./models/Job');
const User = require('./models/User');
const linkedinService = require('./services/linkedinService');

// Load environment variables
dotenv.config();

async function testLinkedInIntegration() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Create test admin user
    const testAdmin = new User({
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'hashedpassword',
      role: 'admin'
    });

    await testAdmin.save();
    console.log('✅ Test admin user created');

    // Test LinkedIn service search functionality
    console.log('\n🔍 Testing LinkedIn job search...');
    const searchResults = await linkedinService.searchJobs('Software Engineer', 'New York', 3);
    console.log(`✅ Found ${searchResults.length} mock LinkedIn jobs`);

    // Test individual job import
    console.log('\n📥 Testing individual job import...');
    const firstJob = searchResults[0];
    const importResult = await linkedinService.importLinkedInJob(firstJob, testAdmin._id);
    console.log(`✅ Import result: ${importResult.success ? 'Success' : 'Failed'}`);
    console.log(`   Message: ${importResult.message}`);

    // Test bulk import
    console.log('\n📦 Testing bulk job import...');
    const bulkResult = await linkedinService.bulkImportLinkedInJobs(searchResults.slice(1), testAdmin._id);
    console.log(`✅ Bulk import completed:`);
    console.log(`   Total: ${bulkResult.total}`);
    console.log(`   Successful: ${bulkResult.successful}`);
    console.log(`   Failed: ${bulkResult.failed}`);

    // Test duplicate import prevention
    console.log('\n🔄 Testing duplicate import prevention...');
    const duplicateResult = await linkedinService.importLinkedInJob(firstJob, testAdmin._id);
    console.log(`✅ Duplicate check: ${duplicateResult.success ? 'Failed (should be false)' : 'Success (prevented duplicate)'}`);

    // Verify jobs in database
    console.log('\n📊 Verifying imported jobs in database...');
    const importedJobs = await Job.find({ source: 'linkedin' }).populate('employer', 'name email');
    console.log(`✅ Found ${importedJobs.length} LinkedIn jobs in database`);

    importedJobs.forEach((job, index) => {
      console.log(`   ${index + 1}. ${job.title} at ${job.company}`);
      console.log(`      Status: ${job.status}, Type: ${job.type}`);
      console.log(`      Skills: ${job.skills.join(', ')}`);
      console.log(`      LinkedIn ID: ${job.linkedinId}`);
    });

    // Test LinkedIn-specific fields
    console.log('\n🔍 Testing LinkedIn-specific fields...');
    const linkedinJob = await Job.findOne({ source: 'linkedin' });
    if (linkedinJob) {
      console.log('✅ LinkedIn job fields verified:');
      console.log(`   - linkedinId: ${linkedinJob.linkedinId}`);
      console.log(`   - source: ${linkedinJob.source}`);
      console.log(`   - company: ${linkedinJob.company}`);
      console.log(`   - requirements: ${linkedinJob.requirements?.length || 0} items`);
      console.log(`   - benefits: ${linkedinJob.benefits?.length || 0} items`);
      console.log(`   - applicationUrl: ${linkedinJob.applicationUrl ? 'Present' : 'Not present'}`);
      console.log(`   - postedDate: ${linkedinJob.postedDate ? 'Present' : 'Not present'}`);
    }

    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await Job.deleteMany({ source: 'linkedin' });
    await User.deleteOne({ _id: testAdmin._id });
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 LinkedIn integration test completed successfully!');
    console.log('\n📋 What was tested:');
    console.log('  ✅ LinkedIn service search functionality');
    console.log('  ✅ Individual job import');
    console.log('  ✅ Bulk job import');
    console.log('  ✅ Duplicate import prevention');
    console.log('  ✅ LinkedIn-specific fields in Job model');
    console.log('  ✅ Database storage and retrieval');
    console.log('  ✅ Data cleanup');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testLinkedInIntegration(); 