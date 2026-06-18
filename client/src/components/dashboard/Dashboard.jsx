import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePersona } from '../../context/PersonaContext';

function AnimatedNumber({ target }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!target) return;
    let cur = 0;
    const step = Math.max(1, Math.floor(target / 40));
    const iv = setInterval(() => {
      cur = Math.min(cur + step, target);
      setDisplay(cur);
      if (cur >= target) clearInterval(iv);
    }, 25);
    return () => clearInterval(iv);
  }, [target]);
  return <span>{display.toLocaleString('en-IN')}</span>;
}

const CARDS = [
  { id: 'jobs',         label: 'Job Listings',  trend: '📊 Live count',      color: '#6366f1', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg> },
  { id: 'applicants',   label: 'Applicants',    trend: '👤 Registered',       color: '#8b5cf6', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> },
  { id: 'applications', label: 'Applications',  trend: '📋 Total submitted',   color: '#ec4899', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
  { id: 'companies',    label: 'Companies',     trend: '🏢 Active hiring',     color: '#14b8a6', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg> },
];

const concepts = [
  { badge: 'NoSQL', title: 'Embedded Documents', desc: <><code>skills[]</code> lives inside each Job document — no junction table needed unlike SQL&apos;s <code>job_skills</code> table.</> },
  { badge: 'Pipeline', title: '$unwind Aggregation', desc: 'Deconstructs the skills array: one job with 5 skills becomes 5 documents, then grouped and counted.' },
  { badge: 'Index', title: 'Multikey Index', desc: <><code>skills[]</code> index turns COLLSCAN → IXSCAN. See Explore DB for a live demo.</> },
  { badge: 'Redundancy', title: 'Controlled Redundancy', desc: <>Application stores <code>job_title</code> &amp; <code>applicant_name</code> to eliminate <code>$lookup</code> joins.</> },
];

const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const cardVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } };

export default function Dashboard({ setSection, onOpenModal }) {
  const { persona } = usePersona();
  const [stats, setStats] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const [jobs, applicants, applications, companies] = await Promise.all([
          fetch('/api/jobs').then(r => r.json()),
          fetch('/api/applicants').then(r => r.json()),
          fetch('/api/applications?limit=1').then(r => r.json()),
          fetch('/api/companies').then(r => r.json()),
        ]);
        setStats({
          jobs: jobs.count || 0,
          applicants: applicants.count || 0,
          applications: applications.total || 0,
          companies: companies.count || 0,
        });
      } catch {}
    })();
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}>
      <div className="page-header">
        <h2>Dashboard Overview</h2>
        <p>Real-time stats from the SkillStream database via live REST API calls</p>
      </div>

      <motion.div className="stats-grid" variants={containerVariants} initial="hidden" animate="visible">
        {CARDS.map(card => (
          <motion.div key={card.id} className="stat-card" style={{ '--c': card.color }} variants={cardVariants} whileHover={{ scale: 1.02 }}>
            <div className="stat-icon">{card.icon}</div>
            <div>
              <span className="stat-num"><AnimatedNumber target={stats[card.id] || 0} /></span>
              <div className="stat-lbl">{card.label}</div>
              <div className="stat-trend">{card.trend}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="concepts-strip">
        <h3>🎓 DBMS Concepts Demonstrated</h3>
        <div className="concepts-grid">
          {concepts.map((c, i) => (
            <motion.div key={i} className="concept" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
              <div className="cbadge">{c.badge}</div>
              <h4>{c.title}</h4>
              <p>{c.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-row">
          <button className="action-btn" onClick={() => setSection('jobs')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Browse Jobs
          </button>
          {(persona === 'admin' || persona === 'recruiter') && (
            <button className="action-btn" onClick={() => setSection('analytics')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              View Analytics
            </button>
          )}
          {persona === 'admin' && (
            <button className="action-btn" onClick={() => setSection('explore')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              Explore DB Features
            </button>
          )}
          <button className="action-btn" onClick={() => onOpenModal('job')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add New Job
          </button>
        </div>
      </div>
    </motion.div>
  );
}
