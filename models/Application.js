const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  appl_id:        { type: String, required: true, unique: true },
  job_id:         { type: String, required: true },
  app_id:         { type: String, required: true },
  status: {
    type: String,
    enum: ['Applied', 'Shortlisted', 'Interview', 'Offered', 'Rejected'],
    default: 'Applied'
  },
  applied_on:     { type: Date, default: Date.now },
  // --- Denormalized fields (Controlled Redundancy Demo) ---
  // These duplicate data from Job and Applicant collections intentionally.
  // This eliminates the need for $lookup joins on read-heavy queries,
  // demonstrating the NoSQL design philosophy: "optimize for reads, not writes."
  job_title:      { type: String, default: '' },
  applicant_name: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);
