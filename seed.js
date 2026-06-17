// ============================================================
// Seed Script — Populates the database with realistic test data
// Run: node seed.js
// ============================================================
// Creates:
//   3 companies (IT, Finance, Startup)
//   8 job listings with varied skills[]
//   10 applicants with overlapping skills
//   12 applications across all 5 status values
// Total: ~33 documents — clean for Compass screenshots
// ============================================================

const mongoose = require('mongoose');
require('dotenv').config();

const Company = require('./models/Company');
const Job = require('./models/Job');
const Applicant = require('./models/Applicant');
const Application = require('./models/Application');

const companies = [
  { comp_id: 'C001', name: 'TCS', industry: 'IT Services', size: 'Enterprise', location: 'Mumbai' },
  { comp_id: 'C002', name: 'HDFC Bank', industry: 'Finance', size: 'Enterprise', location: 'Mumbai' },
  { comp_id: 'C003', name: 'Razorpay', industry: 'Fintech', size: 'Startup', location: 'Bangalore' }
];

const jobs = [
  { job_id: 'J001', title: 'Backend Developer', company: 'TCS', skills: ['Node.js', 'MongoDB', 'Express', 'REST API'], salary: 800000, location: 'Mumbai', posted_on: new Date('2025-01-15') },
  { job_id: 'J002', title: 'Frontend Developer', company: 'TCS', skills: ['React', 'JavaScript', 'CSS', 'HTML'], salary: 750000, location: 'Mumbai', posted_on: new Date('2025-01-20') },
  { job_id: 'J003', title: 'Full Stack Developer', company: 'Razorpay', skills: ['React', 'Node.js', 'MongoDB', 'Docker'], salary: 1200000, location: 'Bangalore', posted_on: new Date('2025-02-01') },
  { job_id: 'J004', title: 'Data Analyst', company: 'HDFC Bank', skills: ['Python', 'SQL', 'Excel', 'Tableau'], salary: 650000, location: 'Mumbai', posted_on: new Date('2025-02-10') },
  { job_id: 'J005', title: 'DevOps Engineer', company: 'Razorpay', skills: ['Docker', 'Kubernetes', 'AWS', 'Linux'], salary: 1400000, location: 'Bangalore', posted_on: new Date('2025-02-15') },
  { job_id: 'J006', title: 'ML Engineer', company: 'TCS', skills: ['Python', 'TensorFlow', 'MongoDB', 'Statistics'], salary: 1100000, location: 'Hyderabad', posted_on: new Date('2025-03-01') },
  { job_id: 'J007', title: 'React Developer', company: 'Razorpay', skills: ['React', 'TypeScript', 'Node.js', 'MongoDB'], salary: 1000000, location: 'Bangalore', posted_on: new Date('2025-03-10') },
  { job_id: 'J008', title: 'Business Analyst', company: 'HDFC Bank', skills: ['SQL', 'Python', 'Excel', 'Power BI'], salary: 700000, location: 'Chennai', posted_on: new Date('2025-03-15') }
];

const applicants = [
  { app_id: 'A001', name: 'Rahul Sharma', email: 'rahul@email.com', skills: ['Node.js', 'MongoDB', 'React'], experience: 2, resume_link: 'https://drive.google.com/resume/rahul' },
  { app_id: 'A002', name: 'Priya Patel', email: 'priya@email.com', skills: ['Python', 'SQL', 'Tableau'], experience: 1, resume_link: 'https://drive.google.com/resume/priya' },
  { app_id: 'A003', name: 'Amit Kumar', email: 'amit@email.com', skills: ['React', 'JavaScript', 'CSS'], experience: 3, resume_link: 'https://drive.google.com/resume/amit' },
  { app_id: 'A004', name: 'Sneha Reddy', email: 'sneha@email.com', skills: ['Docker', 'Kubernetes', 'AWS'], experience: 4, resume_link: 'https://drive.google.com/resume/sneha' },
  { app_id: 'A005', name: 'Vikram Singh', email: 'vikram@email.com', skills: ['Python', 'TensorFlow', 'MongoDB'], experience: 2, resume_link: 'https://drive.google.com/resume/vikram' },
  { app_id: 'A006', name: 'Ananya Gupta', email: 'ananya@email.com', skills: ['React', 'Node.js', 'Express'], experience: 1, resume_link: 'https://drive.google.com/resume/ananya' },
  { app_id: 'A007', name: 'Karthik Nair', email: 'karthik@email.com', skills: ['SQL', 'Excel', 'Power BI'], experience: 2, resume_link: 'https://drive.google.com/resume/karthik' },
  { app_id: 'A008', name: 'Meera Iyer', email: 'meera@email.com', skills: ['Node.js', 'MongoDB', 'Docker'], experience: 3, resume_link: 'https://drive.google.com/resume/meera' },
  { app_id: 'A009', name: 'Rohan Desai', email: 'rohan@email.com', skills: ['React', 'TypeScript', 'MongoDB'], experience: 1, resume_link: 'https://drive.google.com/resume/rohan' },
  { app_id: 'A010', name: 'Divya Menon', email: 'divya@email.com', skills: ['Python', 'SQL', 'Statistics'], experience: 2, resume_link: 'https://drive.google.com/resume/divya' }
];

const applications = [
  { appl_id: 'AP001', job_id: 'J001', app_id: 'A001', status: 'Shortlisted', applied_on: new Date('2025-01-20') },
  { appl_id: 'AP002', job_id: 'J001', app_id: 'A006', status: 'Applied', applied_on: new Date('2025-01-22') },
  { appl_id: 'AP003', job_id: 'J002', app_id: 'A003', status: 'Interview', applied_on: new Date('2025-01-25') },
  { appl_id: 'AP004', job_id: 'J003', app_id: 'A001', status: 'Offered', applied_on: new Date('2025-02-05') },
  { appl_id: 'AP005', job_id: 'J003', app_id: 'A008', status: 'Shortlisted', applied_on: new Date('2025-02-07') },
  { appl_id: 'AP006', job_id: 'J004', app_id: 'A002', status: 'Interview', applied_on: new Date('2025-02-12') },
  { appl_id: 'AP007', job_id: 'J004', app_id: 'A010', status: 'Rejected', applied_on: new Date('2025-02-14') },
  { appl_id: 'AP008', job_id: 'J005', app_id: 'A004', status: 'Offered', applied_on: new Date('2025-02-18') },
  { appl_id: 'AP009', job_id: 'J006', app_id: 'A005', status: 'Applied', applied_on: new Date('2025-03-05') },
  { appl_id: 'AP010', job_id: 'J007', app_id: 'A009', status: 'Shortlisted', applied_on: new Date('2025-03-12') },
  { appl_id: 'AP011', job_id: 'J008', app_id: 'A007', status: 'Rejected', applied_on: new Date('2025-03-18') },
  { appl_id: 'AP012', job_id: 'J002', app_id: 'A006', status: 'Applied', applied_on: new Date('2025-03-20') }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Company.deleteMany({});
    await Job.deleteMany({});
    await Applicant.deleteMany({});
    await Application.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Insert seed data
    await Company.insertMany(companies);
    console.log(`📦 Inserted ${companies.length} companies`);

    await Job.insertMany(jobs);
    console.log(`📦 Inserted ${jobs.length} jobs`);

    await Applicant.insertMany(applicants);
    console.log(`📦 Inserted ${applicants.length} applicants`);

    await Application.insertMany(applications);
    console.log(`📦 Inserted ${applications.length} applications`);

    console.log('\n✅ Database seeded successfully!');
    console.log(`📊 Total documents: ${companies.length + jobs.length + applicants.length + applications.length}`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
}

seed();
