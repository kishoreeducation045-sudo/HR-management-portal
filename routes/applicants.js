const express = require('express');
const router = express.Router();
const Applicant = require('../models/Applicant');

// POST /api/applicants — Register a new applicant
router.post('/', async (req, res) => {
  try {
    const { app_id, name, email } = req.body;
    
    // Regex validation
    const appIdRegex = /^A\d{4}$/;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    const nameRegex = /^[a-zA-Z\s]+$/;

    if (!appIdRegex.test(app_id)) {
      return res.status(400).json({ success: false, error: 'Applicant ID must start with "A" followed by 4 digits (e.g. A0501)' });
    }

    if (!nameRegex.test(name)) {
      return res.status(400).json({ success: false, error: 'Full Name must contain only alphabets and spaces' });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Email is invalid enter valid Email' });
    }

    const applicant = new Applicant(req.body);
    await applicant.save();
    res.status(201).json({ success: true, data: applicant });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// GET /api/applicants — List all applicants
router.get('/', async (req, res) => {
  try {
    const applicants = await Applicant.find().sort({ name: 1 });
    res.json({ success: true, count: applicants.length, data: applicants });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/applicants/:id — Get a single applicant by app_id
router.get('/:id', async (req, res) => {
  try {
    const applicant = await Applicant.findOne({ app_id: req.params.id });
    if (!applicant) return res.status(404).json({ success: false, error: 'Applicant not found' });
    res.json({ success: true, data: applicant });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
