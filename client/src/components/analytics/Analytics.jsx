import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend, Filler);

const PALETTE = ['#6366f1','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#22c55e','#06b6d4','#ef4444','#a78bfa','#fbbf24','#34d399','#f472b6'];
const STATUS_COLORS = { Applied:'#6366f1', Shortlisted:'#f59e0b', Interview:'#8b5cf6', Offered:'#22c55e', Rejected:'#ef4444' };
const TICK = { color: '#9ca3c4', font: { family: 'Inter', size: 11 } };
const GRID = { color: 'rgba(99,102,241,.07)' };

// Inline % plugin for doughnut
const slicePercentagePlugin = {
  id: 'slicePercentage',
  afterDraw(chart) {
    const { ctx } = chart;
    ctx.save();
    chart.data.datasets.forEach((dataset, i) => {
      const meta = chart.getDatasetMeta(i);
      const total = dataset.data.reduce((a, b) => a + b, 0);
      if (!total) return;
      meta.data.forEach((element, index) => {
        const value = dataset.data[index];
        const ratio = value / total;
        if (ratio > 0.03) {
          const { x, y } = element.tooltipPosition();
          ctx.fillStyle = '#fff';
          ctx.shadowColor = 'rgba(0,0,0,0.6)';
          ctx.shadowBlur = 4;
          ctx.font = 'bold 10px Inter,sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText((ratio * 100).toFixed(0) + '%', x, y);
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
        }
      });
    });
    ctx.restore();
  },
};

function ACard({ title, badge, desc, children, full }) {
  return (
    <motion.div
      className="a-card" style={full ? { gridColumn: '1 / -1' } : {}}
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
    >
      <div className="a-head">
        <h3>{title}</h3>
        <span className="pipe-badge">{badge}</span>
      </div>
      <p className="a-desc">{desc}</p>
      {children}
    </motion.div>
  );
}

export default function Analytics() {
  const [skillData, setSkillData]   = useState(null);
  const [funnelData, setFunnelData] = useState(null);
  const [companyData, setCompanyData] = useState(null);
  const [salaryData, setSalaryData] = useState(null);
  const [locationData, setLocationData] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [sd, fd, cd, salary, loc] = await Promise.all([
          fetch('/api/analytics/skill-demand?limit=15').then(r => r.json()),
          fetch('/api/analytics/application-funnel').then(r => r.json()),
          fetch('/api/analytics/jobs-per-company?limit=12').then(r => r.json()),
          fetch('/api/analytics/salary-distribution').then(r => r.json()),
          fetch('/api/analytics/jobs-by-location').then(r => r.json()),
        ]);
        setSkillData(sd.data || []);
        setFunnelData(fd.data || []);
        setCompanyData(cd.data || []);
        setSalaryData(salary.data || []);
        setLocationData(loc.data || []);
      } catch {}
    })();
  }, []);

  const funnelTotal = (funnelData || []).reduce((s, d) => s + d.count, 0);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}>
      <div className="page-header">
        <h2>Analytics — Aggregation Pipelines</h2>
        <p>Live MongoDB aggregation results — the core DBMS demonstration</p>
      </div>
      <div className="analytics-grid">

        {/* Skill Demand */}
        <ACard title="📊 Skill Demand Analysis" badge="$unwind → $group → $sort"
          desc={<>Deconstructs each job&apos;s <code>skills[]</code> array, groups by skill name, and counts market demand across <strong>5,000+ listings</strong>.</>}>
          <div className="chart-wrap">
            {skillData ? (
              <Bar data={{ labels: skillData.map(d => d.skill), datasets: [{ label: 'Job Postings', data: skillData.map(d => d.count), backgroundColor: PALETTE, borderRadius: 6 }] }}
                options={{ responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { ticks: TICK, grid: GRID }, y: { ticks: { ...TICK, maxRotation: 0 }, grid: GRID } } }} />
            ) : <div className="skeleton" style={{ height: '100%' }} />}
          </div>
        </ACard>

        {/* Application Funnel */}
        <ACard title="📈 Application Funnel" badge="$group → $sort"
          desc="Groups all applications by their status to visualise the hiring funnel — from Applied to Offered or Rejected.">
          <div className="chart-wrap-sm">
            {funnelData ? (
              <Doughnut
                data={{
                  labels: funnelData.map(d => `${d.status} (${funnelTotal > 0 ? ((d.count / funnelTotal) * 100).toFixed(1) : 0}%)`),
                  datasets: [{ data: funnelData.map(d => d.count), backgroundColor: funnelData.map(d => STATUS_COLORS[d.status] || '#64748b'), borderWidth: 2, borderColor: 'transparent' }],
                }}
                options={{ responsive: true, maintainAspectRatio: false, cutout: '62%', plugins: {
                  legend: { position: 'right', labels: { color: '#9ca3c4', font: { family: 'Inter', size: 11 }, padding: 14 } },
                  tooltip: { callbacks: { label: ctx => { const v = ctx.raw; const t = ctx.dataset.data.reduce((a,b)=>a+b,0); return ` ${ctx.label.split(' (')[0]}: ${v.toLocaleString('en-IN')} (${t>0?((v/t)*100).toFixed(1):0}%)`; } } }
                }}}
                plugins={[slicePercentagePlugin]}
              />
            ) : <div className="skeleton" style={{ height: '100%' }} />}
          </div>
        </ACard>

        {/* Jobs Per Company */}
        <ACard title="🏢 Jobs Per Company" badge="$group → $sort"
          desc="Groups jobs by company name, counting listings and calculating average salary. Sorted by total job count descending.">
          <div className="chart-wrap">
            {companyData ? (
              <Bar
                data={{ labels: companyData.map(d => d.company.length > 14 ? d.company.slice(0,12)+'…' : d.company),
                  datasets: [
                    { label: 'Job Count', data: companyData.map(d => d.totalJobs), backgroundColor: '#6366f1', borderRadius: 5, yAxisID: 'y' },
                    { label: 'Avg Salary (₹L)', data: companyData.map(d => +(d.avgSalary/100000).toFixed(1)), backgroundColor: '#14b8a6', borderRadius: 5, yAxisID: 'y2', type: 'line', tension: .4, fill: false, borderColor: '#14b8a6', pointBackgroundColor: '#14b8a6' },
                  ] }}
                options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#9ca3c4', font: { family: 'Inter' } } } }, scales: { x: { ticks: TICK, grid: GRID }, y: { ticks: TICK, grid: GRID, position: 'left' }, y2: { ticks: TICK, grid: { drawOnChartArea: false }, position: 'right' } } }}
              />
            ) : <div className="skeleton" style={{ height: '100%' }} />}
          </div>
        </ACard>

        {/* Salary by Experience */}
        <ACard title="💰 Salary by Experience" badge="$match → $group → $sort"
          desc="Aggregates salary statistics grouped by experience level — shows the average, minimum, and maximum salary at each career stage.">
          <div className="chart-wrap">
            {salaryData ? (
              <Bar
                data={{ labels: salaryData.map(d => d.level),
                  datasets: [
                    { label: 'Avg ₹L', data: salaryData.map(d => +(d.avgSalary/100000).toFixed(1)), backgroundColor: '#8b5cf6', borderRadius: 6 },
                    { label: 'Max ₹L', data: salaryData.map(d => +(d.maxSalary/100000).toFixed(1)), backgroundColor: '#ec4899', borderRadius: 6 },
                  ] }}
                options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#9ca3c4', font: { family: 'Inter' } } } }, scales: { x: { ticks: TICK, grid: GRID }, y: { ticks: TICK, grid: GRID } } }}
              />
            ) : <div className="skeleton" style={{ height: '100%' }} />}
          </div>
        </ACard>

        {/* Jobs by Location */}
        <ACard title="📍 Jobs by City" badge="$group → $sort → $limit"
          desc="Groups job postings by city and ranks the top 10 hiring hubs in India, with average salary overlay.">
          <div className="chart-wrap">
            {locationData ? (
              <Bar
                data={{ labels: locationData.map(d => d.city), datasets: [{ label: 'Job Listings', data: locationData.map(d => d.count), backgroundColor: PALETTE, borderRadius: 6 }] }}
                options={{ responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { ticks: TICK, grid: GRID }, y: { ticks: TICK, grid: GRID } } }}
              />
            ) : <div className="skeleton" style={{ height: '100%' }} />}
          </div>
        </ACard>

      </div>
    </motion.div>
  );
}
