import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAuthToken } from '../context/AuthContext';
import axios from 'axios';
import Navigation from '../components/Navigation';
import '../styles/Dashboard.css';
import '../styles/EmployerDashboard.css';

function EmployerDashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [showJobForm, setShowJobForm] = useState(false);
  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    salary: '',
    location: '',
    type: 'Full-Time',
    skills: ''
  });

  // State for real data
  const [profile, setProfile] = useState(null);
  const [postedJobs, setPostedJobs] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Fetch all data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = getAuthToken();
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch all data in parallel
        const [profileRes, jobsRes, applicantsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/users/profile', { headers }),
          axios.get('http://localhost:5000/api/jobs/employer/my-jobs', { headers }),
          axios.get('http://localhost:5000/api/applications/employer-applications', { headers })
        ]);

        setProfile(profileRes.data);
        setPostedJobs(jobsRes.data);
        setApplicants(applicantsRes.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard data');
        console.error('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleJobFormChange = (e) => {
    setJobForm({
      ...jobForm,
      [e.target.name]: e.target.value
    });
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    try {
      const token = getAuthToken();
      await axios.post('http://localhost:5000/api/jobs', jobForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh posted jobs
      const jobsRes = await axios.get('http://localhost:5000/api/jobs/employer/my-jobs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPostedJobs(jobsRes.data);
      
      setShowJobForm(false);
      setJobForm({
        title: '',
        description: '',
        salary: '',
        location: '',
        type: 'Full-Time',
        skills: ''
      });
      
      alert('Job posted successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post job');
    }
  };

  const handleUpdateApplicationStatus = async (applicationId, status) => {
    try {
      const token = getAuthToken();
      await axios.put(`http://localhost:5000/api/applications/${applicationId}/status`, {
        status
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh applicants
      const applicantsRes = await axios.get('http://localhost:5000/api/applications/employer-applications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApplicants(applicantsRes.data);
      
      alert(`Application ${status.toLowerCase()} successfully!`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update application status');
    }
  };

  const handleUpdateJobStatus = async (jobId, status) => {
    try {
      const token = getAuthToken();
      await axios.put(`http://localhost:5000/api/jobs/${jobId}`, {
        status
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh posted jobs
      const jobsRes = await axios.get('http://localhost:5000/api/jobs/employer/my-jobs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPostedJobs(jobsRes.data);
      
      alert(`Job ${status.toLowerCase()} successfully!`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update job status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return '#28a745';
      case 'Closed': return '#dc3545';
      case 'New': return '#007bff';
      case 'Reviewed': return '#ffc107';
      case 'Shortlisted': return '#28a745';
      case 'Rejected': return '#dc3545';
      default: return '#6c757d';
    }
  };

  // Calculate analytics
  const analytics = {
    totalJobs: postedJobs.length,
    activeJobs: postedJobs.filter(job => job.status === 'Open').length,
    totalApplicants: applicants.length,
    thisWeek: applicants.filter(app => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(app.createdAt) > weekAgo;
    }).length,
    avgResponseTime: '2.3 days' // Mock for now
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Loading...</h1>
        </div>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Error</h1>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
        <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Navigation />
      <div className="dashboard-header">
        <h1>Welcome back, {profile?.name || user?.name || 'Employer'}!</h1>
      </div>

      <div className="dashboard-grid">
        {/* Company Info Section */}
        <section className="company-info-section">
          <h3>Company Profile</h3>
          <div className="company-card">
            <div className="company-avatar">
              <span>{(profile?.name || user?.name || 'C').charAt(0)}</span>
            </div>
            <div className="company-details">
              <h4>{profile?.company?.name || profile?.name || 'Your Company'}</h4>
              <p>{profile?.company?.industry || 'Technology'} • 50-200 employees</p>
              <p>📍 {profile?.company?.location || 'San Francisco, CA'}</p>
              <p>🌐 {profile?.company?.website || 'www.yourcompany.com'}</p>
            </div>
            <button 
              className="edit-company-btn" 
              onClick={() => navigate('/profile')}
            >
              Edit Company
            </button>
          </div>
        </section>

        {/* Analytics Section */}
        <section className="analytics-section">
          <h3>Overview</h3>
          <div className="analytics-grid">
            <div className="analytics-card">
              <h4>{analytics.totalJobs}</h4>
              <p>Total Jobs</p>
            </div>
            <div className="analytics-card">
              <h4>{analytics.activeJobs}</h4>
              <p>Active Jobs</p>
            </div>
            <div className="analytics-card">
              <h4>{analytics.totalApplicants}</h4>
              <p>Total Applicants</p>
            </div>
            <div className="analytics-card">
              <h4>{analytics.thisWeek}</h4>
              <p>This Week</p>
            </div>
          </div>
          <div className="response-time">
            <span>Avg Response Time: {analytics.avgResponseTime}</span>
          </div>
        </section>

        {/* Job Posting Section */}
        <section className="job-posting-section">
          <div className="section-header">
            <h3>Job Management</h3>
            <button 
              onClick={() => setShowJobForm(!showJobForm)} 
              className="post-job-btn"
            >
              {showJobForm ? 'Cancel' : 'Post New Job'}
            </button>
          </div>

          {showJobForm && (
            <div className="job-form">
              <form onSubmit={handlePostJob}>
                <div className="form-row">
                  <input
                    type="text"
                    name="title"
                    placeholder="Job Title"
                    value={jobForm.title}
                    onChange={handleJobFormChange}
                    required
                  />
                  <input
                    type="text"
                    name="salary"
                    placeholder="Salary Range"
                    value={jobForm.salary}
                    onChange={handleJobFormChange}
                    required
                  />
                </div>
                <div className="form-row">
                  <input
                    type="text"
                    name="location"
                    placeholder="Location"
                    value={jobForm.location}
                    onChange={handleJobFormChange}
                    required
                  />
                  <select
                    name="type"
                    value={jobForm.type}
                    onChange={handleJobFormChange}
                  >
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
                <textarea
                  name="description"
                  placeholder="Job Description"
                  value={jobForm.description}
                  onChange={handleJobFormChange}
                  required
                />
                <input
                  type="text"
                  name="skills"
                  placeholder="Required Skills (comma separated)"
                  value={jobForm.skills}
                  onChange={handleJobFormChange}
                />
                <div className="form-actions">
                  <button type="submit" className="submit-btn">Post Job</button>
                  <button type="button" onClick={() => setShowJobForm(false)} className="cancel-btn">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>

        {/* Posted Jobs Section */}
        <section className="posted-jobs-section">
          <h3>Posted Jobs</h3>
          <div className="jobs-table">
            <div className="table-header">
              <span>Job Title</span>
              <span>Status</span>
              <span>Applicants</span>
              <span>Posted Date</span>
              <span>Actions</span>
            </div>
            {postedJobs.length > 0 ? (
              postedJobs.map(job => (
                <div key={job._id} className="table-row">
                  <span className="job-title">{job.title}</span>
                  <span className="status" style={{ color: getStatusColor(job.status) }}>
                    {job.status}
                  </span>
                  <span className="applicants">{job.applicants?.length || 0} applicants</span>
                  <span className="date">{new Date(job.createdAt).toLocaleDateString()}</span>
                  <div className="actions">
                    <button className="view-btn">View</button>
                    <button className="edit-btn">Edit</button>
                    <button 
                      className="close-btn" 
                      onClick={() => handleUpdateJobStatus(job._id, job.status === 'Open' ? 'Closed' : 'Open')}
                    >
                      {job.status === 'Open' ? 'Close' : 'Open'}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p>No jobs posted yet. Post your first job!</p>
            )}
          </div>
        </section>

        {/* Recent Applicants Section */}
        <section className="applicants-section">
          <h3>Recent Applicants</h3>
          <div className="applicants-list">
            {applicants.length > 0 ? (
              applicants.slice(0, 5).map(applicant => (
                <div key={applicant._id} className="applicant-card">
                  <div className="applicant-info">
                    <div className="applicant-avatar">
                      <span>{applicant.candidate?.name?.charAt(0) || 'A'}</span>
                    </div>
                    <div className="applicant-details">
                      <h4>{applicant.candidate?.name}</h4>
                      <p>{applicant.job?.title}</p>
                      <span className="match-score">{applicant.matchPercent || 0}% Match</span>
                    </div>
                  </div>
                  <div className="applicant-status">
                    <span className="status" style={{ color: getStatusColor(applicant.status) }}>
                      {applicant.status}
                    </span>
                    <span className="date">{new Date(applicant.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="applicant-actions">
                    <button className="view-profile-btn">View Profile</button>
                    <button 
                      className="shortlist-btn" 
                      onClick={() => handleUpdateApplicationStatus(applicant._id, 'Shortlisted')}
                    >
                      Shortlist
                    </button>
                    <button 
                      className="reject-btn"
                      onClick={() => handleUpdateApplicationStatus(applicant._id, 'Rejected')}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p>No applicants yet. Your jobs will appear here when candidates apply!</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default EmployerDashboard; 