import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAuthToken } from '../context/AuthContext';
import axios from 'axios';
import Navigation from '../components/Navigation';
import '../styles/ResumeList.css';

function ResumeList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchResumes();
  }, [user, navigate]);

  const fetchResumes = async () => {
    try {
      const token = getAuthToken();
      const response = await axios.get('http://localhost:5000/api/resume/my-resumes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResumes(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch resumes');
    } finally {
      setLoading(false);
    }
  };

  const handleViewResume = (resumeId) => {
    window.open(`http://localhost:5000/api/resume/view/${resumeId}`, '_blank');
  };

  const handleDownloadResume = async (resumeId, title) => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`http://localhost:5000/api/resume/download/${resumeId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${title.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download resume');
    }
  };

  const handleSetActive = async (resumeId) => {
    try {
      const token = getAuthToken();
      await axios.put(`http://localhost:5000/api/resume/set-active/${resumeId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh resumes list
      fetchResumes();
      alert('Resume set as active successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to set resume as active');
    }
  };

  const handleDeleteResume = async (resumeId) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) {
      return;
    }

    try {
      const token = getAuthToken();
      await axios.delete(`http://localhost:5000/api/resume/${resumeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh resumes list
      fetchResumes();
      alert('Resume deleted successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete resume');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="resume-list-container">
        <Navigation />
        <div className="resume-list-content">
          <div className="loading">Loading resumes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="resume-list-container">
      <Navigation />
      <div className="resume-list-content">
        <div className="resume-list-header">
          <h1>My Resumes</h1>
          <div className="resume-list-actions">
            <button 
              className="create-resume-btn"
              onClick={() => navigate('/create-resume')}
            >
              Create New Resume
            </button>
            <button 
              className="upload-resume-btn"
              onClick={() => navigate('/dashboard')}
            >
              Upload Resume
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {resumes.length === 0 ? (
          <div className="no-resumes">
            <div className="no-resumes-icon">📄</div>
            <h3>No resumes found</h3>
            <p>Create your first resume or upload an existing one to get started.</p>
            <div className="no-resumes-actions">
              <button 
                className="create-resume-btn"
                onClick={() => navigate('/create-resume')}
              >
                Create Resume with AI
              </button>
              <button 
                className="upload-resume-btn"
                onClick={() => navigate('/dashboard')}
              >
                Upload Resume
              </button>
            </div>
          </div>
        ) : (
          <div className="resumes-grid">
            {resumes.map((resume) => (
              <div key={resume._id} className={`resume-card ${resume.isActive ? 'active' : ''}`}>
                <div className="resume-card-header">
                  <div className="resume-info">
                    <h3>{resume.title}</h3>
                    <p className="resume-type">
                      {resume.type === 'generated' ? 'AI Generated' : 'Uploaded'}
                      {resume.isActive && <span className="active-badge">Active</span>}
                    </p>
                    <p className="resume-date">
                      Created: {formatDate(resume.createdAt)}
                    </p>
                  </div>
                  <div className="resume-actions">
                    <button 
                      className="view-btn"
                      onClick={() => handleViewResume(resume._id)}
                      title="View Resume"
                    >
                      👁️ View
                    </button>
                    <button 
                      className="download-btn"
                      onClick={() => handleDownloadResume(resume._id, resume.title)}
                      title="Download PDF"
                    >
                      📥 Download
                    </button>
                    {!resume.isActive && (
                      <button 
                        className="set-active-btn"
                        onClick={() => handleSetActive(resume._id)}
                        title="Set as Active"
                      >
                        ⭐ Set Active
                      </button>
                    )}
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeleteResume(resume._id)}
                      title="Delete Resume"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
                
                {resume.type === 'generated' && resume.template && (
                  <div className="resume-details">
                    <p><strong>Template:</strong> {resume.template}</p>
                    {resume.data && resume.data.fullName && (
                      <p><strong>Name:</strong> {resume.data.fullName}</p>
                    )}
                  </div>
                )}
                
                {resume.type === 'uploaded' && resume.fileName && (
                  <div className="resume-details">
                    <p><strong>File:</strong> {resume.fileName}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ResumeList; 