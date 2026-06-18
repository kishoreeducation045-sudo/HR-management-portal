import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { usePersona } from '../../context/PersonaContext';

const STATUSES = ['Applied','Shortlisted','Interview','Offered','Rejected'];

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="pagination">
      <button className="page-btn" disabled={page === 1} onClick={() => onChange(page - 1)}>‹</button>
      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
        const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
        return <button key={p} className={`page-btn${p === page ? ' active' : ''}`} onClick={() => onChange(p)}>{p}</button>;
      })}
      <button className="page-btn" disabled={page === totalPages} onClick={() => onChange(page + 1)}>›</button>
      <span className="page-info">{page} / {totalPages}</span>
    </div>
  );
}

export default function ApplicationsTable({ onOpenModal, showToast }) {
  const { persona } = usePersona();
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p = page, s = status) => {
    setLoading(true);
    try {
      const url = `/api/applications?page=${p}&limit=50${s ? '&status=' + s : ''}`;
      const res = await fetch(url).then(r => r.json());
      setData(res.data || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
    } catch {}
    setLoading(false);
  }, [page, status]);

  useEffect(() => { load(page, status); }, [page, status]);

  const updateStatus = async (applId, newStatus) => {
    try {
      const res = await fetch(`/api/applications/${applId}/status`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      }).then(r => r.json());
      if (res.success) { showToast(`${applId} → ${newStatus}`); load(page, status); }
      else showToast(res.error, true);
    } catch { showToast('Server error', true); }
  };

  const canEdit = persona === 'admin' || persona === 'recruiter';

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}>
      <div className="page-header">
        <h2>Applications</h2>
        <p>Track all job applications and update their status</p>
      </div>

      <div className="toolbar">
        <select className="filter-select" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {canEdit && (
          <button className="btn btn-primary" onClick={() => onOpenModal('application')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Application
          </button>
        )}
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th><th>Job ID</th><th>Job Title</th>
              <th>Applicant ID</th><th>Applicant</th>
              <th>Status</th><th>Applied On</th>
              {canEdit && <th>Update</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={canEdit ? 8 : 7} className="loading-state">Loading…</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={canEdit ? 8 : 7} className="empty-state">No applications found.</td></tr>
            ) : data.map(a => (
              <motion.tr key={a.appl_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                <td><strong>{a.appl_id}</strong></td>
                <td><span className="id-badge">{a.job_id}</span></td>
                <td>{a.job_title || 'N/A'}</td>
                <td><span className="id-badge">{a.app_id}</span></td>
                <td>{a.applicant_name || 'N/A'}</td>
                <td><span className={`status-badge s-${a.status}`}>{a.status}</span></td>
                <td>{new Date(a.applied_on).toLocaleDateString('en-IN')}</td>
                {canEdit && (
                  <td>
                    <select className="status-sel" defaultValue="" onChange={e => { if (e.target.value) updateStatus(a.appl_id, e.target.value); }}>
                      <option value="" disabled>Change…</option>
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                )}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={pages} onChange={p => { setPage(p); load(p, status); }} />
    </motion.div>
  );
}
