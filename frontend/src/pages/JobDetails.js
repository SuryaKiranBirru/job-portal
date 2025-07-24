import React from 'react';
import Navigation from '../components/Navigation';
import '../styles/JobDetails.css';

function JobDetails() {
  return (
    <div className="job-details-container">
      <Navigation />
      <h2>Job Title</h2>
      <div className="job-info">Job details go here</div>
      <button>Apply</button>
    </div>
  );
}

export default JobDetails; 