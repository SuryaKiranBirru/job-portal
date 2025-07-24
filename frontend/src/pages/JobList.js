import React from 'react';
import Navigation from '../components/Navigation';
import '../styles/JobList.css';

function JobList() {
  return (
    <div className="job-list-container">
      <Navigation />
      <h2>Job Listings</h2>
      <div className="filters">Filters (Title, Location, Salary, Type, Skills)</div>
      <div className="jobs">Job cards go here</div>
    </div>
  );
}

export default JobList; 