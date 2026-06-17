const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  comp_id: { type: String, required: true, unique: true },
  name: { type: String, required: true, unique: true },
  industry: { type: String, required: true },
  size: { type: String, enum: ['Startup', 'Mid-size', 'Enterprise', 'MNC', 'Indian Unicorn', 'PSU/Govt'], required: true },
  location: { type: String, required: true },
  company_type: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);
