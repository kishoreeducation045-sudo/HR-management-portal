import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const cardVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export default function ApplicantsGrid({ onOpenModal }) {
  const [all, setAll] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try { const r = await fetch('/api/applicants').then(r => r.json()); setAll(r.data || []); }
      catch {}
      setLoading(false);
    })();
  }, []);

  const filtered = all.filter(a =>
    a.name.toLowerCase().includes(query.toLowerCase()) ||
    a.skills.some(s => s.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}>
      <div className="page-header">
        <h2>Applicants</h2>
        <p>Registered applicants with their skill profiles</p>
      </div>
      <div className="toolbar">
        <div className="searchbox" style={{ flex: 1 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name or skill…" />
        </div>
        <button className="btn btn-primary" onClick={() => onOpenModal('applicant')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Applicant
        </button>
      </div>

      {loading ? (
        <div className="cards-grid">{Array(6).fill(0).map((_, i) => <div key={i} className="skeleton skel-card" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><p>No applicants found.</p></div>
      ) : (
        <motion.div className="cards-grid" variants={containerVariants} initial="hidden" animate="visible">
          {filtered.slice(0, 48).map(a => (
            <motion.div key={a.app_id} className="card" variants={cardVariants} whileHover={{ y: -3 }}>
              <div className="card-head">
                <div>
                  <div className="card-title">{a.name}</div>
                  <div className="card-sub">✉️ {a.email}</div>
                </div>
                <span className="card-badge">{a.app_id}</span>
              </div>
              <div className="skills-row">
                {a.skills.map(s => <span key={s} className="skill-tag">{s}</span>)}
              </div>
              <div className="card-meta">
                <span>💼 {a.experience} yr{a.experience !== 1 ? 's' : ''} exp</span>
                {a.resume_link && <span><a href={a.resume_link} target="_blank" rel="noopener" style={{ color: 'var(--accent)' }}>📄 Resume</a></span>}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
