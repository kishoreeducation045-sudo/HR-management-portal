# Job Portal Database System — DBMS Mini Project

A modern, high-performance Job Portal web application designed as a college DBMS mini-project. This project emphasizes the advantages of NoSQL over traditional SQL databases, specifically highlighting **Embedded Documents**, **Aggregation Pipelines**, and **Multikey Indexing** using MongoDB.

## 🚀 Features & Concepts
- **Embedded Arrays vs Junction Tables:** Job skills are stored as an array within the Job document, eliminating the need for complex, slow JOINs typical in relational databases.
- **Advanced Aggregation (`$unwind`, `$group`):** Real-time analytics pipeline that deconstructs the skills array to calculate market demand across thousands of job listings.
- **Multikey Indexing (`IXSCAN`):** Demonstrates massive performance gains (from full collection scans to targeted index scans) when searching for specific job skills.
- **Massive Dataset:** Pre-seeded with **8,000+ realistic documents** sourced from real Indian Job Market Kaggle data (TCS, Wipro, Microsoft, Razorpay, etc.).
- **Premium UI:** A responsive, dark glassmorphism frontend built with vanilla HTML/JS/CSS for zero configuration overhead.

## 🛠️ Technology Stack
- **Database:** MongoDB
- **Backend:** Node.js, Express.js (v5)
- **ODM:** Mongoose
- **Frontend:** HTML5, Vanilla JavaScript, CSS3 (Custom Glassmorphism Design)

## 📦 Setup & Installation

### Prerequisites
1. Ensure **Node.js** (v18+) is installed.
2. Ensure **MongoDB** is running locally on port `27017` (can run automatically as a Windows service or via MongoDB Compass).

### Instructions
1. Navigate to the project directory:
   ```bash
   cd "dbms mini project"
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Seed the database with the massive Kaggle dataset (5000+ jobs, auto-generated applicants):
   ```bash
   npm run seed-kaggle
   ```
   *(Wait 10-15 seconds for it to parse the CSV and insert 8000+ records).*
4. Start the server:
   ```bash
   npm run start
   ```
5. Open your browser and go to: **[http://localhost:3000](http://localhost:3000)**

## 📂 Project Structure
```text
├── .env                # Environment variables (Port, MongoDB URI)
├── package.json        # Dependencies & scripts
├── server.js           # Express app, server config, and DB connection
├── seed-kaggle.js      # Advanced data generator and CSV parser
├── seed.js             # Basic initial seed script
├── india_job_market_2024_2026.csv # Raw Kaggle dataset
├── models/             # Mongoose Schemas (Job, Applicant, Application, Company)
├── routes/             # REST API controllers and Aggregation logic
└── public/             # Frontend Single Page Application (HTML, CSS, JS)
```

## 📊 Analytics Highlights
The most impressive part of this project is the Aggregation Pipeline found in `routes/analytics.js`. It runs across 5000+ documents in milliseconds:
```javascript
// Example: Skill Demand Aggregation
const skillDemand = await Job.aggregate([
  { $unwind: "$skills" }, // Flatten the skills array
  { $group: { _id: "$skills", count: { $sum: 1 } } }, // Count occurrences
  { $sort: { count: -1 } }, // Sort by most demanded
  { $limit: 10 } // Get top 10
]);
```
