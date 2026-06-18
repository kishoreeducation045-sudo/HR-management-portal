import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const escHtml = s => s == null ? '' : String(s);
const PAGE_SIZE = 12;

const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const cardVariants = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } } };

function JobCard({ job, onApply }) {
  return (
    <motion.div className="card" variants={cardVariants} whileHover={{ y: -3, boxShadow: '0 8px 32px rgba(99,102,241,0.18)' }} layout>
      <div className="card-head">
        <div>
          <div className="card-title">{escHtml(job.title)}</div>
          <div className="card-sub">🏢 {escHtml(job.company)} · {escHtml(job.location)}</div>
        </div>
        <span className="work-badge">{escHtml(job.work_mode)}</span>
      </div>
      <div className="skills-row">
        {job.skills.slice(0, 5).map(s => <span key={s} className="skill-tag">{s}</span>)}
        {job.skills.length > 5 && <span className="skill-tag">+{job.skills.length - 5}</span>}
      </div>
      <div className="card-meta">
        <span>💰 ₹{(job.salary / 100000).toFixed(1)}L</span>
        <span>🎯 {job.experience_level || 'Any'}</span>
        <span>📋 {job.job_type}</span>
        <span className="card-badge">{job.job_id}</span>
      </div>
    </motion.div>
  );
}

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const range = [];
  if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) range.push(i); }
  else {
    range.push(1);
    if (page > 3) range.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) range.push(i);
    if (page < totalPages - 2) range.push('…');
    range.push(totalPages);
  }
  return (
    <div className="pagination">
      <button className="page-btn" disabled={page === 1} onClick={() => onChange(page - 1)}>‹</button>
      {range.map((r, i) => r === '…'
        ? <span key={i} className="page-info">…</span>
        : <button key={r} className={`page-btn${r === page ? ' active' : ''}`} onClick={() => onChange(r)}>{r}</button>
      )}
      <button className="page-btn" disabled={page === totalPages} onClick={() => onChange(page + 1)}>›</button>
      <span className="page-info">{page} / {totalPages}</span>
    </div>
  );
}

export default function JobsGrid({ onOpenModal }) {
  const [allJobs, setAllJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [workMode, setWorkMode] = useState('');
  const [jobType, setJobType] = useState('');
  const [expLevel, setExpLevel] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/jobs').then(r => r.json());
        setAllJobs(res.data || []);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const filtered = allJobs.filter(j => {
    const q = query.toLowerCase();
    const matchQ = !q || j.skills.some(s => s.toLowerCase().includes(q)) || j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q);
    const matchMode = !workMode || (j.work_mode || '').includes(workMode);
    const matchType = !jobType || (j.job_type || '').includes(jobType);
    const matchExp  = !expLevel || (j.experience_level || '').toLowerCase().includes(expLevel.toLowerCase());
    return matchQ && matchMode && matchType && matchExp;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageJobs = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilterChange = (setter) => (e) => { setter(e.target.value); setPage(1); };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}>
      <div className="page-header">
        <h2>Job Listings</h2>
        <p>Browse, filter and search <strong>{allJobs.length.toLocaleString('en-IN')}</strong> job listings</p>
      </div>

      <div className="toolbar">
        <div className="searchbox" style={{ flex: 1 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} placeholder="Search by skill, title, or company…" />
        </div>
        <select className="filter-select" value={workMode} onChange={handleFilterChange(setWorkMode)}>
          <option value="">All Modes</option>
          <option value="Remote">Remote</option>
          <option value="On-Site">On-Site</option>
          <option value="Hybrid">Hybrid</option>
        </select>
        <select className="filter-select" value={jobType} onChange={handleFilterChange(setJobType)}>
          <option value="">All Types</option>
          <option value="Full-Time">Full-Time</option>
          <option value="Part-Time">Part-Time</option>
          <option value="Internship">Internship</option>
          <option value="Contract">Contract</option>
        </select>
        <select className="filter-select" value={expLevel} onChange={handleFilterChange(setExpLevel)}>
          <option value="">All Levels</option>
          <option value="Entry">Entry</option>
          <option value="Mid">Mid</option>
          <option value="Senior">Senior</option>
        </select>
        <button className="btn btn-primary" onClick={() => onOpenModal('job')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Job
        </button>
      </div>

      {loading ? (
        <div className="cards-grid">{Array(6).fill(0).map((_, i) => <div key={i} className="skeleton skel-card" />)}</div>
      ) : pageJobs.length === 0 ? (
        <div className="empty-state"><p>No jobs match your filters.</p></div>
      ) : (
        <motion.div className="cards-grid" variants={containerVariants} initial="hidden" animate="visible">
          {pageJobs.map(job => <JobCard key={job.job_id} job={job} />)}
        </motion.div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </motion.div>
  );
}
