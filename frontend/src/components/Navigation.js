import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Navigation.css';

function Navigation() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardTitle = () => {
    switch (user?.role) {
      case 'candidate':
        return 'Candidate Dashboard';
      case 'employer':
        return 'Employer Dashboard';
      case 'admin':
        return 'Admin Dashboard';
      default:
        return 'Dashboard';
    }
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <h2 onClick={() => navigate('/dashboard')} className="brand-text">
            Job Portal
          </h2>
        </div>
        
        <div className="nav-menu">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="nav-link"
          >
            {getDashboardTitle()}
          </button>
          
          <button 
            onClick={() => navigate('/jobs')} 
            className="nav-link"
          >
            Browse Jobs
          </button>
          
          <button 
            onClick={() => navigate('/profile')} 
            className="nav-link profile-link"
          >
            <span className="profile-icon">👤</span>
            Profile
          </button>
          
          <button 
            onClick={handleLogout} 
            className="nav-link logout-link"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navigation; 