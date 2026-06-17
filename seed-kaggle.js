// ============================================================
// Kaggle Seed Script — Imports 5,000 jobs from India Job Market CSV
// Run: node seed-kaggle.js
// ============================================================
// Imports:
//   ~50 unique companies (extracted from CSV)
//   5,001 job listings with full skills[] arrays
//   500 auto-generated applicants with Indian names
//   2,500 applications linking applicants to jobs
//   Total: ~8,000+ documents
// ============================================================

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const Company = require('./models/Company');
const Job = require('./models/Job');
const Applicant = require('./models/Applicant');
const Application = require('./models/Application');

// ===== CSV Parser (handles quoted fields) =====
function parseCSV(text) {
  const lines = text.split('\n').filter(l => l.trim());
  const headers = parseCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const obj = {};
      headers.forEach((h, idx) => obj[h.trim()] = values[idx].trim());
      rows.push(obj);
    }
  }
  return rows;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ===== Indian Name Generator =====
const firstNames = [
  'Aarav', 'Aditi', 'Aditya', 'Akash', 'Amit', 'Ananya', 'Anika', 'Anjali',
  'Arjun', 'Arya', 'Bhavya', 'Chetan', 'Deepak', 'Devi', 'Dhruv', 'Divya',
  'Gaurav', 'Harish', 'Isha', 'Ishaan', 'Jaya', 'Kabir', 'Karan', 'Kavya',
  'Krishna', 'Lakshmi', 'Manish', 'Maya', 'Meera', 'Mohit', 'Nandini', 'Naveen',
  'Neha', 'Nikhil', 'Pallavi', 'Pooja', 'Pradeep', 'Pranav', 'Priya', 'Rahul',
  'Raj', 'Rajesh', 'Ravi', 'Rekha', 'Rishi', 'Rohit', 'Rohan', 'Sakshi',
  'Sandeep', 'Sanjay', 'Sarika', 'Shivani', 'Shreya', 'Simran', 'Sneha',
  'Sonia', 'Sunil', 'Tanvi', 'Varun', 'Vijay', 'Vikram', 'Vinay', 'Yash',
  'Zara', 'Abhinav', 'Akshay', 'Anand', 'Arun', 'Chandra', 'Darshan', 'Esha',
  'Farah', 'Ganesh', 'Hemant', 'Ira', 'Jayesh', 'Kirti', 'Lavanya', 'Madhav',
  'Nisha', 'Om', 'Pankaj', 'Radha', 'Sahil', 'Tara', 'Uma', 'Vivek', 'Wani',
  'Yasmin', 'Zubin', 'Aparna', 'Bharat', 'Chirag', 'Daksh', 'Ekta'
];
const lastNames = [
  'Sharma', 'Patel', 'Gupta', 'Singh', 'Kumar', 'Reddy', 'Nair', 'Iyer',
  'Menon', 'Joshi', 'Verma', 'Chopra', 'Mehta', 'Desai', 'Shah', 'Rao',
  'Pillai', 'Bhat', 'Agarwal', 'Mishra', 'Kapoor', 'Chauhan', 'Pandey',
  'Malhotra', 'Saxena', 'Srivastava', 'Tiwari', 'Bajaj', 'Bansal', 'Goyal',
  'Thakur', 'Jain', 'Dutta', 'Bose', 'Das', 'Chatterjee', 'Mukherjee',
  'Ghosh', 'Sen', 'Bhatt', 'Kulkarni', 'Patil', 'More', 'Jadhav', 'Pawar',
  'Kaur', 'Gill', 'Arora', 'Sethi', 'Khanna'
];

// ===== Skill Pool (for generating applicant skills) =====
const skillPool = [
  'Python', 'Java', 'JavaScript', 'React', 'Node.js', 'MongoDB', 'SQL',
  'Docker', 'Kubernetes', 'AWS', 'TypeScript', 'REST APIs', 'Git',
  'C++', 'Django', 'FastAPI', 'PostgreSQL', 'Express.js', 'HTML/CSS',
  'TensorFlow', 'PyTorch', 'Scikit-learn', 'Tableau', 'Power BI', 'Excel',
  'Selenium', 'JIRA', 'Agile', 'System Design', 'Kotlin', 'Swift',
  'Azure', 'GCP', 'Linux', 'CI/CD', 'Redis', 'Spark', 'Airflow',
  'Next.js', 'Redux', 'Figma', 'Firebase', 'Spring Boot', 'Hibernate'
];

function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomSubset(arr, min, max) {
  const count = randomInt(min, max);
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

async function seedKaggle() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Company.deleteMany({});
    await Job.deleteMany({});
    await Applicant.deleteMany({});
    await Application.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // ===== 1. Read and parse CSV =====
    const csvPath = path.join(__dirname, 'india_job_market_2024_2026.csv');
    const csvText = fs.readFileSync(csvPath, 'utf-8');
    const rows = parseCSV(csvText);
    console.log(`📄 Parsed ${rows.length} rows from CSV`);

    // ===== 2. Extract unique companies and insert =====
    const companyMap = new Map(); // name -> { industry, type, location }
    for (const row of rows) {
      if (!companyMap.has(row.Company)) {
        companyMap.set(row.Company, {
          industry: row.Industry || 'Technology',
          type: row.Company_Type || 'Startup',
          location: (row.City === 'Remote' ? 'Bangalore' : row.City) || 'Bangalore'
        });
      }
    }

    const companies = [];
    let compIdx = 0;
    for (const [name, info] of companyMap) {
      compIdx++;
      companies.push({
        comp_id: `C${String(compIdx).padStart(3, '0')}`,
        name,
        industry: info.industry,
        size: info.type,
        location: info.location,
        company_type: info.type
      });
    }
    await Company.insertMany(companies);
    console.log(`🏢 Inserted ${companies.length} unique companies`);

    // ===== 3. Transform CSV rows into Job documents =====
    const jobs = rows.map(row => ({
      job_id: row.Job_ID,
      title: row.Job_Title,
      company: row.Company,
      skills: row.Skills_Required
        ? row.Skills_Required.split(',').map(s => s.trim()).filter(Boolean)
        : [],
      salary: Math.round(parseFloat(row.Salary_LPA || '0') * 100000),
      location: row.City || 'Remote',
      posted_on: row.Date_Posted ? new Date(row.Date_Posted) : new Date(),
      experience_level: row.Experience_Level || '',
      job_type: row.Job_Type || 'Full-Time',
      work_mode: row.Work_Mode || 'On-Site',
      industry: row.Industry || '',
      openings: parseInt(row.Openings || '1', 10),
      applicants_count: parseInt(row.Applicants || '0', 10),
      education: row.Education_Required || '',
      company_rating: parseFloat(row.Company_Rating || '0'),
      location_tier: row.Location_Tier || ''
    }));

    // Insert in batches of 500 to avoid memory issues
    const batchSize = 500;
    for (let i = 0; i < jobs.length; i += batchSize) {
      const batch = jobs.slice(i, i + batchSize);
      await Job.insertMany(batch);
      console.log(`📦 Inserted jobs batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(jobs.length / batchSize)} (${batch.length} docs)`);
    }
    console.log(`💼 Total jobs inserted: ${jobs.length}`);

    // ===== 4. Generate 500 realistic applicants =====
    const applicants = [];
    const usedEmails = new Set();
    for (let i = 0; i < 500; i++) {
      const first = randomFrom(firstNames);
      const last = randomFrom(lastNames);
      let email = `${first.toLowerCase()}.${last.toLowerCase()}${randomInt(1, 99)}@email.com`;
      while (usedEmails.has(email)) {
        email = `${first.toLowerCase()}.${last.toLowerCase()}${randomInt(100, 9999)}@email.com`;
      }
      usedEmails.add(email);
      applicants.push({
        app_id: `A${String(i + 1).padStart(4, '0')}`,
        name: `${first} ${last}`,
        email,
        skills: randomSubset(skillPool, 3, 7),
        experience: randomInt(0, 12),
        resume_link: `https://drive.google.com/resume/${first.toLowerCase()}_${last.toLowerCase()}`
      });
    }
    await Applicant.insertMany(applicants);
    console.log(`👤 Inserted ${applicants.length} applicants`);

    // ===== 5. Generate 2,500 applications =====
    const statuses = ['Applied', 'Shortlisted', 'Interview', 'Offered', 'Rejected'];
    const applications = [];
    const usedPairs = new Set(); // prevent duplicate job+applicant pairs
    for (let i = 0; i < 2500; i++) {
      let jobId, appId, pairKey;
      let attempts = 0;
      do {
        jobId = randomFrom(jobs).job_id;
        appId = randomFrom(applicants).app_id;
        pairKey = `${jobId}-${appId}`;
        attempts++;
      } while (usedPairs.has(pairKey) && attempts < 50);
      usedPairs.add(pairKey);

      const baseDate = new Date('2024-06-01');
      const randomDays = randomInt(0, 700);
      const appliedDate = new Date(baseDate.getTime() + randomDays * 86400000);

      const jobDoc = jobs.find(j => j.job_id === jobId);
      const appDoc = applicants.find(a => a.app_id === appId);
      applications.push({
        appl_id: `AP${String(i + 1).padStart(5, '0')}`,
        job_id: jobId,
        app_id: appId,
        status: randomFrom(statuses),
        applied_on: appliedDate,
        // Denormalized fields for the Controlled Redundancy benchmark demo
        job_title:      jobDoc ? jobDoc.title : '',
        applicant_name: appDoc ? appDoc.name  : ''
      });
    }

    // Insert applications in batches
    for (let i = 0; i < applications.length; i += batchSize) {
      const batch = applications.slice(i, i + batchSize);
      await Application.insertMany(batch);
      console.log(`📝 Inserted applications batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(applications.length / batchSize)} (${batch.length} docs)`);
    }
    console.log(`📋 Total applications inserted: ${applications.length}`);

    // ===== Summary =====
    const total = companies.length + jobs.length + applicants.length + applications.length;
    console.log('\n' + '='.repeat(50));
    console.log('✅ KAGGLE SEED COMPLETE!');
    console.log('='.repeat(50));
    console.log(`🏢 Companies:    ${companies.length}`);
    console.log(`💼 Jobs:         ${jobs.length}`);
    console.log(`👤 Applicants:   ${applicants.length}`);
    console.log(`📋 Applications: ${applications.length}`);
    console.log(`📊 TOTAL:        ${total} documents`);
    console.log('='.repeat(50));

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err.message);
    process.exit(1);
  }
}

seedKaggle();
