const express = require('express');
const router = express.Router();
const Company = require('../models/Company');

// Get all companies (and total count)
router.get('/', async (req, res) => {
  try {
    const companies = await Company.find();
    res.json({
      success: true,
      count: companies.length,
      data: companies
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
