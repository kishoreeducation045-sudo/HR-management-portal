import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const backdrop = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const modalAnim = { hidden: { opacity: 0, scale: 0.93, y: 20 }, visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 26 } } };

function ModalShell({ onClose, title, children }) {
  return (
    <motion.div className="modal-backdrop" variants={backdrop} initial="hidden" animate="visible" exit="hidden"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div className="modal" variants={modalAnim} initial="hidden" animate="visible" exit="hidden">
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

export function AddJobModal({ onClose, onSuccess, showToast }) {
  const [form, setForm] = useState({ job_id: '', title: '', company: '', skills: '', salary: '', location: '', job_type: 'Full-Time', work_mode: 'On-Site', experience_level: '' });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, salary: Number(form.salary), skills: form.skills.split(',').map(s => s.trim()).filter(Boolean) }),
      }).then(r => r.json());
      if (res.success) { showToast('Job created: ' + form.title); onSuccess(); onClose(); }
      else showToast(res.error, true);
    } catch { showToast('Server error', true); }
  };

  return (
    <ModalShell onClose={onClose} title="Add New Job">
      <form onSubmit={submit}>
        <div className="form-row">
          <div className="form-group"><label>Job ID</label><input value={form.job_id} onChange={set('job_id')} placeholder="e.g. J9001" required /></div>
          <div className="form-group"><label>Job Type</label><select value={form.job_type} onChange={set('job_type')}><option>Full-Time</option><option>Part-Time</option><option>Internship</option><option>Contract</option></select></div>
        </div>
        <div className="form-group"><label>Job Title</label><input value={form.title} onChange={set('title')} placeholder="e.g. Senior Backend Developer" required /></div>
        <div className="form-group"><label>Company</label><input value={form.company} onChange={set('company')} placeholder="e.g. TCS, Infosys" required /></div>
        <div className="form-group"><label>Skills (comma separated)</label><input value={form.skills} onChange={set('skills')} placeholder="e.g. Node.js, MongoDB, React" required /></div>
        <div className="form-row">
          <div className="form-group"><label>Salary (₹/year)</label><input type="number" value={form.salary} onChange={set('salary')} placeholder="e.g. 1200000" required /></div>
          <div className="form-group"><label>City</label><input value={form.location} onChange={set('location')} placeholder="e.g. Bangalore" required /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Work Mode</label><select value={form.work_mode} onChange={set('work_mode')}><option>On-Site</option><option>Remote</option><option>Hybrid</option></select></div>
          <div className="form-group"><label>Experience Level</label><select value={form.experience_level} onChange={set('experience_level')}><option value="">—</option><option>Entry</option><option>Mid</option><option>Senior</option></select></div>
        </div>
        <button type="submit" className="btn btn-primary btn-full">Create Job Listing</button>
      </form>
    </ModalShell>
  );
}

export function AddApplicantModal({ onClose, onSuccess, showToast }) {
  const [form, setForm] = useState({ app_id: '', name: '', email: '', skills: '', experience: '', resume_link: '' });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async e => {
    e.preventDefault();

    // Regex checks
    const appIdRegex = /^A\d{4}$/;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

    if (!appIdRegex.test(form.app_id)) {
      showToast('Applicant ID must start with "A" followed by 4 digits (e.g., A0501)', true);
      return;
    }

    if (!emailRegex.test(form.email)) {
      showToast('Email must be a valid @gmail.com address (e.g., name@gmail.com)', true);
      return;
    }

    try {
      const res = await fetch('/api/applicants', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, experience: Number(form.experience), skills: form.skills.split(',').map(s => s.trim()).filter(Boolean) }),
      }).then(r => r.json());
      if (res.success) { showToast('Applicant registered: ' + form.name); onSuccess(); onClose(); }
      else showToast(res.error, true);
    } catch { showToast('Server error', true); }
  };

  return (
    <ModalShell onClose={onClose} title="Register Applicant">
      <form onSubmit={submit}>
        <div className="form-row">
          <div className="form-group">
            <label>Applicant ID</label>
            <input 
              value={form.app_id} 
              onChange={set('app_id')} 
              placeholder="e.g. A0501" 
              pattern="A\d{4}"
              title="Must start with 'A' followed by exactly 4 digits (e.g., A0501)"
              required 
            />
          </div>
          <div className="form-group"><label>Experience (years)</label><input type="number" value={form.experience} onChange={set('experience')} placeholder="e.g. 3" min="0" max="40" required /></div>
        </div>
        <div className="form-group"><label>Full Name</label><input value={form.name} onChange={set('name')} placeholder="e.g. Rahul Sharma" required /></div>
        <div className="form-group">
          <label>Email</label>
          <input 
            type="email" 
            value={form.email} 
            onChange={set('email')} 
            placeholder="e.g. rahul@gmail.com" 
            pattern="[a-zA-Z0-9._%+-]+@gmail\.com"
            title="Must be a valid @gmail.com address (e.g., name@gmail.com)"
            required 
          />
        </div>
        <div className="form-group"><label>Skills (comma separated)</label><input value={form.skills} onChange={set('skills')} placeholder="e.g. Python, SQL, React" required /></div>
        <div className="form-group"><label>Resume Link (optional)</label><input type="url" value={form.resume_link} onChange={set('resume_link')} placeholder="https://drive.google.com/…" /></div>
        <button type="submit" className="btn btn-primary btn-full">Register Applicant</button>
      </form>
    </ModalShell>
  );
}

export function AddApplicationModal({ onClose, onSuccess, showToast }) {
  const [form, setForm] = useState({ appl_id: '', job_id: '', app_id: '' });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async e => {
    e.preventDefault();

    // Regex check
    const appIdRegex = /^A\d{4}$/;
    if (!appIdRegex.test(form.app_id)) {
      showToast('Applicant ID must start with "A" followed by 4 digits (e.g., A0501)', true);
      return;
    }

    try {
      const res = await fetch('/api/applications', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      }).then(r => r.json());
      if (res.success) { showToast('Application submitted: ' + form.appl_id); onSuccess(); onClose(); }
      else showToast(res.error, true);
    } catch { showToast('Server error', true); }
  };

  return (
    <ModalShell onClose={onClose} title="New Application">
      <form onSubmit={submit}>
        <div className="form-group"><label>Application ID</label><input value={form.appl_id} onChange={set('appl_id')} placeholder="e.g. AP02501" required /></div>
        <div className="form-row">
          <div className="form-group"><label>Job ID</label><input value={form.job_id} onChange={set('job_id')} placeholder="e.g. J001" required /></div>
          <div className="form-group">
            <label>Applicant ID</label>
            <input 
              value={form.app_id} 
              onChange={set('app_id')} 
              placeholder="e.g. A0501" 
              pattern="A\d{4}"
              title="Must start with 'A' followed by exactly 4 digits (e.g., A0501)"
              required 
            />
          </div>
        </div>
        <button type="submit" className="btn btn-primary btn-full">Submit Application</button>
      </form>
    </ModalShell>
  );
}
