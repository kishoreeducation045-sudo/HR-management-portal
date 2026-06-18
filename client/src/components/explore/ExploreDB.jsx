import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RadarMatchChart from './RadarMatchChart';

function ExplainAnalyzer() {
  const [skill, setSkill] = useState('Python');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!skill.trim()) return;
    setLoading(true); setResult(null);
    try {
      const res = await fetch(`/api/analytics/explain/${encodeURIComponent(skill)}`).then(r => r.json());
      if (res.success) setResult(res);
    } catch {}
    setLoading(false);
  };

  const speedup = result ? (result.natural.executionTimeMs > 0
    ? (result.natural.executionTimeMs / Math.max(1, result.indexed.executionTimeMs)).toFixed(1)
    : '∞') : null;

  return (
    <div className="a-card" style={{ gridColumn: '1 / -1' }}>
      <div className="a-head">
        <h3>🔍 Index Explain Analyzer</h3>
        <span className="pipe-badge">COLLSCAN vs IXSCAN</span>
      </div>
      <p className="a-desc">Enter any skill and compare MongoDB&apos;s query execution <em>with</em> and <em>without</em> the multikey index on <code>skills[]</code>. This proves why indexing is critical for performance at scale.</p>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div className="searchbox" style={{ flex: 1, minWidth: 200 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={skill} onChange={e => setSkill(e.target.value)} onKeyDown={e => e.key === 'Enter' && run()} placeholder="Enter a skill (e.g. Python, React, AWS)…" />
        </div>
        <button className="btn btn-primary" onClick={run} disabled={loading}>
          {loading ? 'Running…' : 'Run Explain'}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {result && (
          <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="explain-grid">
              {/* IXSCAN */}
              <motion.div className="explain-panel ixscan" initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.4 }}>
                <div className="explain-title"><span className="stage-badge stage-IXSCAN">IXSCAN</span> With Multikey Index</div>
                <div className="explain-metrics">
                  {[['Execution Time', `${result.indexed.executionTimeMs}ms`], ['Keys Examined', result.indexed.keysExamined.toLocaleString()], ['Docs Examined', result.indexed.docsExamined.toLocaleString()], ['Docs Returned', result.indexed.docsReturned.toLocaleString()]].map(([lbl, val]) => (
                    <div key={lbl} className="metric good"><span className="metric-val">{val}</span><div className="metric-lbl">{lbl}</div></div>
                  ))}
                </div>
              </motion.div>
              {/* COLLSCAN */}
              <motion.div className="explain-panel collscan" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.4 }}>
                <div className="explain-title"><span className="stage-badge stage-COLLSCAN">COLLSCAN</span> Without Index (Natural)</div>
                <div className="explain-metrics">
                  {[['Execution Time', `${result.natural.executionTimeMs}ms`], ['Keys Examined', result.natural.keysExamined.toLocaleString()], ['Docs Examined', result.natural.docsExamined.toLocaleString()], ['Docs Returned', result.natural.docsReturned.toLocaleString()]].map(([lbl, val]) => (
                    <div key={lbl} className="metric bad"><span className="metric-val">{val}</span><div className="metric-lbl">{lbl}</div></div>
                  ))}
                </div>
              </motion.div>
            </div>
            <motion.div className="speedup-badge" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <strong>{speedup}x faster</strong>
              Index scan examined {(result.natural.docsExamined / Math.max(1, result.indexed.docsExamined)).toFixed(0)}x fewer documents than collection scan
            </motion.div>
          </motion.div>
        )}
        {!result && !loading && (
          <p className="empty-state"><p>Enter a skill and click <strong>Run Explain</strong> to see the comparison.</p></p>
        )}
      </AnimatePresence>
    </div>
  );
}

function RadarMatch({ allApplicants }) {
  const [appId, setAppId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!appId) return;
    setLoading(true); setResult(null);
    try {
      const res = await fetch(`/api/analytics/match/${encodeURIComponent(appId)}`).then(r => r.json());
      if (res.success) setResult(res);
    } catch {}
    setLoading(false);
  };

  return (
    <div className="a-card">
      <div className="a-head">
        <h3>🎯 Skill Match Radar</h3>
        <span className="pipe-badge">$setIntersection</span>
      </div>
      <p className="a-desc">Select an applicant to visualise their skill compatibility against top job matches using an interactive radar chart — overlaying applicant skills vs job requirements.</p>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <select className="filter-select" style={{ flex: 1 }} value={appId} onChange={e => setAppId(e.target.value)}>
          <option value="">Select an applicant…</option>
          {allApplicants.slice(0, 50).map(a => (
            <option key={a.app_id} value={a.app_id}>{a.name} ({a.app_id})</option>
          ))}
        </select>
        <button className="btn btn-primary" onClick={run} disabled={loading || !appId}>
          {loading ? 'Matching…' : 'Find Matches'}
        </button>
      </div>

      {result && result.matches.length > 0 && (
        <div>
          <p style={{ fontSize: '.78rem', color: 'var(--text-2)', marginBottom: 10 }}>
            Skills: {result.applicant.skills.map(s => <span key={s} className="skill-tag" style={{ marginRight: 4 }}>{s}</span>)}
          </p>
          {result.matches.slice(0, 3).map((job, i) => (
            <RadarMatchChart
              key={i}
              applicantName={result.applicant.name}
              applicantSkills={result.applicant.skills}
              job={job}
            />
          ))}
        </div>
      )}
      {result && result.matches.length === 0 && <div className="empty-state"><p>No matching jobs found.</p></div>}
      {!result && !loading && <div className="empty-state"><p>Select an applicant to begin radar matchmaking.</p></div>}
    </div>
  );
}

function Benchmark() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true); setResult(null);
    try {
      const res = await fetch('/api/analytics/benchmark').then(r => r.json());
      if (res.success) setResult(res);
    } catch {}
    setLoading(false);
  };

  return (
    <div className="a-card">
      <div className="a-head">
        <h3>⚡ Redundancy Benchmark</h3>
        <span className="pipe-badge">Normalized vs Denormalized</span>
      </div>
      <p className="a-desc">Measures the performance difference between a <strong>normalized query</strong> (using <code>$lookup</code> across 3 collections) and a <strong>denormalized query</strong> (direct field read — no join).</p>

      <div style={{ marginBottom: 14 }}>
        <button className="btn btn-primary" onClick={run} disabled={loading}>
          {loading ? 'Running 20 iterations…' : 'Run Benchmark (20 iterations)'}
        </button>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="bench-result">
              <div className="bench-card">
                <div className="bench-ms slow">{result.normalized.avgMs}ms</div>
                <div className="bench-lbl">Avg per query</div>
                <div style={{ fontWeight: 700, marginTop: 6 }}>Normalized</div>
                <div className="bench-strat">{result.normalized.strategy}</div>
              </div>
              <div className="bench-card">
                <div className="bench-ms fast">{result.denormalized.avgMs}ms</div>
                <div className="bench-lbl">Avg per query</div>
                <div style={{ fontWeight: 700, marginTop: 6 }}>Denormalized</div>
                <div className="bench-strat">{result.denormalized.strategy}</div>
              </div>
            </div>
            <div className="speedup-badge" style={{ marginTop: 14 }}>
              <strong>{parseFloat(result.speedupFactor) > 1 ? result.speedupFactor + 'x faster' : 'Similar speed'}</strong>
              {parseFloat(result.speedupFactor) > 1 ? 'Denormalized read is faster — no $lookup join overhead' : 'Results may vary with larger datasets'}
            </div>
          </motion.div>
        )}
        {!result && !loading && <div className="empty-state"><p>Click <strong>Run Benchmark</strong> to compare query strategies.</p></div>}
      </AnimatePresence>
    </div>
  );
}

export default function ExploreDB() {
  const [allApplicants, setAllApplicants] = useState([]);

  useEffect(() => {
    fetch('/api/applicants').then(r => r.json()).then(r => setAllApplicants(r.data || [])).catch(() => {});
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}>
      <div className="page-header">
        <h2>Explore DB Features</h2>
        <p>Interactive database demos — Index Explain Analyzer · Skill Radar Matching · Redundancy Benchmark</p>
      </div>
      <div className="analytics-grid">
        <ExplainAnalyzer />
        <RadarMatch allApplicants={allApplicants} />
        <Benchmark />
      </div>
    </motion.div>
  );
}
