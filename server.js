const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware — allow all origins (Render deployment + local dev)
app.use(cors());
app.use(express.json());

// Serve React build (client/dist) — production
const clientDist = path.join(__dirname, 'client', 'dist');
app.use(express.static(clientDist));

// Fallback: serve old vanilla public/ for local development
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected — database: job_portal'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/applicants', require('./routes/applicants'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/analytics', require('./routes/analytics'));

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    project: 'Job Portal Database System',
    subject: 'DBMS Mini Project',
    stack: 'MongoDB + Node.js + Express',
    endpoints: {
      jobs: {
        'POST /api/jobs': 'Create a job listing',
        'GET /api/jobs': 'List all jobs',
        'GET /api/jobs?skill=X': 'Filter by skill (uses multikey index)',
        'GET /api/jobs/:id': 'Get job by job_id',
        'GET /api/jobs/explain/:skill': 'Show explain() for index demo'
      },
      applicants: {
        'POST /api/applicants': 'Register an applicant',
        'GET /api/applicants': 'List all applicants',
        'GET /api/applicants/:id': 'Get applicant by app_id'
      },
      applications: {
        'POST /api/applications': 'Submit an application',
        'GET /api/applications': 'List all applications',
        'PUT /api/applications/:id/status': 'Update status'
      },
      companies: {
        'GET /api/companies': 'List all companies'
      },
      analytics: {
        'GET /api/analytics/skill-demand': 'Skill demand pipeline ($unwind)',
        'GET /api/analytics/jobs-per-company': 'Jobs per company pipeline',
        'GET /api/analytics/application-funnel': 'Application funnel pipeline'
      }
    }
  });
});

// Serve frontend for all non-API routes
// Priority: React build → vanilla public/
app.get('/*splat', (req, res) => {
  const fs = require('fs');
  const reactIndex = path.join(__dirname, 'client', 'dist', 'index.html');
  if (fs.existsSync(reactIndex)) {
    res.sendFile(reactIndex);
  } else {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Frontend at http://localhost:${PORT}`);
  console.log(`📋 API docs at http://localhost:${PORT}/api`);
});
