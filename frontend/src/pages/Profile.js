import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAuthToken } from '../context/AuthContext';
import axios from 'axios';
import Navigation from '../components/Navigation';
import '../styles/Profile.css';

function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    skills: [],
    experience: '',
    resumeUrl: '',
    linkedin: '',
    // Company fields for employers
    companyName: '',
    industry: '',
    about: '',
    website: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const response = await axios.get('http://localhost:5000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setProfile(response.data);
      setFormData({
        name: response.data.name || '',
        skills: response.data.profile?.skills || [],
        experience: response.data.profile?.experience || '',
        resumeUrl: response.data.profile?.resumeUrl || '',
        linkedin: response.data.profile?.linkedin || '',
        companyName: response.data.company?.name || '',
        industry: response.data.company?.industry || '',
        about: response.data.company?.about || '',
        website: response.data.company?.website || ''
      });
    } catch (err) {
      setError('Failed to load profile');
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSkillsChange = (e) => {
    const skills = e.target.value.split(',').map(skill => skill.trim()).filter(skill => skill);
    setFormData(prev => ({
      ...prev,
      skills
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = getAuthToken();
      const updateData = {
        name: formData.name,
        skills: formData.skills,
        experience: formData.experience,
        resumeUrl: formData.resumeUrl,
        linkedin: formData.linkedin
      };

      // Add company data for employers
      if (user.role === 'employer') {
        updateData.company = {
          name: formData.companyName,
          industry: formData.industry,
          about: formData.about,
          website: formData.website
        };
      }

      await axios.put('http://localhost:5000/api/users/profile', updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      fetchProfile(); // Refresh profile data
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-header">
          <h2>Profile</h2>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <Navigation />
      <div className="profile-header">
        <h2>Profile</h2>
        <div className="header-actions">
          {!isEditing && (
            <button onClick={() => setIsEditing(true)} className="edit-btn">
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="profile-content">
        {isEditing ? (
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-section">
              <h3>Basic Information</h3>
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            {user.role === 'candidate' && (
              <div className="form-section">
                <h3>Professional Information</h3>
                <div className="form-group">
                  <label htmlFor="skills">Skills (comma-separated)</label>
                  <input
                    type="text"
                    id="skills"
                    name="skills"
                    value={formData.skills.join(', ')}
                    onChange={handleSkillsChange}
                    placeholder="JavaScript, React, Node.js, MongoDB"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="experience">Experience</label>
                  <textarea
                    id="experience"
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    rows="4"
                    placeholder="Describe your work experience..."
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="resumeUrl">Resume URL</label>
                  <input
                    type="url"
                    id="resumeUrl"
                    name="resumeUrl"
                    value={formData.resumeUrl}
                    onChange={handleInputChange}
                    placeholder="https://example.com/resume.pdf"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="linkedin">LinkedIn Profile</label>
                  <input
                    type="url"
                    id="linkedin"
                    name="linkedin"
                    value={formData.linkedin}
                    onChange={handleInputChange}
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>
              </div>
            )}

            {user.role === 'employer' && (
              <div className="form-section">
                <h3>Company Information</h3>
                <div className="form-group">
                  <label htmlFor="companyName">Company Name</label>
                  <input
                    type="text"
                    id="companyName"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="industry">Industry</label>
                  <input
                    type="text"
                    id="industry"
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    placeholder="Technology, Healthcare, Finance..."
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="website">Website</label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://yourcompany.com"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="about">About Company</label>
                  <textarea
                    id="about"
                    name="about"
                    value={formData.about}
                    onChange={handleInputChange}
                    rows="4"
                    placeholder="Describe your company..."
                  />
                </div>
              </div>
            )}

            <div className="form-actions">
              <button type="submit" disabled={saving} className="save-btn">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setIsEditing(false);
                  setError('');
                  setSuccess('');
                  // Reset form to original values
                  setFormData({
                    name: profile.name || '',
                    skills: profile.profile?.skills || [],
                    experience: profile.profile?.experience || '',
                    resumeUrl: profile.profile?.resumeUrl || '',
                    linkedin: profile.profile?.linkedin || '',
                    companyName: profile.company?.name || '',
                    industry: profile.company?.industry || '',
                    about: profile.company?.about || '',
                    website: profile.company?.website || ''
                  });
                }} 
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-display">
            <div className="profile-avatar">
              <span>{(profile?.name || 'U').charAt(0)}</span>
            </div>
            
            <div className="profile-info">
              <h3>{profile?.name}</h3>
              <p className="email">{profile?.email}</p>
              <p className="role">Role: {profile?.role}</p>
            </div>

            {user.role === 'candidate' && profile?.profile && (
              <div className="profile-section">
                <h4>Professional Information</h4>
                {profile.profile.skills && profile.profile.skills.length > 0 && (
                  <div className="info-group">
                    <label>Skills:</label>
                    <div className="skills-list">
                      {profile.profile.skills.map((skill, index) => (
                        <span key={index} className="skill-tag">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}
                {profile.profile.experience && (
                  <div className="info-group">
                    <label>Experience:</label>
                    <p>{profile.profile.experience}</p>
                  </div>
                )}
                {profile.profile.resumeUrl && (
                  <div className="info-group">
                    <label>Resume:</label>
                    <a href={profile.profile.resumeUrl} target="_blank" rel="noopener noreferrer">
                      View Resume
                    </a>
                  </div>
                )}
                {profile.profile.linkedin && (
                  <div className="info-group">
                    <label>LinkedIn:</label>
                    <a href={profile.profile.linkedin} target="_blank" rel="noopener noreferrer">
                      View Profile
                    </a>
                  </div>
                )}
              </div>
            )}

            {user.role === 'employer' && profile?.company && (
              <div className="profile-section">
                <h4>Company Information</h4>
                <div className="info-group">
                  <label>Company:</label>
                  <p>{profile.company.name}</p>
                </div>
                {profile.company.industry && (
                  <div className="info-group">
                    <label>Industry:</label>
                    <p>{profile.company.industry}</p>
                  </div>
                )}
                {profile.company.website && (
                  <div className="info-group">
                    <label>Website:</label>
                    <a href={profile.company.website} target="_blank" rel="noopener noreferrer">
                      {profile.company.website}
                    </a>
                  </div>
                )}
                {profile.company.about && (
                  <div className="info-group">
                    <label>About:</label>
                    <p>{profile.company.about}</p>
                  </div>
                )}
              </div>
            )}

            <div className="profile-section">
              <h4>Account Information</h4>
              <div className="info-group">
                <label>Member since:</label>
                <p>{new Date(profile?.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="info-group">
                <label>Status:</label>
                <span className={`status-badge ${profile?.status}`}>
                  {profile?.status}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile; 