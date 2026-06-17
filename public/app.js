// ============================================================
// JobPortalDB — app.js
// Handles: Navigation, Chart.js charts, Pagination, Search/Filter,
//           CRUD Modals, Explain Analyzer, Matchmaking, Benchmark
// ============================================================

'use strict';

const API = '';

// ===== Utility: wait for Chart.js to load (it's deferred) =====
function waitForChartJs(cb) {
  if (typeof Chart !== 'undefined') { cb(); return; }
  const check = setInterval(() => { if (typeof Chart !== 'undefined') { clearInterval(check); cb(); } }, 60);
}

// ===== Theme Toggle =====
const themeBtn = document.getElementById('theme-toggle');
let isDark = true;
themeBtn.addEventListener('click', () => {
  isDark = !isDark;
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  themeBtn.textContent = isDark ? '🌙' : '☀️';
});

// ===== Modal helpers =====
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
document.querySelectorAll('.modal-overlay').forEach(o => {
  o.addEventListener('click', e => { if (e.target === o) o.classList.remove('open'); });
});

// ===== Toast =====
let toastTimer;
function showToast(msg, isError = false) {
  const t = document.getElementById('toast');
  clearTimeout(toastTimer);
  t.innerHTML = (isError ? '❌ ' : '✅ ') + msg;
  t.className = 'toast show' + (isError ? ' error' : '');
  toastTimer = setTimeout(() => { t.className = 'toast'; }, 3500);
}

// ===== Navigation =====
function switchSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('section-' + name).classList.add('active');
  const navBtn = document.querySelector(`[data-section="${name}"]`);
  if (navBtn) navBtn.classList.add('active');
  // Lazy-load section data
  const loaders = {
    dashboard: loadDashboard,
    jobs: () => { if (!allJobs.length) loadJobs(); },
    applicants: () => { if (!allApplicants.length) loadApplicants(); },
    applications: loadApplications,
    analytics: loadAnalytics,
    explore: loadExploreInit
  };
  loaders[name]?.();
}

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => switchSection(btn.dataset.section));
});

// ===== Animate Counter =====
function animateNumber(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let cur = 0;
  const step = Math.max(1, Math.floor(target / 30));
  const iv = setInterval(() => {
    cur += step;
    if (cur >= target) { cur = target; clearInterval(iv); }
    el.textContent = cur.toLocaleString('en-IN');
  }, 30);
}

// ===== DASHBOARD =====
async function loadDashboard() {
  try {
    const [jobs, applicants, applications, companies] = await Promise.all([
      fetch(API + '/api/jobs').then(r => r.json()),
      fetch(API + '/api/applicants').then(r => r.json()),
      fetch(API + '/api/applications?limit=1').then(r => r.json()),
      fetch(API + '/api/companies').then(r => r.json())
    ]);
    animateNumber('stat-jobs',          jobs.count          || 0);
    animateNumber('stat-applicants',    applicants.count    || 0);
    animateNumber('stat-applications',  applications.total  || 0);
    animateNumber('stat-companies',     companies.count     || 0);
  } catch {
    showToast('Could not load dashboard stats. Is the server running?', true);
  }
}

// ===== JOBS — with pagination & multi-filter =====
let allJobs = [];
let jobPage = 1;
const JOB_PAGE_SIZE = 12;
let jobSearchTimeout;

async function loadJobs() {
  const grid = document.getElementById('jobs-grid');
  grid.innerHTML = '<div class="skeleton skel-card"></div>'.repeat(6);
  try {
    const res = await fetch(API + '/api/jobs').then(r => r.json());
    allJobs = res.data || [];
    document.getElementById('jobs-count-label').textContent = allJobs.length.toLocaleString('en-IN');
    jobPage = 1;
    renderJobs();
  } catch {
    grid.innerHTML = '<div class="empty-state"><p>❌ Could not load jobs.</p></div>';
  }
}

function filterJobs() {
  const q    = document.getElementById('skill-filter').value.toLowerCase().trim();
  const mode = document.getElementById('filter-workmode').value;
  const type = document.getElementById('filter-type').value;
  const exp  = document.getElementById('filter-exp').value;

  return allJobs.filter(j => {
    const matchQ    = !q    || j.skills.some(s => s.toLowerCase().includes(q)) || j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q);
    const matchMode = !mode || (j.work_mode || '').includes(mode);
    const matchType = !type || (j.job_type  || '').includes(type);
    const matchExp  = !exp  || (j.experience_level || '').toLowerCase().includes(exp.toLowerCase());
    return matchQ && matchMode && matchType && matchExp;
  });
}

function renderJobs() {
  const filtered  = filterJobs();
  const totalPages = Math.ceil(filtered.length / JOB_PAGE_SIZE);
  jobPage = Math.min(jobPage, totalPages || 1);
  const pageJobs  = filtered.slice((jobPage - 1) * JOB_PAGE_SIZE, jobPage * JOB_PAGE_SIZE);
  const grid = document.getElementById('jobs-grid');

  if (!pageJobs.length) {
    grid.innerHTML = '<div class="empty-state"><p>No jobs match your filters.</p></div>';
    document.getElementById('jobs-pagination').innerHTML = '';
    return;
  }

  grid.innerHTML = pageJobs.map(j => `
    <div class="card">
      <div class="card-head">
        <div>
          <div class="card-title">${escHtml(j.title)}</div>
          <div class="card-sub">🏢 ${escHtml(j.company)} · ${escHtml(j.location)}</div>
        </div>
        <span class="card-badge">${escHtml(j.job_id)}</span>
      </div>
      <div class="skills-row">
        ${j.skills.slice(0, 7).map(s => `<span class="skill-tag">${escHtml(s)}</span>`).join('')}
        ${j.skills.length > 7 ? `<span class="skill-tag">+${j.skills.length - 7}</span>` : ''}
      </div>
      <div class="card-meta">
        <span>💰 ₹${(j.salary / 100000).toFixed(1)}L/yr</span>
        <span>📅 ${new Date(j.posted_on).toLocaleDateString('en-IN')}</span>
        ${j.work_mode ? `<span class="work-badge">${escHtml(j.work_mode)}</span>` : ''}
      </div>
    </div>
  `).join('');

  renderPagination('jobs-pagination', jobPage, totalPages, p => { jobPage = p; renderJobs(); });
}

// Debounced search + filter triggers
['skill-filter','filter-workmode','filter-type','filter-exp'].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('input', () => { clearTimeout(jobSearchTimeout); jobSearchTimeout = setTimeout(() => { jobPage = 1; renderJobs(); }, 250); });
  el.addEventListener('change', () => { jobPage = 1; renderJobs(); });
});
document.getElementById('skill-filter')?.addEventListener('keydown', e => { if (e.key === 'Enter') renderJobs(); });

// ===== APPLICANTS =====
let allApplicants = [];
async function loadApplicants() {
  const grid = document.getElementById('applicants-grid');
  grid.innerHTML = '<div class="skeleton skel-card"></div>'.repeat(4);
  try {
    const res = await fetch(API + '/api/applicants').then(r => r.json());
    allApplicants = res.data || [];
    renderApplicants(allApplicants);
    populateMatchDropdown();
  } catch {
    grid.innerHTML = '<div class="empty-state"><p>❌ Could not load applicants.</p></div>';
  }
}

function renderApplicants(list) {
  const grid = document.getElementById('applicants-grid');
  if (!list.length) { grid.innerHTML = '<div class="empty-state"><p>No applicants found.</p></div>'; return; }
  grid.innerHTML = list.map(a => `
    <div class="card">
      <div class="card-head">
        <div>
          <div class="card-title">${escHtml(a.name)}</div>
          <div class="card-sub">✉️ ${escHtml(a.email)}</div>
        </div>
        <span class="card-badge">${escHtml(a.app_id)}</span>
      </div>
      <div class="skills-row">
        ${a.skills.map(s => `<span class="skill-tag">${escHtml(s)}</span>`).join('')}
      </div>
      <div class="card-meta">
        <span>💼 ${a.experience} yr${a.experience !== 1 ? 's' : ''} exp</span>
        ${a.resume_link ? `<span><a href="${escHtml(a.resume_link)}" target="_blank" rel="noopener" style="color:var(--accent)">📄 Resume</a></span>` : ''}
      </div>
    </div>
  `).join('');
}

function searchApplicants() {
  const q = document.getElementById('applicant-search').value.toLowerCase();
  renderApplicants(allApplicants.filter(a =>
    a.name.toLowerCase().includes(q) ||
    a.skills.some(s => s.toLowerCase().includes(q))
  ));
}

// ===== APPLICATIONS — paginated =====
let appPage = 1;
const APP_PAGE_SIZE = 50;

async function loadApplications() {
  const tbody = document.getElementById('applications-tbody');
  tbody.innerHTML = '<tr><td colspan="8" class="loading-state">Loading…</td></tr>';
  const status = document.getElementById('app-status-filter')?.value || '';
  const url = `/api/applications?page=${appPage}&limit=${APP_PAGE_SIZE}${status ? '&status=' + status : ''}`;
  try {
    const res = await fetch(API + url).then(r => r.json());
    const apps = res.data || [];
    if (!apps.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No applications found.</td></tr>';
      document.getElementById('apps-pagination').innerHTML = '';
      return;
    }
    tbody.innerHTML = apps.map(a => `
      <tr>
        <td><strong>${escHtml(a.appl_id)}</strong></td>
        <td><span class="id-badge">${escHtml(a.job_id)}</span></td>
        <td>${escHtml(a.job_title || 'N/A')}</td>
        <td><span class="id-badge">${escHtml(a.app_id)}</span></td>
        <td>${escHtml(a.applicant_name || 'N/A')}</td>
        <td><span class="status-badge s-${a.status}">${a.status}</span></td>
        <td>${new Date(a.applied_on).toLocaleDateString('en-IN')}</td>
        <td>
          <select class="status-sel" onchange="updateStatus('${escHtml(a.appl_id)}', this.value)" id="sel-${escHtml(a.appl_id)}" aria-label="Update status for ${escHtml(a.appl_id)}">
            <option value="" disabled selected>Change…</option>
            ${['Applied','Shortlisted','Interview','Offered','Rejected'].map(s => `<option value="${s}">${s}</option>`).join('')}
          </select>
        </td>
      </tr>
    `).join('');
    renderPagination('apps-pagination', appPage, res.pages, p => { appPage = p; loadApplications(); });
  } catch {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-state">❌ Could not load applications.</td></tr>';
  }
}

// ===== Pagination renderer =====
function renderPagination(containerId, current, total, onPage) {
  const el = document.getElementById(containerId);
  if (!el || total <= 1) { if (el) el.innerHTML = ''; return; }
  const range = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) range.push(i);
  } else {
    range.push(1);
    if (current > 3) range.push('…');
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) range.push(i);
    if (current < total - 2) range.push('…');
    range.push(total);
  }
  el.innerHTML = `
    <button class="page-btn" ${current === 1 ? 'disabled' : ''} onclick="(${onPage.toString()})(${current - 1})" aria-label="Previous page">‹</button>
    ${range.map(r => r === '…'
      ? `<span class="page-info">…</span>`
      : `<button class="page-btn${r === current ? ' active' : ''}" onclick="(${onPage.toString()})(${r})" aria-label="Page ${r}">${r}</button>`
    ).join('')}
    <button class="page-btn" ${current === total ? 'disabled' : ''} onclick="(${onPage.toString()})(${current + 1})" aria-label="Next page">›</button>
    <span class="page-info">${current} / ${total}</span>
  `;
}

// ===== UPDATE APPLICATION STATUS =====
async function updateStatus(applId, status) {
  try {
    const res = await fetch(API + `/api/applications/${applId}/status`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status })
    }).then(r => r.json());
    if (res.success) { showToast(`${applId} updated to ${status}`); loadApplications(); }
    else showToast(res.error, true);
  } catch { showToast('Server error', true); }
}

// ===== CHART.JS ANALYTICS =====
const chartInstances = {};
function destroyChart(id) { if (chartInstances[id]) { chartInstances[id].destroy(); delete chartInstances[id]; } }

const PALETTE = ['#6366f1','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#22c55e','#06b6d4','#ef4444','#a78bfa','#fbbf24','#34d399','#f472b6'];
const STATUS_COLORS = { Applied:'#6366f1', Shortlisted:'#f59e0b', Interview:'#8b5cf6', Offered:'#22c55e', Rejected:'#ef4444' };

function chartDefaults() {
  return {
    plugins: { legend: { labels: { color: '#9ca3c4', font: { family: 'Inter', size: 11 } } } },
    scales: {
      x: { ticks: { color: '#9ca3c4', font: { family: 'Inter', size: 11 } }, grid: { color: 'rgba(99,102,241,.07)' } },
      y: { ticks: { color: '#9ca3c4', font: { family: 'Inter', size: 11 } }, grid: { color: 'rgba(99,102,241,.07)' } }
    }
  };
}

async function loadAnalytics() {
  waitForChartJs(async () => {
    try {
      const [skillRes, funnelRes, companyRes, salaryRes, locationRes] = await Promise.all([
        fetch(API + '/api/analytics/skill-demand?limit=15').then(r => r.json()),
        fetch(API + '/api/analytics/application-funnel').then(r => r.json()),
        fetch(API + '/api/analytics/jobs-per-company?limit=12').then(r => r.json()),
        fetch(API + '/api/analytics/salary-distribution').then(r => r.json()),
        fetch(API + '/api/analytics/jobs-by-location').then(r => r.json())
      ]);

      // Chart 1: Skill Demand — horizontal bar
      destroyChart('chart-skills');
      const sd = skillRes.data || [];
      chartInstances['chart-skills'] = new Chart(document.getElementById('chart-skills'), {
        type: 'bar',
        data: {
          labels: sd.map(d => d.skill),
          datasets: [{ label: 'Job Postings', data: sd.map(d => d.count), backgroundColor: PALETTE, borderRadius: 6, borderSkipped: false }]
        },
        options: { ...chartDefaults(), indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: chartDefaults().scales.x, y: { ...chartDefaults().scales.y, ticks: { ...chartDefaults().scales.y.ticks, maxRotation: 0 } } } }
      });

      // Chart 2: Application Funnel — doughnut
      destroyChart('chart-funnel');
      const fd = funnelRes.data || [];
      const funnelTotal = fd.reduce((sum, d) => sum + d.count, 0);
      chartInstances['chart-funnel'] = new Chart(document.getElementById('chart-funnel'), {
        type: 'doughnut',
        data: {
          labels: fd.map(d => {
            const pct = funnelTotal > 0 ? ((d.count / funnelTotal) * 100).toFixed(1) : 0;
            return `${d.status} (${pct}%)`;
          }),
          datasets: [{ data: fd.map(d => d.count), backgroundColor: fd.map(d => STATUS_COLORS[d.status] || '#64748b'), borderWidth: 2, borderColor: 'transparent' }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '62%',
          plugins: {
            legend: {
              position: 'right',
              labels: {
                color: '#9ca3c4',
                font: { family: 'Inter', size: 11 },
                padding: 14
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label.split(' (')[0] || '';
                  const value = context.raw;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) + '%' : '0%';
                  return ` ${label}: ${value.toLocaleString('en-IN')} (${percentage})`;
                }
              }
            }
          }
        },
        plugins: [{
          id: 'slicePercentage',
          afterDraw(chart) {
            const { ctx } = chart;
            ctx.save();
            chart.data.datasets.forEach((dataset, i) => {
              const meta = chart.getDatasetMeta(i);
              const total = dataset.data.reduce((a, b) => a + b, 0);
              if (total === 0) return;
              meta.data.forEach((element, index) => {
                const value = dataset.data[index];
                const ratio = value / total;
                // Only draw labels for slices > 3% to avoid overlaps
                if (ratio > 0.03) {
                  const { x, y } = element.tooltipPosition();
                  const percentage = (ratio * 100).toFixed(0) + '%';
                  
                  // Text and drop-shadow styling
                  ctx.fillStyle = '#ffffff';
                  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
                  ctx.shadowBlur = 4;
                  ctx.shadowOffsetX = 1;
                  ctx.shadowOffsetY = 1;
                  ctx.font = 'bold 10px Inter, sans-serif';
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillText(percentage, x, y);
                  
                  // Reset shadow
                  ctx.shadowColor = 'transparent';
                  ctx.shadowBlur = 0;
                  ctx.shadowOffsetX = 0;
                  ctx.shadowOffsetY = 0;
                }
              });
            });
            ctx.restore();
          }
        }]
      });

      // Chart 3: Jobs Per Company — vertical bar
      destroyChart('chart-company');
      const cd = companyRes.data || [];
      chartInstances['chart-company'] = new Chart(document.getElementById('chart-company'), {
        type: 'bar',
        data: {
          labels: cd.map(d => d.company.length > 14 ? d.company.slice(0,12) + '…' : d.company),
          datasets: [
            { label: 'Job Count', data: cd.map(d => d.totalJobs), backgroundColor: '#6366f1', borderRadius: 5, yAxisID: 'y' },
            { label: 'Avg Salary (₹L)', data: cd.map(d => +(d.avgSalary / 100000).toFixed(1)), backgroundColor: '#14b8a6', borderRadius: 5, yAxisID: 'y2', type: 'line', tension: .4, fill: false, borderColor: '#14b8a6', pointBackgroundColor: '#14b8a6' }
          ]
        },
        options: { ...chartDefaults(), plugins: { legend: { labels: { color: '#9ca3c4', font: { family: 'Inter' } } } }, scales: { x: chartDefaults().scales.x, y: { ...chartDefaults().scales.y, position: 'left' }, y2: { ...chartDefaults().scales.y, position: 'right', grid: { drawOnChartArea: false } } } }
      });

      // Chart 4: Salary by Experience — bar
      destroyChart('chart-salary');
      const salD = salaryRes.data || [];
      chartInstances['chart-salary'] = new Chart(document.getElementById('chart-salary'), {
        type: 'bar',
        data: {
          labels: salD.map(d => d.level),
          datasets: [
            { label: 'Avg ₹L', data: salD.map(d => +(d.avgSalary / 100000).toFixed(1)), backgroundColor: '#8b5cf6', borderRadius: 6 },
            { label: 'Max ₹L', data: salD.map(d => +(d.maxSalary / 100000).toFixed(1)), backgroundColor: '#ec4899', borderRadius: 6 }
          ]
        },
        options: { ...chartDefaults(), plugins: { legend: { labels: { color: '#9ca3c4', font: { family: 'Inter' } } } } }
      });

      // Chart 5: Jobs by Location — horizontal bar
      destroyChart('chart-location');
      const ld = locationRes.data || [];
      chartInstances['chart-location'] = new Chart(document.getElementById('chart-location'), {
        type: 'bar',
        data: {
          labels: ld.map(d => d.city),
          datasets: [{ label: 'Job Listings', data: ld.map(d => d.count), backgroundColor: PALETTE, borderRadius: 6, borderSkipped: false }]
        },
        options: { ...chartDefaults(), indexAxis: 'y', plugins: { legend: { display: false } } }
      });

    } catch (e) {
      console.error('Analytics load error:', e);
      showToast('Could not load analytics charts.', true);
    }
  });
}

// ===== EXPLORE DB — Init =====
function loadExploreInit() {
  if (!allApplicants.length) {
    fetch(API + '/api/applicants').then(r => r.json()).then(res => {
      allApplicants = res.data || [];
      populateMatchDropdown();
    });
  }
}

function populateMatchDropdown() {
  const sel = document.getElementById('match-applicant-select');
  if (!sel || !allApplicants.length) return;
  const sample = allApplicants.slice(0, 50);
  sel.innerHTML = '<option value="">Select an applicant…</option>' +
    sample.map(a => `<option value="${escHtml(a.app_id)}">${escHtml(a.name)} (${escHtml(a.app_id)})</option>`).join('');
}

// ===== EXPLAIN ANALYZER =====
async function runExplain() {
  const skill = document.getElementById('explain-skill').value.trim();
  if (!skill) { showToast('Please enter a skill name.', true); return; }
  const btn = document.getElementById('btn-run-explain');
  btn.textContent = 'Running…'; btn.disabled = true;
  const out = document.getElementById('explain-output');
  out.innerHTML = '<div class="loading-state">Running explain queries on MongoDB…</div>';
  try {
    const res = await fetch(API + `/api/analytics/explain/${encodeURIComponent(skill)}`).then(r => r.json());
    if (!res.success) { out.innerHTML = `<div class="empty-state"><p>❌ ${escHtml(res.error)}</p></div>`; return; }

    const { indexed, natural } = res;
    const speedup = natural.executionTimeMs > 0 ? (natural.executionTimeMs / Math.max(1, indexed.executionTimeMs)).toFixed(1) : '∞';

    out.innerHTML = `
      <div class="explain-grid">
        <div class="explain-panel ixscan">
          <div class="explain-title">
            <span class="stage-badge stage-IXSCAN">IXSCAN</span>
            With Multikey Index
          </div>
          <div class="explain-metrics">
            <div class="metric good">
              <span class="metric-val">${indexed.executionTimeMs}ms</span>
              <div class="metric-lbl">Execution Time</div>
            </div>
            <div class="metric good">
              <span class="metric-val">${indexed.keysExamined.toLocaleString()}</span>
              <div class="metric-lbl">Keys Examined</div>
            </div>
            <div class="metric good">
              <span class="metric-val">${indexed.docsExamined.toLocaleString()}</span>
              <div class="metric-lbl">Docs Examined</div>
            </div>
            <div class="metric good">
              <span class="metric-val">${indexed.docsReturned.toLocaleString()}</span>
              <div class="metric-lbl">Docs Returned</div>
            </div>
          </div>
        </div>
        <div class="explain-panel collscan">
          <div class="explain-title">
            <span class="stage-badge stage-COLLSCAN">COLLSCAN</span>
            Without Index (Natural)
          </div>
          <div class="explain-metrics">
            <div class="metric bad">
              <span class="metric-val">${natural.executionTimeMs}ms</span>
              <div class="metric-lbl">Execution Time</div>
            </div>
            <div class="metric bad">
              <span class="metric-val">${natural.keysExamined.toLocaleString()}</span>
              <div class="metric-lbl">Keys Examined</div>
            </div>
            <div class="metric bad">
              <span class="metric-val">${natural.docsExamined.toLocaleString()}</span>
              <div class="metric-lbl">Docs Examined</div>
            </div>
            <div class="metric bad">
              <span class="metric-val">${natural.docsReturned.toLocaleString()}</span>
              <div class="metric-lbl">Docs Returned</div>
            </div>
          </div>
        </div>
      </div>
      <div class="speedup-badge">
        <strong>${speedup}x faster</strong>
        Index scan examined ${(natural.docsExamined / Math.max(1,indexed.docsExamined)).toFixed(0)}x fewer documents than collection scan
      </div>
    `;
  } catch (e) {
    out.innerHTML = '<div class="empty-state"><p>❌ Explain query failed.</p></div>';
  } finally {
    btn.textContent = 'Run Explain'; btn.disabled = false;
  }
}

// ===== SKILL MATCHMAKING =====
async function runMatchmaking() {
  const sel = document.getElementById('match-applicant-select');
  const appId = sel?.value;
  if (!appId) { showToast('Please select an applicant.', true); return; }
  const btn = document.getElementById('btn-run-match');
  btn.textContent = 'Matching…'; btn.disabled = true;
  const out = document.getElementById('match-output');
  out.innerHTML = '<div class="loading-state">Running $setIntersection aggregation…</div>';
  try {
    const res = await fetch(API + `/api/analytics/match/${encodeURIComponent(appId)}`).then(r => r.json());
    if (!res.success || !res.matches.length) {
      out.innerHTML = '<div class="empty-state"><p>No matching jobs found for this applicant.</p></div>'; return;
    }
    const applicantSkillsSet = new Set(res.applicant.skills.map(s => s.toLowerCase()));
    out.innerHTML = `
      <p style="font-size:.78rem;color:var(--text-2);margin-bottom:12px;">
        Skills: ${res.applicant.skills.map(s => `<span class="skill-tag">${escHtml(s)}</span>`).join(' ')}
      </p>
      ${res.matches.map(m => `
        <div class="match-score">
          <div class="match-pct">${m.matchPercentage}%</div>
          <div class="match-info">
            <div class="match-title">${escHtml(m.title)}</div>
            <div class="match-sub">🏢 ${escHtml(m.company)} · ${escHtml(m.location)} · ${escHtml(m.work_mode || '')}</div>
            <div style="margin-top:5px;display:flex;flex-wrap:wrap;gap:4px;">
              ${m.skills.slice(0, 6).map(s => `<span class="skill-tag ${applicantSkillsSet.has(s.toLowerCase()) ? 'matched' : 'missing'}">${escHtml(s)}</span>`).join('')}
            </div>
          </div>
          <div class="match-salary">₹${(m.salary / 100000).toFixed(1)}L</div>
        </div>
      `).join('')}
    `;
  } catch {
    out.innerHTML = '<div class="empty-state"><p>❌ Matchmaking failed.</p></div>';
  } finally {
    btn.textContent = 'Find Matches'; btn.disabled = false;
  }
}

// ===== REDUNDANCY BENCHMARK =====
async function runBenchmark() {
  const btn = document.getElementById('btn-run-bench');
  btn.textContent = 'Running…'; btn.disabled = true;
  const out = document.getElementById('bench-output');
  out.innerHTML = '<div class="loading-state">Running 20 iterations of each strategy…</div>';
  try {
    const res = await fetch(API + '/api/analytics/benchmark').then(r => r.json());
    if (!res.success) { out.innerHTML = `<div class="empty-state"><p>❌ ${escHtml(res.error)}</p></div>`; return; }
    const isFaster = parseFloat(res.speedupFactor) > 1;
    out.innerHTML = `
      <div class="bench-result">
        <div class="bench-card">
          <div class="bench-ms slow">${res.normalized.avgMs}ms</div>
          <div class="bench-lbl">Avg per query</div>
          <div style="font-size:.85rem;font-weight:700;margin-top:6px;">Normalized</div>
          <div class="bench-strat">${res.normalized.strategy}</div>
        </div>
        <div class="bench-card">
          <div class="bench-ms fast">${res.denormalized.avgMs}ms</div>
          <div class="bench-lbl">Avg per query</div>
          <div style="font-size:.85rem;font-weight:700;margin-top:6px;">Denormalized</div>
          <div class="bench-strat">${res.denormalized.strategy}</div>
        </div>
      </div>
      <div class="speedup-badge" style="margin-top:14px;">
        <strong>${isFaster ? res.speedupFactor + 'x faster' : 'Similar speed'}</strong>
        ${isFaster ? 'Denormalized read is faster — no $lookup join overhead' : 'Results may vary with larger datasets'}
      </div>
    `;
  } catch {
    out.innerHTML = '<div class="empty-state"><p>❌ Benchmark failed.</p></div>';
  } finally {
    btn.textContent = 'Run Benchmark (20 iterations)'; btn.disabled = false;
  }
}

// ===== CRUD: Add Job =====
async function addJob(e) {
  e.preventDefault();
  const data = {
    job_id:           document.getElementById('job-id').value.trim(),
    title:            document.getElementById('job-title').value.trim(),
    company:          document.getElementById('job-company').value.trim(),
    skills:           document.getElementById('job-skills').value.split(',').map(s => s.trim()).filter(Boolean),
    salary:           Number(document.getElementById('job-salary').value),
    location:         document.getElementById('job-location').value.trim(),
    job_type:         document.getElementById('job-type-inp').value,
    work_mode:        document.getElementById('job-workmode').value,
    experience_level: document.getElementById('job-exp-level').value
  };
  try {
    const res = await fetch(API + '/api/jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json());
    if (res.success) {
      showToast('Job created: ' + data.title);
      document.getElementById('add-job-form').reset();
      closeModal('add-job-modal');
      allJobs = []; loadJobs();
    } else showToast(res.error, true);
  } catch { showToast('Server error', true); }
}

// ===== CRUD: Add Applicant =====
async function addApplicant(e) {
  e.preventDefault();
  const data = {
    app_id:     document.getElementById('applicant-id').value.trim(),
    name:       document.getElementById('applicant-name').value.trim(),
    email:      document.getElementById('applicant-email').value.trim(),
    skills:     document.getElementById('applicant-skills').value.split(',').map(s => s.trim()).filter(Boolean),
    experience: Number(document.getElementById('applicant-exp').value),
    resume_link: document.getElementById('applicant-resume').value.trim()
  };
  try {
    const res = await fetch(API + '/api/applicants', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json());
    if (res.success) {
      showToast('Applicant registered: ' + data.name);
      document.getElementById('add-applicant-form').reset();
      closeModal('add-applicant-modal');
      allApplicants = []; loadApplicants();
    } else showToast(res.error, true);
  } catch { showToast('Server error', true); }
}

// ===== CRUD: Add Application =====
async function addApplication(e) {
  e.preventDefault();
  const data = {
    appl_id: document.getElementById('application-id').value.trim(),
    job_id:  document.getElementById('application-job').value.trim(),
    app_id:  document.getElementById('application-app').value.trim()
  };
  try {
    const res = await fetch(API + '/api/applications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json());
    if (res.success) {
      showToast('Application submitted: ' + data.appl_id);
      document.getElementById('add-application-form').reset();
      closeModal('add-application-modal');
      loadApplications();
    } else showToast(res.error, true);
  } catch { showToast('Server error', true); }
}

// ===== XSS protection =====
function escHtml(str) {
  if (str == null) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ===== Init =====
loadDashboard();
