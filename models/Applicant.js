const mongoose = require('mongoose');

const applicantSchema = new mongoose.Schema({
  app_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  // Embedded skills array — same pattern as Jobs collection
  skills: [{ type: String }],
  experience: { type: Number, required: true }, // years of experience
  resume_link: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Applicant', applicantSchema);
