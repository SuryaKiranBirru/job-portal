import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAuthToken } from '../context/AuthContext';
import axios from 'axios';
import Navigation from '../components/Navigation';
import '../styles/Dashboard.css';
import '../styles/CandidateDashboard.css';

function CandidateDashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  
  // State for real data
  const [profile, setProfile] = useState(null);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [notifications, setNotifications] = useState([]);
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
        const [profileRes, recommendedRes, appliedRes, savedRes, notificationsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/users/profile', { headers }),
          axios.get('http://localhost:5000/api/users/recommended-jobs', { headers }),
          axios.get('http://localhost:5000/api/applications/my-applications', { headers }),
          axios.get('http://localhost:5000/api/users/saved-jobs', { headers }),
          axios.get('http://localhost:5000/api/users/notifications', { headers })
        ]);

        setProfile(profileRes.data);
        setRecommendedJobs(recommendedRes.data);
        setAppliedJobs(appliedRes.data);
        setSavedJobs(savedRes.data);
        setNotifications(notificationsRes.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard data');
        console.error('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleApplyJob = async (jobId) => {
    try {
      const token = getAuthToken();
      await axios.post('http://localhost:5000/api/applications/apply', {
        jobId,
        resumeUrl: profile?.profile?.resumeUrl || ''
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh applied jobs
      const appliedRes = await axios.get('http://localhost:5000/api/applications/my-applications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppliedJobs(appliedRes.data);
      
      alert('Application submitted successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to apply for job');
    }
  };

  const handleSaveJob = async (jobId) => {
    try {
      const token = getAuthToken();
      await axios.post(`http://localhost:5000/api/users/save-job/${jobId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh saved jobs
      const savedRes = await axios.get('http://localhost:5000/api/users/saved-jobs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedJobs(savedRes.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save job');
    }
  };

  const handleResumeUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Prompt for resume title
    const title = prompt('Enter a title for your resume:', `Resume ${new Date().toLocaleDateString()}`);
    if (!title) return;

    try {
      const token = getAuthToken();
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('title', title);

      await axios.post('http://localhost:5000/api/resume/upload-resume', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Refresh profile data
      const profileRes = await axios.get('http://localhost:5000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(profileRes.data);
      
      alert('Resume uploaded successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload resume');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Shortlisted': return '#28a745';
      case 'Under Review': return '#ffc107';
      case 'Rejected': return '#dc3545';
      case 'Applied': return '#17a2b8';
      default: return '#6c757d';
    }
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
        <h1>Welcome back, {profile?.name || user?.name || 'Candidate'}!</h1>
      </div>

      <div className="dashboard-grid">
        {/* Profile Section */}
        <section className="profile-section">
          <h3>Profile Overview</h3>
          <div className="profile-card">
            <div className="profile-avatar">
              <span>{(profile?.name || user?.name || 'U').charAt(0)}</span>
            </div>
            <div className="profile-info">
              <h4>{profile?.name || user?.name || 'User Name'}</h4>
              <p>{profile?.email || user?.email}</p>
              <div className="profile-completeness">
                <span>Profile Completeness: {profile?.profile?.skills?.length ? '85%' : '45%'}</span>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: profile?.profile?.skills?.length ? '85%' : '45%' }}></div>
                </div>
              </div>
            </div>
            <button 
              className="edit-profile-btn" 
              onClick={() => navigate('/profile')}
            >
              Edit Profile
            </button>
          </div>
        </section>

        {/* Resume Section */}
        <section className="resume-section">
          <h3>Resume Management</h3>
          <div className="resume-card">
            <div className="resume-status">
              {profile?.profile?.resumeUrl ? (
                <div className="resume-uploaded">
                  <span className="status-icon">✅</span>
                  <span>Resume uploaded</span>
                  <a 
                    href={profile.profile.resumeUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="view-resume-btn"
                  >
                    View Resume
                  </a>
                </div>
              ) : (
                <div className="resume-missing">
                  <span className="status-icon">⚠️</span>
                  <span>No resume uploaded</span>
                </div>
              )}
            </div>
            <div className="resume-actions">
              <button 
                className="create-resume-btn" 
                onClick={() => navigate('/create-resume')}
              >
                Create Resume with AI
              </button>
              <button 
                className="upload-resume-btn" 
                onClick={() => document.getElementById('resume-upload').click()}
              >
                Upload Resume
              </button>
              <button 
                className="view-all-resumes-btn" 
                onClick={() => navigate('/resumes')}
              >
                View All Resumes
              </button>
              <input
                id="resume-upload"
                type="file"
                accept=".pdf,.doc,.docx"
                style={{ display: 'none' }}
                onChange={handleResumeUpload}
              />
            </div>
          </div>
        </section>

        {/* Job Search Section */}
        <section className="job-search-section">
          <h3>Find Your Next Job</h3>
          <div className="search-filters">
            <input
              type="text"
              placeholder="Search jobs, skills, or companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="location-select"
            >
              <option value="">All Locations</option>
              <option value="remote">Remote</option>
              <option value="new-york">New York</option>
              <option value="san-francisco">San Francisco</option>
              <option value="seattle">Seattle</option>
            </select>
            <button className="search-btn">Search</button>
          </div>
        </section>

        {/* Recommended Jobs */}
        <section className="recommended-jobs-section">
          <h3>Recommended for You</h3>
          <div className="jobs-grid">
            {recommendedJobs.length > 0 ? (
              recommendedJobs.map(job => (
                <div key={job._id} className="job-card">
                  <div className="job-header">
                    <h4>{job.title}</h4>
                    <span className="match-badge">{job.match || 0}% Match</span>
                  </div>
                  <p className="company-name">{job.employer?.name || job.employer?.company?.name || 'Company'}</p>
                  <div className="job-details">
                    <span className="location">📍 {job.location || 'Remote'}</span>
                    <span className="salary">💰 {job.salary || 'Not specified'}</span>
                    <span className="type">{job.type}</span>
                  </div>
                  <div className="job-actions">
                    <button className="apply-btn" onClick={() => handleApplyJob(job._id)}>Apply Now</button>
                    <button className="save-btn" onClick={() => handleSaveJob(job._id)}>Save</button>
                  </div>
                </div>
              ))
            ) : (
              <p>No recommended jobs found. Update your profile skills to get better matches!</p>
            )}
          </div>
        </section>

        {/* Applied Jobs Timeline */}
        <section className="applied-jobs-section">
          <h3>Application Status</h3>
          <div className="timeline">
            {appliedJobs.length > 0 ? (
              appliedJobs.map(application => (
                <div key={application._id} className="timeline-item">
                  <div className="timeline-marker" style={{ backgroundColor: getStatusColor(application.status) }}></div>
                  <div className="timeline-content">
                    <h4>{application.job?.title}</h4>
                    <p className="company">{application.job?.employer?.name || application.job?.employer?.company?.name}</p>
                    <div className="status-info">
                      <span className="status" style={{ color: getStatusColor(application.status) }}>
                        {application.status}
                      </span>
                      <span className="date">Applied: {new Date(application.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p>No applications yet. Start applying to jobs!</p>
            )}
          </div>
        </section>

        {/* Saved Jobs */}
        <section className="saved-jobs-section">
          <h3>Saved Jobs</h3>
          <div className="saved-jobs-list">
            {savedJobs.length > 0 ? (
              savedJobs.map(job => (
                <div key={job._id} className="saved-job-item">
                  <div className="job-info">
                    <h4>{job.title}</h4>
                    <p>{job.employer?.name || job.employer?.company?.name}</p>
                    <span>{job.location || 'Remote'} • {job.salary || 'Not specified'}</span>
                  </div>
                  <div className="saved-job-actions">
                    <button className="apply-btn" onClick={() => handleApplyJob(job._id)}>Apply</button>
                    <button className="remove-btn" onClick={() => handleSaveJob(job._id)}>Remove</button>
                  </div>
                </div>
              ))
            ) : (
              <p>No saved jobs yet. Save jobs you're interested in!</p>
            )}
          </div>
        </section>

        {/* Notifications */}
        <section className="notifications-section">
          <h3>Notifications</h3>
          <div className="notifications-list">
            {notifications.length > 0 ? (
              notifications.map(notification => (
                <div key={notification._id} className="notification-item">
                  <p>{notification.message}</p>
                  <span className="notification-time">
                    {new Date(notification.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            ) : (
              <p>No notifications yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default CandidateDashboard; 