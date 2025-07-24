import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAuthToken } from '../context/AuthContext';
import axios from 'axios';
import Navigation from '../components/Navigation';
import '../styles/CreateResume.css';

function CreateResume() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generatedResume, setGeneratedResume] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    // Personal Information
    fullName: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    website: '',
    
    // Professional Summary
    summary: '',
    
    // Experience
    experience: [
      {
        company: '',
        position: '',
        startDate: '',
        endDate: '',
        current: false,
        description: ''
      }
    ],
    
    // Education
    education: [
      {
        institution: '',
        degree: '',
        field: '',
        startDate: '',
        endDate: '',
        gpa: ''
      }
    ],
    
    // Skills
    skills: [],
    skillInput: '',
    
    // Projects
    projects: [
      {
        name: '',
        description: '',
        technologies: '',
        link: ''
      }
    ],
    
    // Certifications
    certifications: [
      {
        name: '',
        issuer: '',
        date: '',
        link: ''
      }
    ]
  });

  // Resume templates
  const templates = [
    {
      id: 'modern',
      name: 'Modern Professional',
      description: 'Clean and contemporary design with emphasis on skills and achievements',
      preview: '🎨 Modern layout with clean typography',
      color: '#007bff'
    },
    {
      id: 'classic',
      name: 'Classic Traditional',
      description: 'Traditional format with clear sections and professional appearance',
      preview: '📄 Traditional format with clear sections',
      color: '#28a745'
    },
    {
      id: 'creative',
      name: 'Creative Portfolio',
      description: 'Creative design perfect for designers and creative professionals',
      preview: '✨ Creative design with visual elements',
      color: '#ffc107'
    },
    {
      id: 'minimal',
      name: 'Minimal Clean',
      description: 'Minimalist design focusing on content and readability',
      preview: '⚪ Clean and minimal design',
      color: '#6c757d'
    }
  ];

  useEffect(() => {
    // Pre-fill with user data if available
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.name || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleArrayChange = (index, field, value, arrayName) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addArrayItem = (arrayName, defaultItem) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: [...prev[arrayName], defaultItem]
    }));
  };

  const removeArrayItem = (index, arrayName) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].filter((_, i) => i !== index)
    }));
  };

  const handleSkillAdd = () => {
    if (formData.skillInput.trim()) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, prev.skillInput.trim()],
        skillInput: ''
      }));
    }
  };

  const handleSkillRemove = (index) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const handleGenerateResume = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = getAuthToken();
      const response = await axios.post('http://localhost:5000/api/resume/generate', {
        template: selectedTemplate,
        data: formData,
        title: formData.fullName ? `${formData.fullName}'s Resume` : 'My Resume'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setGeneratedResume(response.data.resume);
      setSuccess('Resume generated successfully!');
      setStep(4);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate resume');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadResume = async () => {
    try {
      const token = getAuthToken();
      const response = await axios.get(`http://localhost:5000/api/resume/download/${generatedResume._id}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${generatedResume.title.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download resume');
    }
  };

  const handleSaveResume = async () => {
    try {
      const token = getAuthToken();
      await axios.put(`http://localhost:5000/api/resume/set-active/${generatedResume._id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Resume saved to your profile!');
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save resume');
    }
  };

  const renderStep1 = () => (
    <div className="step-content">
      <h2>Choose Your Resume Template</h2>
      <p>Select a template that best represents your professional style</p>
      
      <div className="templates-grid">
        {templates.map(template => (
          <div 
            key={template.id}
            className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
            onClick={() => setSelectedTemplate(template.id)}
          >
            <div className="template-preview" style={{ backgroundColor: template.color }}>
              <span className="template-icon">📄</span>
            </div>
            <div className="template-info">
              <h3>{template.name}</h3>
              <p>{template.description}</p>
              <span className="template-preview-text">{template.preview}</span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="step-actions">
        <button 
          className="next-btn" 
          onClick={() => setStep(2)}
          disabled={!selectedTemplate}
        >
          Next: Personal Information
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="step-content">
      <h2>Personal Information</h2>
      <p>Fill in your basic information and professional summary</p>
      
      <div className="form-section">
        <h3>Basic Information</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label>Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="City, State"
            />
          </div>
          <div className="form-group">
            <label>LinkedIn</label>
            <input
              type="url"
              name="linkedin"
              value={formData.linkedin}
              onChange={handleInputChange}
              placeholder="https://linkedin.com/in/yourprofile"
            />
          </div>
          <div className="form-group">
            <label>Website</label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              placeholder="https://yourwebsite.com"
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>Professional Summary</h3>
        <div className="form-group">
          <label>Summary *</label>
          <textarea
            name="summary"
            value={formData.summary}
            onChange={handleInputChange}
            rows="4"
            placeholder="Write a compelling professional summary that highlights your key strengths and career objectives..."
            required
          />
        </div>
      </div>

      <div className="form-section">
        <h3>Skills</h3>
        <div className="skills-input">
          <input
            type="text"
            value={formData.skillInput}
            onChange={(e) => setFormData(prev => ({ ...prev, skillInput: e.target.value }))}
            placeholder="Add a skill and press Enter"
            onKeyPress={(e) => e.key === 'Enter' && handleSkillAdd()}
          />
          <button onClick={handleSkillAdd} className="add-skill-btn">Add</button>
        </div>
        <div className="skills-list">
          {formData.skills.map((skill, index) => (
            <span key={index} className="skill-tag">
              {skill}
              <button onClick={() => handleSkillRemove(index)} className="remove-skill">×</button>
            </span>
          ))}
        </div>
      </div>
      
      <div className="step-actions">
        <button className="back-btn" onClick={() => setStep(1)}>Back</button>
        <button 
          className="next-btn" 
          onClick={() => setStep(3)}
          disabled={!formData.fullName || !formData.email || !formData.summary}
        >
          Next: Experience & Education
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="step-content">
      <h2>Experience & Education</h2>
      <p>Add your work experience and educational background</p>
      
      <div className="form-section">
        <div className="section-header">
          <h3>Work Experience</h3>
          <button 
            onClick={() => addArrayItem('experience', {
              company: '',
              position: '',
              startDate: '',
              endDate: '',
              current: false,
              description: ''
            })}
            className="add-item-btn"
          >
            + Add Experience
          </button>
        </div>
        
        {formData.experience.map((exp, index) => (
          <div key={index} className="array-item">
            <div className="item-header">
              <h4>Experience {index + 1}</h4>
              {formData.experience.length > 1 && (
                <button 
                  onClick={() => removeArrayItem(index, 'experience')}
                  className="remove-item-btn"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Company *</label>
                <input
                  type="text"
                  value={exp.company}
                  onChange={(e) => handleArrayChange(index, 'company', e.target.value, 'experience')}
                  required
                />
              </div>
              <div className="form-group">
                <label>Position *</label>
                <input
                  type="text"
                  value={exp.position}
                  onChange={(e) => handleArrayChange(index, 'position', e.target.value, 'experience')}
                  required
                />
              </div>
              <div className="form-group">
                <label>Start Date *</label>
                <input
                  type="month"
                  value={exp.startDate}
                  onChange={(e) => handleArrayChange(index, 'startDate', e.target.value, 'experience')}
                  required
                />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input
                  type="month"
                  value={exp.endDate}
                  onChange={(e) => handleArrayChange(index, 'endDate', e.target.value, 'experience')}
                  disabled={exp.current}
                />
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={exp.current}
                    onChange={(e) => handleArrayChange(index, 'current', e.target.checked, 'experience')}
                  />
                  Current Position
                </label>
              </div>
            </div>
            <div className="form-group">
              <label>Description *</label>
              <textarea
                value={exp.description}
                onChange={(e) => handleArrayChange(index, 'description', e.target.value, 'experience')}
                rows="3"
                placeholder="Describe your responsibilities and achievements..."
                required
              />
            </div>
          </div>
        ))}
      </div>

      <div className="form-section">
        <div className="section-header">
          <h3>Education</h3>
          <button 
            onClick={() => addArrayItem('education', {
              institution: '',
              degree: '',
              field: '',
              startDate: '',
              endDate: '',
              gpa: ''
            })}
            className="add-item-btn"
          >
            + Add Education
          </button>
        </div>
        
        {formData.education.map((edu, index) => (
          <div key={index} className="array-item">
            <div className="item-header">
              <h4>Education {index + 1}</h4>
              {formData.education.length > 1 && (
                <button 
                  onClick={() => removeArrayItem(index, 'education')}
                  className="remove-item-btn"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Institution *</label>
                <input
                  type="text"
                  value={edu.institution}
                  onChange={(e) => handleArrayChange(index, 'institution', e.target.value, 'education')}
                  required
                />
              </div>
              <div className="form-group">
                <label>Degree *</label>
                <input
                  type="text"
                  value={edu.degree}
                  onChange={(e) => handleArrayChange(index, 'degree', e.target.value, 'education')}
                  required
                />
              </div>
              <div className="form-group">
                <label>Field of Study</label>
                <input
                  type="text"
                  value={edu.field}
                  onChange={(e) => handleArrayChange(index, 'field', e.target.value, 'education')}
                />
              </div>
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="month"
                  value={edu.startDate}
                  onChange={(e) => handleArrayChange(index, 'startDate', e.target.value, 'education')}
                />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input
                  type="month"
                  value={edu.endDate}
                  onChange={(e) => handleArrayChange(index, 'endDate', e.target.value, 'education')}
                />
              </div>
              <div className="form-group">
                <label>GPA</label>
                <input
                  type="text"
                  value={edu.gpa}
                  onChange={(e) => handleArrayChange(index, 'gpa', e.target.value, 'education')}
                  placeholder="3.8/4.0"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="form-section">
        <div className="section-header">
          <h3>Projects (Optional)</h3>
          <button 
            onClick={() => addArrayItem('projects', {
              name: '',
              description: '',
              technologies: '',
              link: ''
            })}
            className="add-item-btn"
          >
            + Add Project
          </button>
        </div>
        
        {formData.projects.map((project, index) => (
          <div key={index} className="array-item">
            <div className="item-header">
              <h4>Project {index + 1}</h4>
              <button 
                onClick={() => removeArrayItem(index, 'projects')}
                className="remove-item-btn"
              >
                Remove
              </button>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Project Name</label>
                <input
                  type="text"
                  value={project.name}
                  onChange={(e) => handleArrayChange(index, 'name', e.target.value, 'projects')}
                />
              </div>
              <div className="form-group">
                <label>Technologies Used</label>
                <input
                  type="text"
                  value={project.technologies}
                  onChange={(e) => handleArrayChange(index, 'technologies', e.target.value, 'projects')}
                  placeholder="React, Node.js, MongoDB"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={project.description}
                onChange={(e) => handleArrayChange(index, 'description', e.target.value, 'projects')}
                rows="2"
                placeholder="Describe the project and your role..."
              />
            </div>
            <div className="form-group">
              <label>Project Link</label>
              <input
                type="url"
                value={project.link}
                onChange={(e) => handleArrayChange(index, 'link', e.target.value, 'projects')}
                placeholder="https://github.com/username/project"
              />
            </div>
          </div>
        ))}
      </div>
      
      <div className="step-actions">
        <button className="back-btn" onClick={() => setStep(2)}>Back</button>
        <button 
          className="generate-btn" 
          onClick={handleGenerateResume}
          disabled={loading}
        >
          {loading ? 'Generating Resume...' : 'Generate Resume with AI'}
        </button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="step-content">
      <h2>Your Resume is Ready!</h2>
      <p>Your AI-generated resume has been created successfully</p>
      
      <div className="resume-preview">
        <div className="preview-header">
          <h3>Resume Preview</h3>
          <span className="template-name">{templates.find(t => t.id === selectedTemplate)?.name}</span>
        </div>
        <div className="preview-content">
          <div className="preview-page">
            <h2>{formData.fullName}</h2>
            <p className="contact-info">
              {formData.email} • {formData.phone} • {formData.location}
            </p>
            {formData.linkedin && <p>LinkedIn: {formData.linkedin}</p>}
            
            <h3>Professional Summary</h3>
            <p>{formData.summary}</p>
            
            <h3>Skills</h3>
            <div className="skills-preview">
              {formData.skills.join(', ')}
            </div>
            
            <h3>Experience</h3>
            {formData.experience.map((exp, index) => (
              <div key={index} className="experience-preview">
                <h4>{exp.position} at {exp.company}</h4>
                <p>{exp.startDate} - {exp.current ? 'Present' : exp.endDate}</p>
                <p>{exp.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="resume-actions">
        <button onClick={handleDownloadResume} className="download-btn">
          📥 Download PDF
        </button>
        <button onClick={handleSaveResume} className="save-btn">
          💾 Save to Profile
        </button>
        <button onClick={() => navigate('/dashboard')} className="dashboard-btn">
          🏠 Back to Dashboard
        </button>
      </div>
    </div>
  );

  return (
    <div className="create-resume-container">
      <Navigation />
      
      <div className="resume-header">
        <h1>Create Your Resume</h1>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${(step / 4) * 100}%` }}
          ></div>
        </div>
        <div className="step-indicator">
          Step {step} of 4
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="resume-content">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </div>
    </div>
  );
}

export default CreateResume; 