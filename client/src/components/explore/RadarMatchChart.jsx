import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Chart as ChartJS, RadialLinearScale, PointElement,
  LineElement, Filler, Tooltip, Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

/**
 * Props:
 *  applicantName  — string
 *  applicantSkills — string[]
 *  job            — { title, company, skills[], matchPercentage }
 */
export default function RadarMatchChart({ applicantName, applicantSkills, job }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  // Build axes from union of both skill sets (max 8 for readability)
  const appSet = new Set(applicantSkills.map(s => s.toLowerCase()));
  const jobSet = new Set(job.skills.map(s => s.toLowerCase()));
  const union = [...new Set([...appSet, ...jobSet])].slice(0, 8);
  const labels = union.map(s => s.charAt(0).toUpperCase() + s.slice(1));

  const appData = union.map(s => appSet.has(s) ? 1 : 0);
  const jobData = union.map(s => jobSet.has(s) ? 1 : 0);

  const data = {
    labels,
    datasets: [
      {
        label: applicantName,
        data: appData,
        backgroundColor: 'rgba(99,102,241,0.25)',
        borderColor: '#6366f1',
        borderWidth: 2,
        pointBackgroundColor: '#6366f1',
        pointRadius: 4,
      },
      {
        label: job.title,
        data: jobData,
        backgroundColor: 'rgba(139,92,246,0.18)',
        borderColor: '#a78bfa',
        borderWidth: 2,
        pointBackgroundColor: '#a78bfa',
        pointRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#9ca3c4', font: { family: 'Inter', size: 11 }, padding: 12 },
      },
      tooltip: {
        callbacks: {
          label: ctx => `${ctx.dataset.label}: ${ctx.raw === 1 ? '✅ Has this skill' : '❌ Missing'}`,
        },
      },
    },
    scales: {
      r: {
        min: 0, max: 1,
        ticks: { display: false, stepSize: 1 },
        grid: { color: 'rgba(99,102,241,.15)' },
        angleLines: { color: 'rgba(99,102,241,.15)' },
        pointLabels: { color: '#9ca3c4', font: { family: 'Inter', size: 11 } },
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.88 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{
        background: 'rgba(0,0,0,0.2)',
        border: '1px solid rgba(99,102,241,0.15)',
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
      }}
    >
      {/* Match percentage badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div className="match-pct" style={{ fontSize: '.95rem' }}>{job.matchPercentage}%</div>
        <div>
          <div className="match-title">{job.title}</div>
          <div className="match-sub">🏢 {job.company}</div>
        </div>
        <div className="match-salary" style={{ marginLeft: 'auto' }}>
          ₹{(job.salary / 100000).toFixed(1)}L
        </div>
      </div>
      <div className="radar-wrap">
        <Radar data={data} options={options} />
      </div>
    </motion.div>
  );
}
