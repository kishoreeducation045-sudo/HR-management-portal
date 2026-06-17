const express = require('express');
const router = express.Router();
const Job = require('../models/Job');

// POST /api/jobs — Create a job listing
router.post('/', async (req, res) => {
  try {
    const job = new Job(req.body);
    await job.save();
    res.status(201).json({ success: true, data: job });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// GET /api/jobs — List all jobs, with optional skill-based filtering
// Uses the multikey index on skills[] for efficient querying
// Example: GET /api/jobs?skill=MongoDB
router.get('/', async (req, res) => {
  try {
    const { skill } = req.query;
    let filter = {};
    if (skill) {
      filter.skills = skill; // MongoDB multikey index kicks in here
    }
    const jobs = await Job.find(filter).sort({ posted_on: -1 });
    res.json({ success: true, count: jobs.length, data: jobs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/jobs/:id — Get a single job by job_id
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findOne({ job_id: req.params.id });
    if (!job) return res.status(404).json({ success: false, error: 'Job not found' });
    res.json({ success: true, data: job });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/jobs/explain/:skill — Show explain() output for index demo
// This endpoint is specifically for viva demonstration
// Run before and after creating the index to show COLLSCAN → IXSCAN
router.get('/explain/:skill', async (req, res) => {
  try {
    const explain = await Job.find({ skills: req.params.skill })
      .explain('executionStats');
    res.json({ success: true, data: explain });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
