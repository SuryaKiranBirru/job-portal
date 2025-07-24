import React, { useState, useEffect } from 'react';
import { getAuthToken } from '../context/AuthContext';
import axios from 'axios';
import '../styles/LinkedInIntegration.css';

function LinkedInIntegration() {
  const [searchParams, setSearchParams] = useState({
    keywords: '',
    location: '',
    limit: 10
  });
  const [linkedinJobs, setLinkedinJobs] = useState([]);
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState('');
  const [importHistory, setImportHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('search');
  const [postingHistory, setPostingHistory] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [showPostingModal, setShowPostingModal] = useState(false);
  const [selectedJobForPosting, setSelectedJobForPosting] = useState(null);
  const [postingForm, setPostingForm] = useState({
    targetSkills: [],
    targetLocations: [],
    message: ''
  });

  useEffect(() => {
    fetchImportHistory();
    fetchStats();
    fetchPostingHistory();
  }, []);

  const fetchImportHistory = async () => {
    try {
      const token = getAuthToken();
      const response = await axios.get('http://localhost:5000/api/admin/linkedin/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setImportHistory(response.data.jobs);
    } catch (err) {
      console.error('Failed to fetch import history:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const token = getAuthToken();
      const response = await axios.get('http://localhost:5000/api/admin/linkedin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchPostingHistory = async () => {
    try {
      const token = getAuthToken();
      const response = await axios.get('http://localhost:5000/api/admin/linkedin/posting-history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPostingHistory(response.data.postedJobs);
    } catch (err) {
      console.error('Failed to fetch posting history:', err);
    }
  };

  const fetchCandidates = async (skills) => {
    try {
      const token = getAuthToken();
      const response = await axios.get('http://localhost:5000/api/admin/linkedin/candidates', {
        headers: { Authorization: `Bearer ${token}` },
        params: { skills: skills.join(',') }
      });
      setCandidates(response.data.candidates);
    } catch (err) {
      console.error('Failed to fetch candidates:', err);
    }
  };

  const handlePostToCandidates = (job) => {
    setSelectedJobForPosting(job);
    setPostingForm({
      targetSkills: job.skills || [],
      targetLocations: [],
      message: `A new job opportunity matching your profile has been posted: ${job.title} at ${job.company}`
    });
    setShowPostingModal(true);
    fetchCandidates(job.skills || []);
  };

  const handlePostingSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = getAuthToken();
      const response = await axios.post('http://localhost:5000/api/admin/linkedin/post-to-candidates', {
        jobId: selectedJobForPosting._id,
        targetSkills: postingForm.targetSkills,
        targetLocations: postingForm.targetLocations,
        message: postingForm.message
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage(`✅ ${response.data.message}`);
      setShowPostingModal(false);
      setSelectedJobForPosting(null);
      
      // Refresh data
      fetchImportHistory();
      fetchPostingHistory();
      fetchStats();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to post job to candidates');
    }
  };

  const handlePostingFormChange = (e) => {
    const { name, value } = e.target;
    setPostingForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSkillToggle = (skill) => {
    setPostingForm(prev => ({
      ...prev,
      targetSkills: prev.targetSkills.includes(skill)
        ? prev.targetSkills.filter(s => s !== skill)
        : [...prev.targetSkills, skill]
    }));
  };

  const handleSearch = async () => {
    if (!searchParams.keywords.trim()) {
      setMessage('Please enter keywords to search');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const token = getAuthToken();
      const response = await axios.get('http://localhost:5000/api/admin/linkedin/search', {
        headers: { Authorization: `Bearer ${token}` },
        params: searchParams
      });

      setLinkedinJobs(response.data.jobs);
      setSelectedJobs([]);
      setMessage(`Found ${response.data.count} jobs from LinkedIn`);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to search LinkedIn jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleJobSelect = (linkedinId) => {
    setSelectedJobs(prev => 
      prev.includes(linkedinId) 
        ? prev.filter(id => id !== linkedinId)
        : [...prev, linkedinId]
    );
  };

  const handleSelectAll = () => {
    if (selectedJobs.length === linkedinJobs.length) {
      setSelectedJobs([]);
    } else {
      setSelectedJobs(linkedinJobs.map(job => job.linkedinId));
    }
  };

  const handleBulkImport = async () => {
    if (selectedJobs.length === 0) {
      setMessage('Please select jobs to import');
      return;
    }

    setImporting(true);
    setMessage('');

    try {
      const token = getAuthToken();
      const response = await axios.post('http://localhost:5000/api/admin/linkedin/bulk-import', {
        keywords: searchParams.keywords,
        location: searchParams.location,
        jobIds: selectedJobs
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage(`Import completed: ${response.data.successful} successful, ${response.data.failed} failed`);
      setSelectedJobs([]);
      
      // Refresh history and stats
      fetchImportHistory();
      fetchStats();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to import jobs');
    } finally {
      setImporting(false);
    }
  };

  const handleSingleImport = async (linkedinId) => {
    try {
      const token = getAuthToken();
      const response = await axios.post(`http://localhost:5000/api/admin/linkedin/import/${linkedinId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          keywords: searchParams.keywords,
          location: searchParams.location
        }
      });

      if (response.data.success) {
        setMessage('Job imported successfully!');
        fetchImportHistory();
        fetchStats();
      } else {
        setMessage(response.data.message);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to import job');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="linkedin-integration">
      <div className="linkedin-header">
        <h2>LinkedIn Job Integration</h2>
        <p>Search and import job postings from LinkedIn to your portal</p>
      </div>

      <div className="linkedin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          🔍 Search & Import
        </button>
        <button 
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📋 Import History
        </button>
        <button 
          className={`tab-btn ${activeTab === 'posting' ? 'active' : ''}`}
          onClick={() => setActiveTab('posting')}
        >
          📤 Post to Candidates
        </button>
        <button 
          className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📊 Statistics
        </button>
      </div>

      {message && (
        <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {activeTab === 'search' && (
        <div className="search-section">
          <div className="search-form">
            <div className="form-group">
              <label>Keywords *</label>
              <input
                type="text"
                value={searchParams.keywords}
                onChange={(e) => setSearchParams(prev => ({ ...prev, keywords: e.target.value }))}
                placeholder="e.g., Software Engineer, React Developer"
              />
            </div>
            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                value={searchParams.location}
                onChange={(e) => setSearchParams(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., New York, Remote"
              />
            </div>
            <div className="form-group">
              <label>Limit</label>
              <select
                value={searchParams.limit}
                onChange={(e) => setSearchParams(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
              >
                <option value={5}>5 jobs</option>
                <option value={10}>10 jobs</option>
                <option value={20}>20 jobs</option>
                <option value={50}>50 jobs</option>
              </select>
            </div>
            <button 
              className="search-btn"
              onClick={handleSearch}
              disabled={loading}
            >
              {loading ? 'Searching...' : '🔍 Search LinkedIn'}
            </button>
          </div>

          {linkedinJobs.length > 0 && (
            <div className="search-results">
              <div className="results-header">
                <h3>Search Results ({linkedinJobs.length} jobs)</h3>
                <div className="bulk-actions">
                  <button 
                    className="select-all-btn"
                    onClick={handleSelectAll}
                  >
                    {selectedJobs.length === linkedinJobs.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <button 
                    className="import-selected-btn"
                    onClick={handleBulkImport}
                    disabled={selectedJobs.length === 0 || importing}
                  >
                    {importing ? 'Importing...' : `Import Selected (${selectedJobs.length})`}
                  </button>
                </div>
              </div>

              <div className="jobs-grid">
                {linkedinJobs.map((job) => (
                  <div key={job.linkedinId} className={`job-card ${selectedJobs.includes(job.linkedinId) ? 'selected' : ''}`}>
                    <div className="job-header">
                      <input
                        type="checkbox"
                        checked={selectedJobs.includes(job.linkedinId)}
                        onChange={() => handleJobSelect(job.linkedinId)}
                      />
                      <h4>{job.title}</h4>
                    </div>
                    <div className="job-company">{job.company}</div>
                    <div className="job-location">{job.location}</div>
                    <div className="job-salary">{job.salary}</div>
                    <div className="job-type">{job.type}</div>
                    <div className="job-skills">
                      {job.skills.slice(0, 3).map((skill, index) => (
                        <span key={index} className="skill-tag">{skill}</span>
                      ))}
                      {job.skills.length > 3 && (
                        <span className="skill-tag">+{job.skills.length - 3} more</span>
                      )}
                    </div>
                    <div className="job-description">
                      {job.description.substring(0, 150)}...
                    </div>
                    <div className="job-actions">
                      <button 
                        className="import-btn"
                        onClick={() => handleSingleImport(job.linkedinId)}
                      >
                        Import
                      </button>
                      <a 
                        href={job.applicationUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="view-btn"
                      >
                        View on LinkedIn
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="history-section">
          <h3>Import History ({importHistory.length} jobs)</h3>
          <div className="history-grid">
            {importHistory.map((job) => (
              <div key={job._id} className="history-card">
                <div className="history-header">
                  <h4>{job.title}</h4>
                  <span className={`status ${job.status.toLowerCase()}`}>{job.status}</span>
                </div>
                <div className="history-company">{job.company}</div>
                <div className="history-location">{job.location}</div>
                <div className="history-date">
                  Imported: {formatDate(job.createdAt)}
                </div>
                <div className="history-actions">
                  <a 
                    href={`/jobs/${job._id}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="view-job-btn"
                  >
                    View Job
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'stats' && stats && (
        <div className="stats-section">
          <h3>LinkedIn Integration Statistics</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">{stats.totalLinkedInJobs}</div>
              <div className="stat-label">Total LinkedIn Jobs</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.activeLinkedInJobs}</div>
              <div className="stat-label">Active Jobs</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.linkedInApplications}</div>
              <div className="stat-label">Applications</div>
            </div>
          </div>
          
          <div className="top-companies">
            <h4>Top Companies</h4>
            <div className="companies-list">
              {stats.topCompanies.map((company, index) => (
                <div key={index} className="company-item">
                  <span className="company-name">{company.company}</span>
                  <span className="company-count">{company.count} jobs</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Posting Tab */}
      {activeTab === 'posting' && (
        <div className="posting-section">
          <h3>Post LinkedIn Jobs to Candidates</h3>
          <p>Share imported LinkedIn jobs with relevant candidates</p>
          
          <div className="posting-history">
            <h4>Recent Postings ({postingHistory.length})</h4>
            <div className="posting-grid">
              {postingHistory.map((job) => (
                <div key={job._id} className="posting-card">
                  <div className="posting-header">
                    <h5>{job.title}</h5>
                    <span className="posting-status">Posted</span>
                  </div>
                  <div className="posting-company">{job.company}</div>
                  <div className="posting-location">{job.location}</div>
                  <div className="posting-stats">
                    <span>📧 {job.candidatesNotified || 0} candidates notified</span>
                    <span>📅 {formatDate(job.postedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="available-jobs">
            <h4>Available LinkedIn Jobs for Posting</h4>
            <div className="available-jobs-grid">
              {importHistory.filter(job => !job.postedToCandidates).map((job) => (
                <div key={job._id} className="available-job-card">
                  <div className="job-info">
                    <h5>{job.title}</h5>
                    <div className="job-company">{job.company}</div>
                    <div className="job-location">{job.location}</div>
                    <div className="job-skills">
                      {job.skills?.slice(0, 3).map((skill, index) => (
                        <span key={index} className="skill-tag">{skill}</span>
                      ))}
                    </div>
                  </div>
                  <button 
                    className="post-btn"
                    onClick={() => handlePostToCandidates(job)}
                  >
                    📤 Post to Candidates
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {showPostingModal && selectedJobForPosting && (
        <div className="modal-overlay">
          <div className="posting-modal">
            <div className="modal-header">
              <h3>Post Job to Candidates</h3>
              <button 
                className="close-btn"
                onClick={() => setShowPostingModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handlePostingSubmit}>
              <div className="modal-content">
                <div className="job-preview">
                  <h4>{selectedJobForPosting.title}</h4>
                  <p>{selectedJobForPosting.company} • {selectedJobForPosting.location}</p>
                </div>

                <div className="form-group">
                  <label>Target Skills</label>
                  <div className="skills-selector">
                    {selectedJobForPosting.skills?.map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        className={`skill-btn ${postingForm.targetSkills.includes(skill) ? 'selected' : ''}`}
                        onClick={() => handleSkillToggle(skill)}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Custom Message</label>
                  <textarea
                    name="message"
                    value={postingForm.message}
                    onChange={handlePostingFormChange}
                    placeholder="Enter a custom message for candidates..."
                    rows={4}
                  />
                </div>

                <div className="candidates-preview">
                  <h4>Matching Candidates ({candidates.length})</h4>
                  <div className="candidates-list">
                    {candidates.slice(0, 5).map((candidate) => (
                      <div key={candidate._id} className="candidate-item">
                        <span>{candidate.name}</span>
                        <span className="candidate-skills">
                          {candidate.profile?.skills?.slice(0, 3).join(', ')}
                        </span>
                      </div>
                    ))}
                    {candidates.length > 5 && (
                      <div className="more-candidates">
                        +{candidates.length - 5} more candidates
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowPostingModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="post-submit-btn">
                  Post to {candidates.length} Candidates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default LinkedInIntegration; 