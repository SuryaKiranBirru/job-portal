import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAuthToken } from '../context/AuthContext';
import axios from 'axios';
import Navigation from '../components/Navigation';
import LinkedInIntegration from '../components/LinkedInIntegration';
import '../styles/Dashboard.css';
import '../styles/AdminDashboard.css';

function AdminDashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [showBroadcastForm, setShowBroadcastForm] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({
    message: '',
    targetUsers: ['all']
  });

  // State for real data
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [reports, setReports] = useState([]);
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
        const [summaryRes, usersRes, jobsRes, analyticsRes, reportsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/admin/summary', { headers }),
          axios.get('http://localhost:5000/api/admin/users', { headers }),
          axios.get('http://localhost:5000/api/admin/jobs', { headers }),
          axios.get('http://localhost:5000/api/admin/analytics', { headers }),
          axios.get('http://localhost:5000/api/admin/reports', { headers })
        ]);

        setSummary(summaryRes.data);
        setUsers(usersRes.data);
        setJobs(jobsRes.data);
        setAnalytics(analyticsRes.data);
        setReports(reportsRes.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard data');
        console.error('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleBroadcastFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      const updatedTargets = checked 
        ? [...broadcastForm.targetUsers, value]
        : broadcastForm.targetUsers.filter(target => target !== value);
      setBroadcastForm({
        ...broadcastForm,
        targetUsers: updatedTargets
      });
    } else {
      setBroadcastForm({
        ...broadcastForm,
        [name]: value
      });
    }
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    try {
      const token = getAuthToken();
      await axios.post('http://localhost:5000/api/admin/broadcast', broadcastForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setShowBroadcastForm(false);
      setBroadcastForm({
        message: '',
        targetUsers: ['all']
      });
      
      alert('Broadcast sent successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send broadcast');
    }
  };

  const handleBanUser = async (userId) => {
    try {
      const token = getAuthToken();
      await axios.put(`http://localhost:5000/api/admin/users/${userId}/ban`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh users
      const usersRes = await axios.get('http://localhost:5000/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(usersRes.data);
      
      alert('User banned successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to ban user');
    }
  };

  const handleUnbanUser = async (userId) => {
    try {
      const token = getAuthToken();
      await axios.put(`http://localhost:5000/api/admin/users/${userId}/unban`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh users
      const usersRes = await axios.get('http://localhost:5000/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(usersRes.data);
      
      alert('User unbanned successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to unban user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        const token = getAuthToken();
        await axios.delete(`http://localhost:5000/api/admin/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Refresh users
        const usersRes = await axios.get('http://localhost:5000/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsers(usersRes.data);
        
        alert('User deleted successfully!');
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  const handleApproveJob = async (jobId) => {
    try {
      const token = getAuthToken();
      await axios.put(`http://localhost:5000/api/admin/jobs/${jobId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh jobs
      const jobsRes = await axios.get('http://localhost:5000/api/admin/jobs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJobs(jobsRes.data);
      
      alert('Job approved successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve job');
    }
  };

  const handleRejectJob = async (jobId) => {
    try {
      const token = getAuthToken();
      await axios.put(`http://localhost:5000/api/admin/jobs/${jobId}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh jobs
      const jobsRes = await axios.get('http://localhost:5000/api/admin/jobs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJobs(jobsRes.data);
      
      alert('Job rejected successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject job');
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      try {
        const token = getAuthToken();
        await axios.delete(`http://localhost:5000/api/admin/jobs/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Refresh jobs
        const jobsRes = await axios.get('http://localhost:5000/api/admin/jobs', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setJobs(jobsRes.data);
        
        alert('Job deleted successfully!');
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete job');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#28a745';
      case 'banned': return '#dc3545';
      case 'Open': return '#28a745';
      case 'Pending': return '#ffc107';
      case 'Rejected': return '#dc3545';
      case 'Closed': return '#6c757d';
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
          <p>Loading admin dashboard...</p>
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
        <h1>Admin Dashboard</h1>
      </div>

      <div className="admin-tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''} 
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={activeTab === 'users' ? 'active' : ''} 
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
        <button 
          className={activeTab === 'jobs' ? 'active' : ''} 
          onClick={() => setActiveTab('jobs')}
        >
          Jobs
        </button>
        <button 
          className={activeTab === 'analytics' ? 'active' : ''} 
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
        <button 
          className={activeTab === 'reports' ? 'active' : ''} 
          onClick={() => setActiveTab('reports')}
        >
          Reports
        </button>
        <button 
          className={activeTab === 'profile' ? 'active' : ''} 
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button 
          className={activeTab === 'linkedin' ? 'active' : ''} 
          onClick={() => setActiveTab('linkedin')}
        >
          LinkedIn Integration
        </button>
      </div>

      <div className="dashboard-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className="summary-cards">
              <div className="summary-card">
                <h3>{summary?.totalUsers || 0}</h3>
                <p>Total Users</p>
              </div>
              <div className="summary-card">
                <h3>{summary?.totalJobs || 0}</h3>
                <p>Total Jobs</p>
              </div>
              <div className="summary-card">
                <h3>{summary?.totalApplications || 0}</h3>
                <p>Total Applications</p>
              </div>
              <div className="summary-card">
                <h3>{summary?.activeSessions || 0}</h3>
                <p>Active Sessions</p>
              </div>
            </div>

            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <button 
                onClick={() => setShowBroadcastForm(!showBroadcastForm)} 
                className="broadcast-btn"
              >
                Send Broadcast
              </button>
            </div>

            {showBroadcastForm && (
              <div className="broadcast-form">
                <form onSubmit={handleSendBroadcast}>
                  <textarea
                    name="message"
                    placeholder="Enter your broadcast message..."
                    value={broadcastForm.message}
                    onChange={handleBroadcastFormChange}
                    required
                  />
                  <div className="target-users">
                    <label>
                      <input
                        type="checkbox"
                        value="all"
                        checked={broadcastForm.targetUsers.includes('all')}
                        onChange={handleBroadcastFormChange}
                      />
                      All Users
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        value="candidates"
                        checked={broadcastForm.targetUsers.includes('candidates')}
                        onChange={handleBroadcastFormChange}
                      />
                      Candidates Only
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        value="employers"
                        checked={broadcastForm.targetUsers.includes('employers')}
                        onChange={handleBroadcastFormChange}
                      />
                      Employers Only
                    </label>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="send-btn">Send Broadcast</button>
                    <button type="button" onClick={() => setShowBroadcastForm(false)} className="cancel-btn">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="users-section">
            <h3>User Management</h3>
            <div className="users-table">
              <div className="table-header">
                <span>Name</span>
                <span>Email</span>
                <span>Role</span>
                <span>Status</span>
                <span>Joined</span>
                <span>Actions</span>
              </div>
              {users.length > 0 ? (
                users.map(user => (
                  <div key={user._id} className="table-row">
                    <span className="user-name">{user.name}</span>
                    <span className="user-email">{user.email}</span>
                    <span className="user-role">{user.role}</span>
                    <span className="user-status" style={{ color: getStatusColor(user.status) }}>
                      {user.status}
                    </span>
                    <span className="user-date">{new Date(user.createdAt).toLocaleDateString()}</span>
                    <div className="user-actions">
                      {user.status === 'active' ? (
                        <button 
                          className="ban-btn" 
                          onClick={() => handleBanUser(user._id)}
                        >
                          Ban
                        </button>
                      ) : (
                        <button 
                          className="unban-btn" 
                          onClick={() => handleUnbanUser(user._id)}
                        >
                          Unban
                        </button>
                      )}
                      <button 
                        className="delete-btn" 
                        onClick={() => handleDeleteUser(user._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p>No users found.</p>
              )}
            </div>
          </div>
        )}

        {/* Jobs Tab */}
        {activeTab === 'jobs' && (
          <div className="jobs-section">
            <h3>Job Moderation</h3>
            <div className="jobs-table">
              <div className="table-header">
                <span>Title</span>
                <span>Employer</span>
                <span>Status</span>
                <span>Posted</span>
                <span>Actions</span>
              </div>
              {jobs.length > 0 ? (
                jobs.map(job => (
                  <div key={job._id} className="table-row">
                    <span className="job-title">{job.title}</span>
                    <span className="job-employer">{job.employer?.name || job.employer?.email}</span>
                    <span className="job-status" style={{ color: getStatusColor(job.status) }}>
                      {job.status}
                    </span>
                    <span className="job-date">{new Date(job.createdAt).toLocaleDateString()}</span>
                    <div className="job-actions">
                      {job.status === 'Pending' && (
                        <>
                          <button 
                            className="approve-btn" 
                            onClick={() => handleApproveJob(job._id)}
                          >
                            Approve
                          </button>
                          <button 
                            className="reject-btn" 
                            onClick={() => handleRejectJob(job._id)}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button 
                        className="delete-btn" 
                        onClick={() => handleDeleteJob(job._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p>No jobs found.</p>
              )}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && analytics && (
          <div className="analytics-section">
            <h3>Analytics</h3>
            <div className="analytics-grid">
              <div className="analytics-card">
                <h4>{analytics.applicationRate}%</h4>
                <p>Application Success Rate</p>
              </div>
              <div className="analytics-card">
                <h4>Top Categories</h4>
                <ul>
                  {analytics.topCategories?.map((category, index) => (
                    <li key={index}>{category}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="growth-charts">
              <div className="chart">
                <h4>User Growth</h4>
                <div className="chart-bars">
                  {analytics.userGrowth?.map((value, index) => (
                    <div key={index} className="bar" style={{ height: `${value / 2}px` }}>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="chart">
                <h4>Job Growth</h4>
                <div className="chart-bars">
                  {analytics.jobGrowth?.map((value, index) => (
                    <div key={index} className="bar" style={{ height: `${value}px` }}>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="reports-section">
            <h3>Reports</h3>
            <div className="reports-list">
              {reports.length > 0 ? (
                reports.map(report => (
                  <div key={report.id} className="report-item">
                    <div className="report-header">
                      <h4>{report.type}</h4>
                      <span className="report-status" style={{ color: getStatusColor(report.status) }}>
                        {report.status}
                      </span>
                    </div>
                    <p><strong>Reporter:</strong> {report.reporter}</p>
                    <p><strong>Reported:</strong> {report.reported}</p>
                    <p><strong>Reason:</strong> {report.reason}</p>
                    <span className="report-date">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                    <div className="report-actions">
                      <button className="investigate-btn">Investigate</button>
                      <button className="resolve-btn">Resolve</button>
                    </div>
                  </div>
                ))
              ) : (
                <p>No reports found.</p>
              )}
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="profile-section">
            <div className="profile-header">
              <h3>Admin Profile</h3>
              <button 
                onClick={() => navigate('/profile')} 
                className="edit-profile-btn"
              >
                Edit Profile
              </button>
            </div>
            <div className="profile-info">
              <div className="profile-avatar">
                <span>{(user?.name || 'A').charAt(0)}</span>
              </div>
              <div className="profile-details">
                <h4>{user?.name || 'Admin User'}</h4>
                <p className="email">{user?.email}</p>
                <p className="role">Role: Administrator</p>
                <p className="member-since">Member since: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
            <div className="admin-stats">
              <h4>Administrative Statistics</h4>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-number">{summary?.totalUsers || 0}</span>
                  <span className="stat-label">Users Managed</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{summary?.totalJobs || 0}</span>
                  <span className="stat-label">Jobs Moderated</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{reports.length}</span>
                  <span className="stat-label">Reports Handled</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{summary?.activeSessions || 0}</span>
                  <span className="stat-label">Active Sessions</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LinkedIn Integration Tab */}
        {activeTab === 'linkedin' && (
          <div className="linkedin-section">
            <LinkedInIntegration />
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard; 