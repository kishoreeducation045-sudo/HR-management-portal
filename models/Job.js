const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  job_id:           { type: String, required: true, unique: true },
  title:            { type: String, required: true },
  company:          { type: String, required: true },
  // Embedded array — demonstrates why MongoDB beats SQL junction tables
  // In MySQL this would require a separate job_skills table with foreign keys
  skills:           [{ type: String }],
  salary:           { type: Number, required: true },
  location:         { type: String, required: true },
  posted_on:        { type: Date, default: Date.now },
  // Extended fields from Kaggle dataset
  experience_level: { type: String, default: '' },
  job_type:         { type: String, default: 'Full-Time' },
  work_mode:        { type: String, default: 'On-Site' },
  industry:         { type: String, default: '' },
  openings:         { type: Number, default: 1 },
  applicants_count: { type: Number, default: 0 },
  education:        { type: String, default: '' },
  company_rating:   { type: Number, default: 0 },
  location_tier:    { type: String, default: '' }
}, { timestamps: true });

// Index 1: Multikey index on skills[] — each array element gets indexed individually
// COLLSCAN → IXSCAN demo: Run explain() before and after to see the difference
jobSchema.index({ skills: 1 });

// Index 2: Compound index on company + salary
// Used by the "Jobs Per Company" aggregation and salary filter queries
jobSchema.index({ company: 1, salary: -1 });

module.exports = mongoose.model('Job', jobSchema);
