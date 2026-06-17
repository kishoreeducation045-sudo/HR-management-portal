const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const Job = require('../models/Job');
const Applicant = require('../models/Applicant');

// POST /api/applications — Submit a new application
// Writes both normalized IDs and denormalized names for the redundancy demo
router.post('/', async (req, res) => {
  try {
    const { appl_id, job_id, app_id } = req.body;

    // Fetch names to denormalize into the application document
    const [job, applicant] = await Promise.all([
      Job.findOne({ job_id }, { title: 1 }),
      Applicant.findOne({ app_id }, { name: 1 })
    ]);

    const application = new Application({
      appl_id,
      job_id,
      app_id,
      job_title:      job?.title || '',
      applicant_name: applicant?.name || ''
    });

    await application.save();
    res.status(201).json({ success: true, data: application });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// GET /api/applications — List applications with pagination
// ?page=1&limit=50&status=Applied&lookup=true
router.get('/', async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(200, parseInt(req.query.limit) || 50);
    const skip   = (page - 1) * limit;
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const [total, applications] = await Promise.all([
      Application.countDocuments(filter),
      Application.find(filter).sort({ applied_on: -1 }).skip(skip).limit(limit)
    ]);

    res.json({
      success: true,
      count: applications.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: applications
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/applications/:id/status — Update application status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Applied', 'Shortlisted', 'Interview', 'Offered', 'Rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }
    const application = await Application.findOneAndUpdate(
      { appl_id: req.params.id },
      { status },
      { new: true }
    );
    if (!application) return res.status(404).json({ success: false, error: 'Application not found' });
    res.json({ success: true, data: application });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;
