# JobNest Backend

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your values.
3. Start the server:
   ```bash
   npm run dev
   ```

## Project Structure
- `models/` - Mongoose models
- `controllers/` - Route controllers
- `routes/` - Express routes
- `middleware/` - Auth, error, etc.
- `utils/` - Utility functions
- `config/` - DB and other config

## Main Features
- JWT Auth (with LinkedIn OAuth placeholder)
- Role-based access (Candidate, Employer, Admin)
- RESTful APIs for jobs, users, applications
- Resume upload endpoint (placeholder)
- Admin moderation endpoints 