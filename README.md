# Job Portal with LinkedIn Integration

A full-stack job portal application with LinkedIn job integration, featuring user authentication, job posting, application management, and admin dashboard.

## Features

### Core Features
- **User Authentication**: Register, login, and role-based access (Admin, Employer, Candidate)
- **Job Management**: Post, edit, and manage job listings
- **Application System**: Apply to jobs and track application status
- **User Profiles**: Manage personal and company profiles
- **Notifications**: Real-time notifications for job updates

### LinkedIn Integration
- **Job Fetching**: Search and import jobs from LinkedIn
- **Bulk Import**: Import multiple jobs at once
- **Smart Posting**: Automatically post LinkedIn jobs to relevant candidates
- **Analytics**: Track import history and statistics
- **Admin Dashboard**: Comprehensive LinkedIn integration management

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Nodemailer** for email notifications
- **LinkedIn API** integration

### Frontend
- **React.js** with functional components and hooks
- **Context API** for state management
- **CSS3** for styling
- **Axios** for API communication

## Project Structure

```
Job Portal/
├── backend/                 # Backend API server
│   ├── middleware/         # Authentication middleware
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API endpoints
│   ├── utils/             # Utility functions
│   └── server.js          # Main server file
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── context/       # Context providers
│   │   ├── pages/         # Page components
│   │   └── styles/        # CSS files
│   └── public/            # Static files
└── README.md
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- LinkedIn API credentials (optional, for LinkedIn integration)

### Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
```

### Frontend Setup
```bash
cd frontend
npm install
```

## Running the Application

### Start Backend Server
```bash
cd backend
npm start
```
Server will run on `http://localhost:5000`

### Start Frontend Development Server
```bash
cd frontend
npm start
```
Frontend will run on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Jobs
- `GET /api/jobs` - Get all jobs
- `POST /api/jobs` - Create new job (Employer/Admin)
- `GET /api/jobs/:id` - Get job details
- `PUT /api/jobs/:id` - Update job (Owner/Admin)
- `DELETE /api/jobs/:id` - Delete job (Owner/Admin)

### Applications
- `POST /api/applications` - Apply to job
- `GET /api/applications` - Get user applications
- `PUT /api/applications/:id` - Update application status

### LinkedIn Integration (Admin Only)
- `GET /api/admin/linkedin/search` - Search LinkedIn jobs
- `POST /api/admin/linkedin/import` - Import LinkedIn job
- `POST /api/admin/linkedin/bulk-import` - Bulk import jobs
- `GET /api/admin/linkedin/history` - Get import history
- `GET /api/admin/linkedin/stats` - Get import statistics
- `POST /api/admin/linkedin/post-to-candidates` - Post jobs to candidates

## User Roles

### Admin
- Full access to all features
- LinkedIn integration management
- User management
- System statistics

### Employer
- Post and manage job listings
- View applications for their jobs
- Manage company profile

### Candidate
- Browse and apply to jobs
- Manage personal profile
- Track application status

## LinkedIn Integration Features

### Job Fetching
- Search jobs by keywords, location, and filters
- View job details before importing
- Mock data fallback when API is unavailable

### Import Management
- Single job import with customization
- Bulk import with batch processing
- Import history tracking
- Statistics and analytics

### Smart Posting
- Automatic candidate matching
- Email notifications to relevant candidates
- Job posting status tracking

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please open an issue in the GitHub repository. 