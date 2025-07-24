import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import CandidateDashboard from './pages/CandidateDashboard';
import EmployerDashboard from './pages/EmployerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import JobList from './pages/JobList';
import JobDetails from './pages/JobDetails';
import Profile from './pages/Profile';
import CreateResume from './pages/CreateResume';
import ResumeList from './pages/ResumeList';
import './styles/App.css';
import { useAuth } from './context/AuthContext';

function App() {
  const { user } = useAuth();

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/jobs" element={<JobList />} />
        <Route path="/jobs/:id" element={<JobDetails />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/create-resume" element={<CreateResume />} />
        <Route path="/resumes" element={<ResumeList />} />
        {/* Dynamic dashboard route */}
        <Route
          path="/dashboard"
          element={
            user ? (
              user.role === 'candidate' ? <CandidateDashboard /> :
              user.role === 'employer' ? <EmployerDashboard /> :
              user.role === 'admin' ? <AdminDashboard /> :
              <Navigate to="/login" />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        {/* Default route */}
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App; 