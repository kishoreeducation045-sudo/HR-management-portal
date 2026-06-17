const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const Application = require('../models/Application');
const Applicant = require('../models/Applicant');

// ============================================================
// Pipeline 1: Skill Demand Analysis
// GET /api/analytics/skill-demand
// $unwind → $group → $sort — the crown jewel pipeline
// ============================================================
router.get('/skill-demand', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 15;
    const data = await Job.aggregate([
      { $unwind: '$skills' },
      { $group: { _id: '$skills', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
      { $project: { _id: 0, skill: '$_id', count: 1 } }
    ]);
    res.json({ success: true, pipeline: '$unwind → $group → $sort', data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// Pipeline 2: Jobs Per Company (with avg salary)
// GET /api/analytics/jobs-per-company
// ============================================================
router.get('/jobs-per-company', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 12;
    const data = await Job.aggregate([
      { $group: { _id: '$company', totalJobs: { $sum: 1 }, avgSalary: { $avg: '$salary' } } },
      { $sort: { totalJobs: -1 } },
      { $limit: limit },
      { $project: { _id: 0, company: '$_id', totalJobs: 1, avgSalary: { $round: ['$avgSalary', 0] } } }
    ]);
    res.json({ success: true, pipeline: '$group → $sort', data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// Pipeline 3: Application Funnel
// GET /api/analytics/application-funnel
// ============================================================
router.get('/application-funnel', async (req, res) => {
  try {
    const data = await Application.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { _id: 0, status: '$_id', count: 1 } }
    ]);
    res.json({ success: true, pipeline: '$group → $sort', data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// Pipeline 4: Salary Distribution by Experience Level
// GET /api/analytics/salary-distribution
// ============================================================
router.get('/salary-distribution', async (req, res) => {
  try {
    const data = await Job.aggregate([
      { $match: { experience_level: { $ne: '' } } },
      {
        $group: {
          _id: '$experience_level',
          avgSalary: { $avg: '$salary' },
          minSalary: { $min: '$salary' },
          maxSalary: { $max: '$salary' },
          count: { $sum: 1 }
        }
      },
      { $sort: { avgSalary: 1 } },
      {
        $project: {
          _id: 0, level: '$_id',
          avgSalary: { $round: ['$avgSalary', 0] },
          minSalary: 1, maxSalary: 1, count: 1
        }
      }
    ]);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// Pipeline 5: Jobs by City / Location
// GET /api/analytics/jobs-by-location
// ============================================================
router.get('/jobs-by-location', async (req, res) => {
  try {
    const data = await Job.aggregate([
      { $group: { _id: '$location', count: { $sum: 1 }, avgSalary: { $avg: '$salary' } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { _id: 0, city: '$_id', count: 1, avgSalary: { $round: ['$avgSalary', 0] } } }
    ]);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// Feature: Visual Explain Analyzer
// GET /api/analytics/explain/:skill
// Returns both IXSCAN (indexed) and COLLSCAN (natural) stats
// ============================================================
router.get('/explain/:skill', async (req, res) => {
  try {
    const skill = req.params.skill;

    // Run both explain queries concurrently for speed
    const [indexed, natural] = await Promise.all([
      // Uses the multikey index on skills[]
      Job.find({ skills: skill }).explain('executionStats'),
      // Forces a collection scan by bypassing all indexes
      Job.find({ skills: skill }).hint({ $natural: 1 }).explain('executionStats')
    ]);

    const extractStats = (explain) => ({
      stage:           explain.executionStats.executionStages.stage || explain.executionStats.executionStages.inputStage?.stage || 'N/A',
      executionTimeMs: explain.executionStats.executionTimeMillis,
      docsExamined:    explain.executionStats.totalDocsExamined,
      keysExamined:    explain.executionStats.totalKeysExamined,
      docsReturned:    explain.executionStats.nReturned
    });

    res.json({
      success: true,
      skill,
      indexed:  extractStats(indexed),
      natural:  extractStats(natural)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// Feature: Smart Skill Matchmaking
// GET /api/analytics/match/:app_id
// Ranks jobs by skill compatibility for a given applicant
// ============================================================
router.get('/match/:app_id', async (req, res) => {
  try {
    const applicant = await Applicant.findOne({ app_id: req.params.app_id });
    if (!applicant) return res.status(404).json({ success: false, error: 'Applicant not found' });

    const applicantSkills = applicant.skills;

    const matches = await Job.aggregate([
      {
        $project: {
          title: 1, company: 1, skills: 1, salary: 1, location: 1, job_type: 1, work_mode: 1,
          matchScore: { $size: { $setIntersection: ['$skills', applicantSkills] } },
          totalRequired: { $size: '$skills' }
        }
      },
      { $match: { matchScore: { $gt: 0 } } },
      {
        $addFields: {
          matchPercentage: {
            $round: [{ $multiply: [{ $divide: ['$matchScore', '$totalRequired'] }, 100] }, 0]
          }
        }
      },
      { $sort: { matchPercentage: -1, salary: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0, title: 1, company: 1, salary: 1, location: 1,
          job_type: 1, work_mode: 1, skills: 1,
          matchScore: 1, totalRequired: 1, matchPercentage: 1
        }
      }
    ]);

    res.json({ success: true, applicant: { name: applicant.name, skills: applicantSkills }, matches });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// Feature: Controlled Redundancy Benchmark
// GET /api/analytics/benchmark
// Compares normalized ($lookup) vs. denormalized (direct read) query times
// ============================================================
router.get('/benchmark', async (req, res) => {
  try {
    const ITERATIONS = 20;

    // --- Run 1: Normalized Read ($lookup join) ---
    const t1Start = Date.now();
    for (let i = 0; i < ITERATIONS; i++) {
      await Application.aggregate([
        {
          $lookup: {
            from: 'jobs',
            localField: 'job_id',
            foreignField: 'job_id',
            as: 'jobData'
          }
        },
        {
          $lookup: {
            from: 'applicants',
            localField: 'app_id',
            foreignField: 'app_id',
            as: 'applicantData'
          }
        },
        { $limit: 100 }
      ]);
    }
    const normalizedMs = Date.now() - t1Start;

    // --- Run 2: Denormalized Read (Direct fields, no join) ---
    const t2Start = Date.now();
    for (let i = 0; i < ITERATIONS; i++) {
      await Application.find({}, { appl_id: 1, job_title: 1, applicant_name: 1, status: 1 }).limit(100);
    }
    const denormalizedMs = Date.now() - t2Start;

    res.json({
      success: true,
      iterations: ITERATIONS,
      normalized:    { totalMs: normalizedMs, avgMs: (normalizedMs / ITERATIONS).toFixed(2), strategy: '$lookup join across 3 collections' },
      denormalized:  { totalMs: denormalizedMs, avgMs: (denormalizedMs / ITERATIONS).toFixed(2), strategy: 'Direct field read (no join)' },
      speedupFactor: (normalizedMs / denormalizedMs).toFixed(2)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
